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
 remote.catalog.sourceRevision=remote.corpus.sourceRevision='current';
 const page='<html lang="zh-Hant"><head><meta property="og:locale" content="zh_TW"></head></html>';
 const files={
  'index.html':page,'assets/app.js':'app','assets/style.css':'style','assets/reader.js':'reader','assets/reader.css':'reader style',
  'assets/copy.json':'{}','assets/discovery.js':'discovery','assets/audit.js':'audit',
  'INDEX.html':page,'cases/001-travel-checkout.html':page,'sources/qualification-audit-2026-10-16.html':page,
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
 // Unit fixtures never read git: what the live revision itself contains is part of
 // the fixture, and a test that needs different bytes supplies its own function.
 return {options:{base:'https://example.test/project/',built,sha:'current',expectedSourceRevision:'current',isCurrent:()=>true,contentAtRevision:()=>null,sourcesAtRevision:()=>['cases/a.md']},published,respond};
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
 published['corpus.json']=JSON.stringify({...build('published','changed source bytes').corpus,sourceRevision:'current'});
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

test('publication cannot pass while a static page has stale language or a stale source revision',async t=>{
 for(const stale of ['language','revision']){
  const {options,published,respond}=publicationFixture(t);
  const page='<html lang="zh-Hant"><head><meta property="og:locale" content="zh_TW"></head></html>';
  published['INDEX.html']=stale==='language'?'<html lang="en"></html>':page;
  published['cases/001-travel-checkout.html']=page;
  published['sources/qualification-audit-2026-10-16.html']=page;
  for(const name of ['catalog.json','corpus.json']){
   const value=JSON.parse(published[name]);
   value.sourceRevision=stale==='revision'?'old':'current';
   published[name]=JSON.stringify(value);
  }
  let clock=0;
  await assert.rejects(waitForPublishedVersion({...options,fetchAsset:respond,now:()=>clock,sleep:async ms=>{clock+=ms;}}),/Published assets do not match checkout/);
 }
});

test('non-main content verification does not demand a branch SHA from Pages',async t=>{
 const {options,respond}=publicationFixture(t);
 const result=await waitForPublishedVersion({...options,sha:'unpublished-branch',expectedSourceRevision:null,isDescendant:()=>true,fetchAsset:respond});
 assert.equal(result.status,'matched');
 assert.equal(result.mode,'superseded');
 assert.equal(result.supersededBy,'current');
});

// A docs-only commit moves main tip minutes after every merge, so the live build is
// normally newer than the pushed SHA. That used to skip the gate entirely; now the
// gate proves the newer build descends from this push and is a faithful build of the
// revision it names — not of this push, which it can no longer be.
function supersededFixture(t,{markdown='original',changedPath='cases/a.md',deleted=false,atLive}={}){
 const {options,published,respond}=publicationFixture(t);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'published-changed-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const remote=build('published',markdown);
 remote.catalog.sourceRevision=remote.corpus.sourceRevision='newer';
 if(deleted)remote.corpus.sources=remote.corpus.sources.filter(source=>source.path!==changedPath);
 published['catalog.json']=JSON.stringify(remote.catalog);
 published['corpus.json']=JSON.stringify(remote.corpus);
 if(!deleted){
  fs.mkdirSync(path.dirname(path.join(root,changedPath)),{recursive:true});
  fs.writeFileSync(path.join(root,changedPath),'original');
 }
 const changeList={known:true,entries:[{status:deleted?'D':'M',path:changedPath}]};
 // The live build is judged against the revision it names, so the fixture has to say
 // what that revision contains. By default it contains exactly what the live build
 // serves, which is the normal case.
 const liveContent=atLive===undefined?(deleted?()=>null:path=>path===changedPath?Buffer.from(markdown):null):atLive;
 let clock=0;
 return {
  options,
  run:overrides=>waitForPublishedVersion({
   ...options,changeList,root,
   contentAtRevision:(revision,path)=>{assert.equal(revision,'newer');return liveContent(path);},
   sourcesAtRevision:revision=>{assert.equal(revision,'newer');return [...remote.catalog.files].sort();},
   fetchAsset:respond,now:()=>clock,sleep:async ms=>{clock+=ms;},...overrides
  }),
  clock:()=>clock,
  published
 };
}

test('a newer published build is judged against the revision it names',async t=>{
 const {run}=supersededFixture(t);
 const result=await run({isDescendant:(ancestor,descendant)=>{
  assert.equal(ancestor,'current');assert.equal(descendant,'newer');return true;
 }});
 assert.equal(result.status,'matched');
 assert.equal(result.mode,'superseded');
 assert.equal(result.supersededBy,'newer');
 assert.equal(result.changedVerified,1);
 assert.equal(result.carried,1,'the newer build still serves this push\'s bytes');
});

test('a later merge that rewrote the same case is superseded, not a lost publication',async t=>{
 // This push's bytes are no longer what the live build serves, and no amount of
 // waiting changes that. Comparing with this push instead of with the live build's
 // own revision made every poll fail and cost the whole window.
 const fixture=supersededFixture(t,{markdown:'published without our fix'});
 const result=await fixture.run({isDescendant:()=>true});
 assert.equal(result.status,'matched');
 assert.equal(result.mode,'superseded');
 assert.equal(result.changedVerified,1);
 assert.equal(result.carried,0,'the live build no longer carries this push\'s bytes');
 assert.equal(fixture.clock(),0,'the first poll settles it');
});

test('a changed asset rewritten by a later build settles instead of polling for an hour',async t=>{
 // The measured defect: this push changed assets/app.js and its Pages deployment
 // succeeded, then the next merge rewrote the same asset. The live build was
 // compared with this push's bytes on every poll, so the gate spent the full
 // 60-minute window and reported a publication that had succeeded as red.
 const fixture=supersededFixture(t,{changedPath:'assets/app.js',atLive:()=>Buffer.from('app v2')});
 fixture.published['assets/app.js']='app v2';
 const result=await fixture.run({isDescendant:()=>true});
 assert.equal(result.status,'matched');
 assert.equal(result.mode,'superseded');
 assert.equal(result.changedVerified,1);
 assert.equal(result.carried,0);
 assert.equal(fixture.clock(),0,'the first poll settles it');
});

test('a live build that disagrees with its own revision never verifies',async t=>{
 const {run,clock}=supersededFixture(t,{markdown:'served from another build',atLive:()=>Buffer.from('what newer actually says')});
 await assert.rejects(run({isDescendant:()=>true}),error=>{
  assert.match(error.message,/Published assets do not match checkout/);
  assert.match(error.cause.message,/Published source differs from the live revision newer: cases\/a\.md/);
  return true;
 });
 assert.equal(clock(),PUBLICATION_TIMEOUT_MS);
});

test('a published build that does not descend from this push is rejected',async t=>{
 const {run}=supersededFixture(t);
 await assert.rejects(run({isDescendant:()=>{throw Error('Published revision newer does not contain this push current');}}),error=>{
  assert.match(error.cause.message,/does not contain this push/);
  return true;
 });
});

test('a newer build cannot be verified when the push base is unknown',async t=>{
 const {run}=supersededFixture(t);
 await assert.rejects(run({isDescendant:()=>true,changeList:{known:false,entries:[]}}),error=>{
  assert.match(error.cause.message,/without knowing what this push changed/);
  return true;
 });
});

test('a push that published no file still needs a live build faithful to its revision',async t=>{
 const {run}=supersededFixture(t);
 const result=await run({isDescendant:()=>true,changeList:{known:true,entries:[]}});
 assert.equal(result.mode,'superseded');
 assert.equal(result.changedVerified,0);
 // A live corpus that does not carry the sources of the revision it names is a real
 // inconsistency, and that is what ends this branch in red.
 const stale=supersededFixture(t);
 stale.published['corpus.json']=JSON.stringify({...JSON.parse(stale.published['corpus.json']),sources:[]});
 await assert.rejects(stale.run({isDescendant:()=>true,changeList:{known:true,entries:[]}}),error=>{
  assert.match(error.cause.message,/Published corpus does not carry the sources of newer/);
  return true;
 });
 const listing=supersededFixture(t);
 listing.published['catalog.json']=JSON.stringify({...JSON.parse(listing.published['catalog.json']),files:['cases/a.md','cases/later.md']});
 await assert.rejects(listing.run({isDescendant:()=>true,changeList:{known:true,entries:[]}}),error=>{
  assert.match(error.cause.message,/Published catalog does not list the sources of newer/);
  return true;
 });
});

test('a push that published no file settles on a newer live build instead of a false red',async t=>{
 // main run 42803248261: this merge changed only workflows, tests and the QA
 // record, so it published no file. The next merge moved the live build minutes
 // later and rewrote a served asset. The unconditional product comparison ran
 // before the superseded branch, so every round failed with "Product asset
 // mismatch" and the gate retried for the whole 60-minute window.
 const fixture=supersededFixture(t);
 fixture.published['assets/reader.css']='rewritten by the next merge';
 const result=await fixture.run({isDescendant:()=>true,changeList:{known:true,entries:[]}});
 assert.equal(result.status,'matched');
 assert.equal(result.mode,'superseded');
 assert.equal(result.supersededBy,'newer');
 assert.equal(result.changedVerified,0);
 assert.equal(fixture.clock(),0,'the first round settles it; nothing is left to publish');
});

test('every served asset is compared, including copy.json',async t=>{
 const {options,published,respond}=publicationFixture(t);
 published['assets/copy.json']='{"stale":true}';
 let clock=0;
 await assert.rejects(waitForPublishedVersion({...options,changeList:{known:true,entries:[]},fetchAsset:respond,now:()=>clock,sleep:async ms=>{clock+=ms;}}),/Published assets do not match checkout/);
});

test('a rename is verified as new bytes present and the old path gone',async t=>{
 const {options,published,respond}=publicationFixture(t);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'published-rename-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.mkdirSync(path.join(root,'cases'),{recursive:true});
 fs.writeFileSync(path.join(root,'cases/new.md'),'renamed bytes');
 const remoteCatalog=JSON.parse(published['catalog.json']);
 const remoteCorpus=JSON.parse(published['corpus.json']);
 remoteCatalog.files=['cases/new.md'];
 remoteCatalog.sourceRevision='newer';
 remoteCorpus.sources=[{path:'cases/new.md',markdown:'renamed bytes'},{path:'cases/a.md',markdown:'original'}];
 remoteCorpus.sourceRevision='newer';
 published['catalog.json']=JSON.stringify(remoteCatalog);
 published['corpus.json']=JSON.stringify(remoteCorpus);
 const changeList={known:true,entries:[{status:'D',path:'cases/a.md'},{status:'R100',path:'cases/new.md'}]};
 let clock=0;
 await assert.rejects(waitForPublishedVersion({...options,changeList,root,fetchAsset:respond,isDescendant:()=>true,now:()=>clock,sleep:async ms=>{clock+=ms;}}),error=>{
  assert.match(error.cause.message,/The live revision removed cases\/a\.md but the published corpus still carries it/);
  return true;
 });
});

test('an exact revision also requires the generated pages to be this build',async t=>{
 const {options,published,respond}=publicationFixture(t);
 published['cases/001-travel-checkout.html']='<html lang="zh-Hant"><head><meta property="og:locale" content="zh_TW"></head><body>stale body</body></html>';
 let clock=0;
 await assert.rejects(waitForPublishedVersion({...options,changeList:{known:true,entries:[]},fetchAsset:respond,now:()=>clock,sleep:async ms=>{clock+=ms;}}),error=>{
  assert.match(error.cause.message,/Published page differs from this build: cases\/001-travel-checkout\.html/);
  return true;
 });
});

test('a deleted runtime asset must be gone from the live site',async t=>{
 const {options,published,respond}=publicationFixture(t);
 const remoteCatalog=JSON.parse(published['catalog.json']);remoteCatalog.sourceRevision='newer';
 const remoteCorpus=JSON.parse(published['corpus.json']);remoteCorpus.sourceRevision='newer';
 published['catalog.json']=JSON.stringify(remoteCatalog);published['corpus.json']=JSON.stringify(remoteCorpus);
 const changeList={known:true,entries:[{status:'D',path:'assets/old.css'}]};
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'published-deleted-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const live=async url=>{
  const file=url.pathname.slice('/project/'.length)||'index.html';
  if(file==='assets/old.css')return {ok:true,arrayBuffer:async()=>Buffer.from('still here')};
  return respond(url);
 };
 let clock=0;
 await assert.rejects(waitForPublishedVersion({...options,changeList,root,fetchAsset:live,isDescendant:()=>true,now:()=>clock,sleep:async ms=>{clock+=ms;}}),error=>{
  assert.match(error.cause.message,/A deleted asset is still published: assets\/old\.css/);
  return true;
 });
 const gone=async url=>{
  const file=url.pathname.slice('/project/'.length)||'index.html';
  if(file==='assets/old.css')return {ok:false,status:404,body:{cancel:async()=>{}}};
  return respond(url);
 };
 const ok=await waitForPublishedVersion({...options,changeList,root,fetchAsset:gone,isDescendant:()=>true,sleep:async()=>{}});
 assert.equal(ok.mode,'superseded');
 // A server error is not proof that the file is gone.
 const broken=async url=>{
  const file=url.pathname.slice('/project/'.length)||'index.html';
  if(file==='assets/old.css')return {ok:false,status:500,body:{cancel:async()=>{}}};
  return respond(url);
 };
 let brokenClock=0;
 await assert.rejects(waitForPublishedVersion({...options,changeList,root,fetchAsset:broken,isDescendant:()=>true,now:()=>brokenClock,sleep:async ms=>{brokenClock+=ms;}}),error=>{
  assert.match(error.cause.message,/Cannot confirm a deleted asset is gone \(HTTP 500\): assets\/old\.css/);
  return true;
 });
});

