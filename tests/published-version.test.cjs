'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {sameContent,reportWorkflowResult,waitForPublishedVersion}=require('./published-version.cjs');
const {PUBLICATION_TIMEOUT_MS}=require('../scripts/published-assets.cjs');
const build=(revision,markdown='original')=>({catalog:{bundleRevision:revision,files:['cases/a.md']},corpus:{version:1,revision,sources:[{path:'cases/a.md',markdown}]}});
test('independently built identical releases accept different timestamps',()=>assert(sameContent(build('local'),build('published'))));
test('mixed publication revisions are rejected',()=>{const remote=build('remote');remote.corpus.revision='older';assert(!sameContent(build('local'),remote));});
test('changed, missing and duplicate sources are rejected',()=>{
 assert(!sameContent(build('local'),build('remote','changed')));
 const missing=build('remote');missing.corpus.sources=[];assert(!sameContent(build('local'),missing));
 const duplicate=build('remote');duplicate.corpus.sources.push({...duplicate.corpus.sources[0]});assert(!sameContent(build('local'),duplicate));
 const extra=build('remote');extra.catalog.files.push('cases/new.md');assert(!sameContent(build('local'),extra));
});
test('source order does not change the publication content',()=>{
 const local=build('local');local.catalog.files.push('evidence/b.md');local.corpus.sources.push({path:'evidence/b.md',markdown:'B'});
 const remote=JSON.parse(JSON.stringify(local));remote.catalog.bundleRevision=remote.corpus.revision='remote';remote.catalog.files.reverse();remote.corpus.sources.reverse();assert(sameContent(local,remote));
});
test('published verification exports whether downstream corpus checks are valid',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'published-check-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const output=path.join(dir,'output');
 reportWorkflowResult(false,output);
 assert.equal(fs.readFileSync(output,'utf8'),'verified=false\n');
 reportWorkflowResult(true,output);
 assert.equal(fs.readFileSync(output,'utf8'),'verified=false\nverified=true\n');
});

function publicationFixture(t){
 const built=fs.mkdtempSync(path.join(os.tmpdir(),'published-version-'));
 t.after(()=>fs.rmSync(built,{recursive:true,force:true}));
 const local=build('local'),remote=build('published');
 const files={
  'index.html':'page','assets/app.js':'app','assets/style.css':'style','assets/reader.js':'reader','assets/reader.css':'reader style',
  'catalog.json':JSON.stringify(local.catalog),'corpus.json':JSON.stringify(local.corpus)
 };
 for(const [file,content] of Object.entries(files)){
  fs.mkdirSync(path.dirname(path.join(built,file)),{recursive:true});
  fs.writeFileSync(path.join(built,file),content);
 }
 const published={...files,'catalog.json':JSON.stringify(remote.catalog),'corpus.json':JSON.stringify(remote.corpus)};
 const respond=async url=>{
  const file=url.pathname.slice('/project/'.length)||'index.html';
  assert.ok(Object.hasOwn(published,file),'unexpected publication URL '+url);
  return {ok:true,arrayBuffer:async()=>Buffer.from(published[file])};
 };
 return {options:{base:'https://example.test/project/',built,sha:'current',isCurrent:()=>true},published,respond};
}

test('facet publication waits through a 40-minute mixed-corpus deployment using the shared window',async t=>{
 const {options,published,respond}=publicationFixture(t);
 let clock=0,rounds=0;
 const deployedAt=40*60*1000,ready=published['corpus.json'];
 const result=await waitForPublishedVersion({
  ...options,now:()=>clock,sleep:async ms=>{clock+=ms;},
  fetchAsset:async(url,{signal,cache})=>{
   assert.equal(cache,'no-store');
   assert.ok(signal instanceof AbortSignal);
   assert.match(url.searchParams.get('publication'),/^current-\d+$/);
   if(url.pathname==='/project/')rounds++;
   published['corpus.json']=clock<deployedAt?JSON.stringify({...JSON.parse(ready),revision:'still-deploying'}):ready;
   return respond(url);
  }
 });
 assert.equal(PUBLICATION_TIMEOUT_MS,60*60*1000);
 assert.equal(result.status,'matched');
 assert.equal(result.localRevision,'local');
 assert.equal(result.publishedRevision,'published');
 assert.equal(result.sourceCount,1);
 assert.equal(result.corpus,ready);
 assert.equal(clock,deployedAt);
 assert.ok(clock>500*3000,'the former 500-attempt, three-second gate would stop before deployment');
 assert.equal(rounds,deployedAt/5000+1);
});

test('matching assets never accept changed source bytes, and failure stops at 60 minutes',async t=>{
 const {options,published,respond}=publicationFixture(t);
 published['corpus.json']=JSON.stringify(build('published','changed source bytes').corpus);
 let clock=0;
 await assert.rejects(waitForPublishedVersion({
  ...options,fetchAsset:respond,now:()=>clock,sleep:async ms=>{clock+=ms;}
 }),error=>{
  assert.match(error.message,/Published assets do not match checkout/);
  assert.match(error.cause.message,/Published source content or internal revision mismatch/);
  return true;
 });
 assert.equal(clock,PUBLICATION_TIMEOUT_MS);
});

test('a changed product asset cannot pass with an otherwise matching corpus',async t=>{
 const {options,published,respond}=publicationFixture(t);
 published['assets/reader.css']='stale reader styles';
 let clock=0;
 await assert.rejects(waitForPublishedVersion({
  ...options,fetchAsset:respond,now:()=>clock,sleep:async ms=>{clock+=ms;}
 }),error=>{
  assert.match(error.cause.message,/Product asset mismatch/);
  return true;
 });
 assert.equal(clock,PUBLICATION_TIMEOUT_MS);
});

test('already superseded publication skips without reading builds or fetching Pages',async()=>{
 assert.deepEqual(await waitForPublishedVersion({
  base:'https://example.test/project/',built:'nonexistent-publication-build',isCurrent:()=>false,
  fetchAsset:async()=>assert.fail('superseded runs must not fetch')
 }),{status:'superseded'});
});

test('supersession during polling or while matching returns no verified corpus',async t=>{
 for(const matching of [false,true]){
  const {options,respond}=publicationFixture(t);
  let current=true;
  const result=await waitForPublishedVersion({
   ...options,isCurrent:()=>current,
   fetchAsset:async url=>{
    if(matching){current=false;return respond(url);}
    return {ok:false,status:503};
   },
   sleep:async()=>{current=false;}
  });
  assert.deepEqual(result,{status:'superseded'});
 }
});

test('unverifiable freshness is an error, not a successful skip',async()=>{
 await assert.rejects(waitForPublishedVersion({
  base:'https://example.test/project/',isCurrent:()=>{throw Error('Cannot confirm the main tip');}
 }),/Cannot confirm the main tip/);
});

test('facet workflow reserves publication time and gates every published consumer on verification',()=>{
 const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/facet-counts-qa.yml'),'utf8');
 const minutes=Number(workflow.match(/timeout-minutes:\s*(\d+)/)[1]);
 assert.ok(minutes*60000>=PUBLICATION_TIMEOUT_MS+25*60000);
 assert.match(workflow,/- name: Verify published source bytes\s+if: steps\.published-version\.outputs\.verified == 'true'/);
 assert.match(workflow,/- name: Verify the published site\s+if: github\.ref == 'refs\/heads\/main' && steps\.published-version\.outputs\.verified == 'true'/);
 assert.match(workflow,/run: node tests\/published-version\.cjs/);
 assert.match(workflow,/run: python3 scripts\/check_corpus_bundle\.py "\$PUBLISHED_BUILD"/);
});
