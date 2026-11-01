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
test('publication timeout identifies failed assets and verification without exposing response bodies',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pages-diagnostics-'));
 try{
  const files=['current.js','stale.js','missing.js','network.js'].map(file=>path.join(dir,file));
  for(const file of files)fs.writeFileSync(file,'current');
  await assert.rejects(waitForPublishedAssets({
   base:'https://example.test/',sha:'abc',files,attempts:1,isCurrent:()=>true,
   fetchAsset:async url=>{
    if(url.pathname.endsWith('network.js'))throw Error('private network detail');
    if(url.pathname.endsWith('missing.js'))return {ok:false,status:503};
    return {ok:true,arrayBuffer:async()=>Buffer.from(url.pathname.endsWith('stale.js')?'stale':'current')};
   },
   verify:async()=>false
  }),error=>{
   assert.match(error.message,/stale\.js: byte mismatch/);
   assert.match(error.message,/missing\.js: HTTP 503/);
   assert.match(error.message,/network\.js: request failed/);
   assert.match(error.message,/additional verification: mismatch/);
   assert.doesNotMatch(error.message,/current\.js|private network detail/);
   return true;
  });
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
 assert.equal(PUBLICATION_TIMEOUT_MS,60*60*1000);
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

test('default window accepts a 40-minute publication but still rejects stale bytes at 60 minutes',()=>withAsset(async options=>{
 const deployedAt=40*60*1000;
 assert.equal(PUBLICATION_TIMEOUT_MS,60*60*1000);
 let clock=0;
 const polling={...options,now:()=>clock,sleep:async ms=>{clock+=ms;}};
 assert.equal(await waitForPublishedAssets({
  ...polling,fetchAsset:async()=>({ok:true,arrayBuffer:async()=>Buffer.from(clock>=deployedAt?'current':'stale')})
 }),'matched');
 assert.equal(clock,deployedAt);
 clock=0;
 await assert.rejects(waitForPublishedAssets({
  ...polling,fetchAsset:async()=>({ok:true,arrayBuffer:async()=>Buffer.from('stale')})
 }),/do not match/);
 assert.equal(clock,PUBLICATION_TIMEOUT_MS);
}));

test('default window accepts the observed 49m09s publication and expires after one hour',()=>withAsset(async options=>{
 const deployedAt=(49*60+9)*1000;
 let clock=0;
 const polling={...options,interval:1000,now:()=>clock,sleep:async ms=>{clock+=ms;}};
 assert.equal(await waitForPublishedAssets({
  ...polling,fetchAsset:async()=>({ok:true,arrayBuffer:async()=>Buffer.from(clock>=deployedAt?'current':'stale')})
 }),'matched');
 assert.equal(clock,deployedAt);
 clock=0;
 await assert.rejects(waitForPublishedAssets({
  ...polling,fetchAsset:async()=>({ok:true,arrayBuffer:async()=>Buffer.from('stale')})
 }),/after 3600000ms \(3600 attempts; deadline 3600000ms\)/);
 assert.equal(clock,60*60*1000);
 clock=0;
 await assert.rejects(waitForPublishedAssets({
  ...polling,fetchAsset:async()=>{
   clock=60*60*1000;
   return {ok:true,arrayBuffer:async()=>Buffer.from('current')};
  }
 }),/after 3600000ms \(1 attempts; deadline 3600000ms\)/);
 assert.equal(clock,60*60*1000);
}));

test('every default-gated workflow preserves setup and browser headroom',()=>{
 const jobs=[
  ['available-facets-qa.yml','browser'],
  ['card-refinement-qa.yml','refinement'],
  ['case-share-qa.yml','browser'],
  ['category-find-qa.yml','browser'],
  ['combined-recovery-qa.yml','browser'],
  ['corpus-qa.yml','published'],
  ['filter-entry-qa.yml','browser'],
  ['home-search-entry-qa.yml','entry'],
  ['missing-case-qa.yml','missing'],
  ['print-reading-qa.yml','browser'],
  ['reader-qa.yml','browser'],
  ['reading-anchor-qa.yml','browser'],
  ['recency-qa.yml','browser'],
  ['related-qa.yml','browser'],
  ['relevance-qa.yml','relevance'],
  ['round-qa.yml','browser'],
  ['search-context-qa.yml','context'],
  ['source-links-qa.yml','browser'],
  ['facet-counts-qa.yml','browser',1,25],
  ['website-qa.yml','browser',2]
 ];
 for(const [file,job,gates=1,headroom=20] of jobs){
  const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows',file),'utf8');
  const section=workflow.split(`  ${job}:\n`)[1];
  assert.ok(section,`${file} must retain its ${job} job`);
  const body=section.split(/\n  [\w-]+:\n/)[0];
  const timeout=Number(body.match(/^\s{4}timeout-minutes:\s*(\d+)/m)?.[1]);
  assert.ok(timeout*60000>=gates*PUBLICATION_TIMEOUT_MS+headroom*60000,
   `${file} ${job} must reserve ${gates} publication window(s) plus ${headroom} minutes for setup and browser checks`);
 }
});

test('one-hour publication window accepts 46m40s and rejects stale assets at expiry',()=>withAsset(async options=>{
 let clock=0;
 const deadline=60*60*1000, deployedAt=(46*60+40)*1000;
 const polling={...options,maxDuration:deadline,now:()=>clock,sleep:async ms=>{clock+=ms;}};
 assert.equal(await waitForPublishedAssets({
  ...polling,fetchAsset:async()=>({ok:true,arrayBuffer:async()=>Buffer.from(clock>=deployedAt?'current':'stale')})
 }),'matched');
 assert.equal(clock,deployedAt);
 clock=0;
 await assert.rejects(waitForPublishedAssets({
  ...polling,fetchAsset:async()=>({ok:true,arrayBuffer:async()=>Buffer.from('stale')})
 }),/do not match/);
 assert.equal(clock,deadline);
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

test('every shared publication caller reserves setup and browser time beyond the full deadline',()=>{
 const workflows=[
  'available-facets-qa.yml','card-refinement-qa.yml','case-share-qa.yml',
  'category-find-qa.yml','combined-recovery-qa.yml','facet-counts-qa.yml',
  'filter-entry-qa.yml','home-search-entry-qa.yml','missing-case-qa.yml',
  'print-reading-qa.yml','reader-qa.yml','reading-anchor-qa.yml',
  'recency-qa.yml','related-qa.yml','relevance-qa.yml','round-qa.yml',
  'search-context-qa.yml','source-links-qa.yml','website-qa.yml'
 ];
 for(const file of workflows){
  const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows',file),'utf8');
  const minutes=Number(workflow.match(/timeout-minutes:\s*(\d+)/)[1]);
  const sequentialGates=file==='website-qa.yml'?2:1;
  assert.ok(minutes*60000>=sequentialGates*PUBLICATION_TIMEOUT_MS+20*60000,file+' must reserve every sequential publication gate plus 20 minutes for setup/browser checks');
  if(sequentialGates===2){
   assert.match(workflow,/run: node tests\/published-version\.cjs/);
   assert.match(workflow,/run: node tests\/deployed-browser\.cjs/);
  }
 }
 const corpus=fs.readFileSync(path.join(__dirname,'../.github/workflows/corpus-qa.yml'),'utf8').split('\n  published:')[1];
 const minutes=Number(corpus.match(/timeout-minutes:\s*(\d+)/)[1]);
 assert.ok(minutes*60000>=PUBLICATION_TIMEOUT_MS+20*60000,'corpus published job must cover publication and browser checks');
 const reader=fs.readFileSync(path.join(__dirname,'reader-browser.cjs'),'utf8');
 assert.match(reader,/if\(deployed\)\{\s*await require\('\.\/arrival-live\.cjs'\)[\s\S]*?await browser\.close\(\);continue;\s*\}/,'live reader must exit its engine iteration before preview-only checkpoints and readiness retries');
});

test('remaining short publication gates use the shared window without weakening byte checks',()=>{
 const gates=[
  ['category-find-qa.yml',null,['index.html','assets/app.js','assets/style.css']],
  ['filter-entry-qa.yml',null,['index.html','assets/app.js','assets/style.css']],
  ['home-search-entry-qa.yml',null,['index.html','assets/app.js','assets/style.css']],
  ['reader-qa.yml','reader-browser.cjs',['assets/reader.js','assets/reader.css','assets/app.js','assets/style.css','assets/discovery.js','index.html']],
  ['corpus-qa.yml','corpus-browser.cjs',['assets/app.js','assets/style.css','assets/reader.js','assets/reader.css','index.html']]
 ];
 for(const [workflow,browser,files] of gates){
  const yaml=fs.readFileSync(path.join(__dirname,'../.github/workflows',workflow),'utf8');
  const source=browser?fs.readFileSync(path.join(__dirname,browser),'utf8'):yaml;
  assert.match(source,/await waitForPublishedAssets\(/,workflow+' must reuse the bounded shared publication gate');
  assert.doesNotMatch(source,/maxDuration:|attempts:/,workflow+' must not shorten the shared window');
  for(const file of files)assert.ok(source.includes("'"+file+"'"),workflow+' must still verify '+file);
  assert.match(source,/superseded/);
  assert.match(yaml+'\n'+source,/SKIP_PUBLISHED_BROWSER_CHECK/);
 }
 const corpus=fs.readFileSync(path.join(__dirname,'corpus-browser.cjs'),'utf8');
 assert.match(corpus,/assert\.equal\(served\[path\],fs\.readFileSync\(path,'utf8'\)/,'actual-page byte checks must remain enabled');
 const reader=fs.readFileSync(path.join(__dirname,'reader-browser.cjs'),'utf8');
 assert.match(reader,/reader-deployment\.json/,'reader deployment evidence must remain');
 assert.match(reader,/typeof CaseReader!=='undefined'/,'reader readiness must remain');
});