test('a live build without a source revision is never accepted',async t=>{
 const {options,published,respond}=publicationFixture(t);
 for(const name of ['catalog.json','corpus.json']){
  const value=JSON.parse(published[name]);
  value.sourceRevision='';
  published[name]=JSON.stringify(value);
 }
 let clock=0;
 await assert.rejects(waitForPublishedVersion({...options,changeList:{known:true,entries:[]},isDescendant:()=>true,fetchAsset:respond,now:()=>clock,sleep:async ms=>{clock+=ms;}}),error=>{
  assert.match(error.cause.message,/has no source revision/i);
  return true;
 });
});

test('a deleted source is verified by its absence from the published corpus',async t=>{
 const {run}=supersededFixture(t,{deleted:true});
 const result=await run({isDescendant:()=>true});
 assert.equal(result.status,'matched');
 assert.equal(result.changedVerified,1);
});

test('the gate exports verified only after the published bytes were actually compared',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'published-gate-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const source=fs.readFileSync(path.join(__dirname,'published-version.cjs'),'utf8');
 assert.doesNotMatch(source,/'SKIP_PUBLISHED_BROWSER_CHECK superseded main commit'/,'a superseded build must not end as a green skip');
 assert.match(source,/reportWorkflowResult\(true\)/);
 assert.match(source,/reportWorkflowResult\(false\);\n const base/,'the gate starts from verified=false');
});

test('every workflow that compares the published site runs on a main push with its push base',()=>{
 const dir=path.join(__dirname,'../.github/workflows');
 const callers=fs.readdirSync(dir).filter(file=>fs.readFileSync(path.join(dir,file),'utf8').includes('tests/published-version.cjs'));
 assert.deepEqual(callers.sort(),['facet-counts-qa.yml','website-qa.yml'],'the published comparison is only wired where its inputs exist');
 for(const file of callers){
  const text=fs.readFileSync(path.join(dir,file),'utf8');
  assert.match(text,/PUSH_BASE_SHA: \$\{\{ github\.event\.before \}\}/,file+' must describe what the push published');
  assert.match(text,/github\.ref == 'refs\/heads\/main'/,file+' must not compare a pull-request build with the live site');
 }
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
