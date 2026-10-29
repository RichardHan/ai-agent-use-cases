'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {waitForPublishedAssets,PUBLICATION_TIMEOUT_MS}=require('../scripts/published-assets.cjs');

test('stale but functional Pages assets are not accepted until every file matches',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pages-assets-'));
 const files=['index.html','assets/app.js'];
 try{
  fs.mkdirSync(path.join(dir,'assets'));
  fs.writeFileSync(path.join(dir,files[0]),'new page');
  fs.writeFileSync(path.join(dir,files[1]),'new script');
  const previous=process.cwd();process.chdir(dir);
  try{
   let round=0,waits=0;
   const result=await waitForPublishedAssets({base:'https://example.test/project/',sha:'abc',files,attempts:3,interval:1,isCurrent:()=>true,sleep:async()=>{round++;waits++;},fetchAsset:async url=>({ok:true,arrayBuffer:async()=>Buffer.from(url.pathname.endsWith('index.html')?'new page':round===0?'old script':'new script')})});
   assert.equal(result,'matched');assert.equal(waits,1);
  }finally{process.chdir(previous);}
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('never accepts stale assets, and superseded commits skip without a false pass',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pages-assets-'));
 try{
  const file=path.join(dir,'asset.js');fs.writeFileSync(file,'current');
  const options={base:'https://example.test/project/',sha:'abc',files:[file],attempts:2,interval:1,fetchAsset:async()=>({ok:true,arrayBuffer:async()=>Buffer.from('old')}),sleep:async()=>{}};
  await assert.rejects(waitForPublishedAssets({...options,isCurrent:()=>true}),/do not match/);
  assert.equal(await waitForPublishedAssets({...options,isCurrent:()=>false}),'superseded');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

function withAsset(run){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pages-assets-'));
 const file=path.join(dir,'asset.js');
 fs.writeFileSync(file,'current');
 return Promise.resolve().then(()=>run({
  base:'https://example.test/project/',sha:'abc',files:[file],isCurrent:()=>true,
  fetchAsset:async()=>({ok:true,arrayBuffer:async()=>Buffer.from('current')})
 })).finally(()=>fs.rmSync(dir,{recursive:true,force:true}));
}

test('default window covers the observed 27m38s deployment, not just 301 quick polls',()=>withAsset(async options=>{
 let clock=0,polls=0;
 const deployedAt=(27*60+38)*1000;
 assert.ok(PUBLICATION_TIMEOUT_MS>=35*60*1000);
 const result=await waitForPublishedAssets({
  ...options,now:()=>clock,sleep:async ms=>{clock+=ms;},
  fetchAsset:async(url,{cache,signal})=>{
   polls++;
   assert.equal(cache,'no-store');
   assert.ok(signal instanceof AbortSignal);
   assert.match(url.searchParams.get('publication'),/^abc-\d+$/);
   return {ok:true,arrayBuffer:async()=>Buffer.from(clock>=deployedAt?'current':'stale')};
  }
 });
 assert.equal(result,'matched');
 assert.ok(clock>=deployedAt&&clock<PUBLICATION_TIMEOUT_MS);
 assert.ok(polls>301,'the old attempt cap must not truncate the longer window');
}));

test('deadline includes network time and stops without another request',()=>withAsset(async options=>{
 let clock=0,polls=0;
 const waits=[];
 await assert.rejects(waitForPublishedAssets({
  ...options,maxDuration:100,interval:60,now:()=>clock,
  sleep:async ms=>{waits.push(ms);clock+=ms;},
  fetchAsset:async()=>{polls++;clock+=polls===1?30:10;return {ok:false};}
 }),/after 100ms \(2 attempts; deadline 100ms\)/);
 assert.deepEqual(waits,[60]);
 assert.equal(polls,2);
 assert.equal(clock,100);
}));

test('remaining deadline clips sleep even when HTTP fails immediately',()=>withAsset(async options=>{
 let clock=0,polls=0;
 const waits=[];
 await assert.rejects(waitForPublishedAssets({
  ...options,maxDuration:100,interval:60,now:()=>clock,
  sleep:async ms=>{waits.push(ms);clock+=ms;},
  fetchAsset:async()=>{polls++;return {ok:false};}
 }),/after 100ms \(2 attempts; deadline 100ms\)/);
 assert.deepEqual(waits,[60,40]);
 assert.equal(polls,2);
}));

test('network errors, HTTP failures and stale bytes retry before an exact match',()=>withAsset(async options=>{
 let attempt=0;
 const signals=[];
 const result=await waitForPublishedAssets({
  ...options,attempts:4,sleep:async()=>{},
  fetchAsset:async(url,{signal})=>{
   signals.push(signal);
   if(attempt++===0)throw Error('connection reset');
   if(attempt===2)return {ok:false};
   return {ok:true,arrayBuffer:async()=>Buffer.from(attempt===3?'stale':'current')};
  }
 });
 assert.equal(result,'matched');
 assert.equal(attempt,4);
 assert.equal(new Set(signals).size,4,'each retry needs a fresh request deadline');
}));

test('response body hangs are aborted at the absolute deadline',()=>withAsset(async options=>{
 let signal;
 await assert.rejects(waitForPublishedAssets({
  ...options,maxDuration:20,
  fetchAsset:async(url,request)=>{
   signal=request.signal;
   return {ok:true,arrayBuffer:()=>new Promise((resolve,reject)=>{
    signal.addEventListener('abort',()=>reject(Error('body aborted')),{once:true});
   })};
  }
 }),/do not match/);
 assert.equal(signal.aborted,true);
}));

test('one failed request does not leave another response body running into the next round',()=>withAsset(async options=>{
 let active=0,waits=0;
 await assert.rejects(waitForPublishedAssets({
  ...options,files:[options.files[0],options.files[0]],attempts:2,
  sleep:async()=>{assert.equal(active,0);waits++;},
  fetchAsset:async()=>{
   if(active)throw Error('other asset unavailable');
   active++;
   return {ok:true,arrayBuffer:async()=>{
    await new Promise(resolve=>setTimeout(resolve,5));
    active--;
    return Buffer.from('stale');
   }};
  }
 }),/do not match/);
 assert.equal(active,0);
 assert.equal(waits,1);
}));

test('supersession during polling, on matching bytes and at expiry always skips',()=>withAsset(async options=>{
 let current=true;
 assert.equal(await waitForPublishedAssets({
  ...options,isCurrent:()=>current,
  fetchAsset:async()=>({ok:false}),sleep:async()=>{current=false;}
 }),'superseded');
 current=true;
 assert.equal(await waitForPublishedAssets({
  ...options,isCurrent:()=>current,
  fetchAsset:async()=>{current=false;return {ok:true,arrayBuffer:async()=>Buffer.from('current')};}
 }),'superseded');
 current=true;
 assert.equal(await waitForPublishedAssets({
  ...options,attempts:1,isCurrent:()=>current,
  fetchAsset:async()=>{current=false;return {ok:false};}
 }),'superseded');
}));

test('unverifiable main tip remains an error rather than a successful skip',()=>withAsset(async options=>{
 let checks=0;
 await assert.rejects(waitForPublishedAssets({
  ...options,isCurrent:()=>{if(++checks>1)throw Error('Cannot confirm the main tip');return true;}
 }),/Cannot confirm the main tip/);
}));

test('catalog verification shares each asset round deadline and must also match',()=>withAsset(async options=>{
 let clock=0,checks=0,assetSignal;
 const result=await waitForPublishedAssets({
  ...options,now:()=>clock,sleep:async ms=>{clock+=ms;},
  fetchAsset:async(url,{signal})=>{assetSignal=signal;return {ok:true,arrayBuffer:async()=>Buffer.from('current')};},
  verify:async({signal,attempt,cache})=>{
   assert.equal(signal,assetSignal);
   assert.equal(cache,'no-store');
   assert.equal(attempt,checks++);
   if(checks===1)throw Error('catalog unavailable');
   return checks>=3;
  }
 });
 assert.equal(result,'matched');
 assert.equal(checks,3);
}));

test('all nine failed publication gates use the shared window and leave setup/browser time',()=>{
 const gates=[
  ['round-qa.yml',null,['assets/app.js','assets/reader.css']],
  ['case-share-qa.yml',null,['assets/app.js','assets/style.css']],
  ['relevance-qa.yml',null,['index.html','assets/app.js','assets/style.css']],
  ['reading-anchor-qa.yml',null,['assets/app.js']],
  ['combined-recovery-qa.yml',null,['assets/app.js']],
  ['recency-qa.yml',null,['index.html','assets/app.js','assets/style.css']],
  ['available-facets-qa.yml',null,['assets/app.js']],
  ['related-qa.yml','related-browser.cjs',['assets/app.js','assets/reader.css']],
  ['search-context-qa.yml','search-context-live.cjs',['assets/app.js','assets/style.css']]
 ];
 for(const [workflow,browser,files] of gates){
  const yaml=fs.readFileSync(path.join(__dirname,'../.github/workflows',workflow),'utf8');
  const source=browser?fs.readFileSync(path.join(__dirname,browser),'utf8'):yaml;
  assert.match(source,/require\(['"](?:\.\/|\.\.\/)scripts\/published-assets\.cjs['"]\)/,workflow+' must use the bounded shared helper');
  assert.match(source,/waitForPublishedAssets\(/);
  assert.doesNotMatch(source,/maxDuration:|attempts:/,'callers must not silently shorten the shared publication window');
  for(const file of files)assert.ok(source.includes("'"+file+"'"),workflow+' must still verify '+file);
  const minutes=Number(yaml.match(/timeout-minutes:\s*(\d+)/)[1]);
  assert.ok(minutes*60000>=PUBLICATION_TIMEOUT_MS+20*60000,workflow+' must reserve 20 minutes beyond publication waiting');
  assert.match(source,/superseded/,'callers must handle supersession without launching stale browser checks');
  assert.match(yaml+'\n'+source,/SKIP_PUBLISHED_BROWSER_CHECK/,'workflow or its live browser entry point must retain freshness guards');
 }
 const recency=fs.readFileSync(path.join(__dirname,'../.github/workflows/recency-qa.yml'),'utf8');
 assert.match(recency,/verify:async\(\{base,sha,attempt,signal,cache\}\)/);
 assert.match(recency,/JSON\.stringify\(catalog\.files\.slice\(\)\.sort\(\)\)===JSON\.stringify\(expected\)/,'catalog membership verification must not weaken to a successful HTTP response');
});

test('matching bytes received at the deadline are not a late false pass',()=>withAsset(async options=>{
 let clock=0;
 await assert.rejects(waitForPublishedAssets({
  ...options,maxDuration:100,now:()=>clock,
  fetchAsset:async()=>({ok:true,arrayBuffer:async()=>{clock=100;return Buffer.from('current');}})
 }),/do not match/);
}));

test('already superseded commits do not read local files or fetch public assets',async()=>{
 assert.equal(await waitForPublishedAssets({
  base:'https://example.test/',sha:'old',files:['missing-local-asset.js'],
  isCurrent:()=>false,fetchAsset:async()=>{assert.fail('superseded check must not fetch');}
 }),'superseded');
});

test('unsuccessful responses release their bodies before retrying',()=>withAsset(async options=>{
 let cancelled=0, requests=0;
 const result=await waitForPublishedAssets({
  ...options,attempts:2,sleep:async()=>{},
  fetchAsset:async()=>++requests===1
   ? {ok:false,body:{cancel:async()=>{cancelled++;}}}
   : {ok:true,arrayBuffer:async()=>Buffer.from('current')}
 });
 assert.equal(result,'matched');
 assert.equal(cancelled,1);
}));
