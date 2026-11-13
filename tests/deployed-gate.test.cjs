'use strict';
// Run 42820349847 (2026-11-10): the Website QA walk for `2b139d9f` began at 13:09:40
// against a site that had published `ab4b51f4` at 13:06:16, and failed at 14:09:40 —
// exactly the 3600s publication window — with "PUBLISHED assets mismatch". Nothing was
// broken: the merge right after this one had replaced the build, so the walk's byte
// equality could never hold again. Step 15 had already byte-verified the seven files
// this push changed. These tests hold the replacement gate: one question (which build
// is live?), a bounded window, and a red only when the answer is neither this push nor
// a newer build that contains it.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {waitForLiveRevision,readLiveRevision,DEFAULT_MAX_DURATION_MS}=require('../scripts/published-revision.cjs');

const SHA='2b139d9f694bdf2f5e19fa46f156887919f352d9';
const NEWER='3f53ba9955cb1a5c1932d391696dac86f77c7201';

// A fake site: `revisions` is the catalog revision served per poll. The catalog names a
// different bundle each time, so a byte comparison against any checkout could never
// succeed — and nothing here reads a local asset to try.
function site(revisions){
 const state={requests:0,served:[]};
 const fetchAsset=async url=>{
  state.requests++;
  const index=Math.min(state.requests-1,revisions.length-1);
  const revision=revisions[index];
  state.served.push(revision);
  if(revision===null)return {ok:false,status:503,body:{cancel:async()=>{}}};
  return {ok:true,status:200,arrayBuffer:async()=>Buffer.from(JSON.stringify({sourceRevision:revision,bundleRevision:'bundle-'+revision,files:['cases/a.md']}))};
 };
 return {state,fetchAsset};
}
function clock(options={}){
 let now=0;
 return {options:{...options,now:()=>now,sleep:async ms=>{now+=ms;}}};
}
// `isDescendantOf(push, liveRevision)` throws when the live build does not contain
// the push; that answer is a fact about two commits and must not be retried as if
// it were a network failure.
const descendantOf=(known)=>(push,live)=>{
 if(known.has(live))return true;
 throw Error('Published revision '+live+' does not contain this push '+push);
};

test('a newer live build is superseded within two polls even though its bytes differ',async()=>{
 const {state,fetchAsset}=site([NEWER,NEWER,NEWER]);
 const time=clock();
 const verdict=await waitForLiveRevision({base:'https://example.test/site/',sha:SHA,fetchAsset,isDescendant:descendantOf(new Set([NEWER])),...time.options});
 assert.equal(verdict.mode,'superseded');
 assert.equal(verdict.liveRevision,NEWER);
 assert.ok(state.requests<=2,'a definitive newer build must end the wait immediately, not after '+state.requests+' polls');
});

test('the gate never reads local asset bytes to decide the verdict',async()=>{
 // The old wait read `index.html`/`assets/*.js` from the checkout and compared them
 // with the live bytes; a replaced build differs by definition, so the comparison
 // could only ever time out. The replacement gate runs from a directory without
 // those files and still answers.
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'deployed-gate-'));
 const previous=process.cwd();
 try{
  process.chdir(dir);
  const {fetchAsset}=site([NEWER]);
  const verdict=await waitForLiveRevision({base:'https://example.test/site/',sha:SHA,fetchAsset,isDescendant:descendantOf(new Set([NEWER])),...clock().options});
  assert.equal(verdict.mode,'superseded');
  // ...and the gate has no way to reach a checkout at all: no filesystem input.
  const source=fs.readFileSync(path.join(__dirname,'../scripts/published-revision.cjs'),'utf8');
  assert.doesNotMatch(source,/require\('node:fs'\)|readFileSync/,'the gate must decide from the live revision alone');
 }finally{
  process.chdir(previous);
  fs.rmSync(dir,{recursive:true,force:true});
 }
});

test('a live build of exactly this push is walked',async()=>{
 const {fetchAsset}=site([SHA]);
 const verdict=await waitForLiveRevision({base:'https://example.test/site/',sha:SHA,fetchAsset,isDescendant:()=>assert.fail('an exact build needs no ancestry check'),...clock().options});
 assert.equal(verdict.mode,'exact');
 assert.equal(verdict.liveRevision,SHA);
});

test('a site that flips to a newer build while the walk waits is superseded, not failed',async()=>{
 // Step 15 declared `exact` (it byte-verified this push against a site serving it),
 // but another merge published before the walk started: the first poll already sees
 // the replacement. Waiting for SHA here is the false red this ticket removes.
 const declared=await waitForLiveRevision({base:'https://example.test/site/',sha:SHA,mode:'exact',liveRevision:SHA,fetchAsset:site([NEWER]).fetchAsset,isDescendant:descendantOf(new Set([NEWER])),...clock().options});
 assert.equal(declared.mode,'superseded');
 assert.equal(declared.liveRevision,NEWER);
 // A flip observed between two polls behaves the same way: an unrelated build first
 // (keep waiting), then a descendant of this push (superseded).
 const {state,fetchAsset}=site(['0f7b6c76aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',NEWER]);
 const flipped=await waitForLiveRevision({base:'https://example.test/site/',sha:SHA,fetchAsset,isDescendant:descendantOf(new Set([NEWER])),...clock().options});
 assert.equal(flipped.mode,'superseded');
 assert.equal(flipped.liveRevision,NEWER);
 assert.equal(flipped.attempts,2,'the replacement must be noticed on the poll that sees it');
 assert.equal(state.requests,2);
});

test('a live build that never becomes this push fails with the revision it observed',async()=>{
 const older='0f7b6c76aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
 const {state,fetchAsset}=site([older]);
 const time=clock();
 await assert.rejects(waitForLiveRevision({base:'https://example.test/site/',sha:SHA,fetchAsset,isDescendant:descendantOf(new Set()),...time.options}),error=>{
  assert.match(error.message,/did not serve this push/);
  assert.match(error.message,new RegExp('sourceRevision was '+older),'a red gate must name what the live site served');
  assert.match(error.message,/\(\d+ attempts\)/,error.message+' must report how many polls it made');
  assert.match(error.message,/last problem/,'the failure must separate an unreachable catalog from a stale build');
  return true;
 });
 // 120s at one poll per five seconds, and no poll is started once the deadline has
 // passed (a request may itself take 15s, so the budget covers the request too).
 assert.equal(DEFAULT_MAX_DURATION_MS,120000,'the replacement window must stay inside two minutes');
 assert.equal(state.requests,24,'the window is bounded, not unbounded');
});

test('a superseded verdict declared by step 15 costs no network at all',async()=>{
 let requests=0;
 const verdict=await waitForLiveRevision({base:'https://example.test/site/',sha:SHA,mode:'superseded',liveRevision:NEWER,fetchAsset:async()=>{requests++;assert.fail('a declared superseded build must not poll');},isDescendant:()=>assert.fail('a declared superseded build must not compare'),...clock().options});
 assert.equal(verdict.mode,'superseded');
 assert.equal(verdict.liveRevision,NEWER);
 assert.equal(requests,0);
});

test('the regression this fix closes: a replaced build is not polled 720 times',async()=>{
 // Guard for run 42820349847. Same inputs as the old gate — a newer, descendant live
 // build whose bytes differ from this checkout — used to be 720 five-second polls
 // (60 minutes) ending in `process.exit(1)`. The replacement must answer in <= 3.
 const {state,fetchAsset}=site([NEWER]);
 const verdict=await waitForLiveRevision({base:'https://example.test/site/',sha:SHA,fetchAsset,isDescendant:descendantOf(new Set([NEWER])),...clock().options});
 assert.equal(verdict.mode,'superseded');
 assert.ok(state.requests<=3,'replaced build must be decided within 3 polls, got '+state.requests+' (720 was the false-red behaviour)');
});

test('an unreadable catalog is retried, and the last problem is what gets reported',async()=>{
 const {state,fetchAsset}=site([null]);
 await assert.rejects(waitForLiveRevision({base:'https://example.test/site/',sha:SHA,fetchAsset,isDescendant:()=>assert.fail('no revision to compare'),...clock().options}),error=>{
  assert.match(error.message,/sourceRevision was unreadable/);
  return true;
 });
 assert.ok(state.requests>1,'a 503 catalog must not be a verdict');
 assert.equal(await readLiveRevision({base:'https://example.test/site/',sha:SHA,attempt:1,fetchAsset:async()=>({ok:true,arrayBuffer:async()=>Buffer.from('{"sourceRevision":"'+NEWER+'"}')})}),NEWER);
});

test('the workflow hands step 15\'s verdict to the walk step',()=>{
 const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/website-qa.yml'),'utf8');
 assert.match(workflow,/PUBLICATION_MODE: \$\{\{ steps\.published-version\.outputs\.mode \}\}/);
 assert.match(workflow,/PUBLICATION_LIVE_REVISION: \$\{\{ steps\.published-version\.outputs\.liveRevision \}\}/);
 const walk=workflow.split('- name: Verify the published GitHub Pages site')[1];
 assert.match(walk,/PUBLICATION_MODE/, 'the two outputs must reach the step that reads them');
 // The step stays gated on a verified publication; only the redundant wait is gone.
 assert.match(workflow,/- name: Verify the published GitHub Pages site\n\s+if: \$\{\{ github\.event_name == 'push' && github\.ref == 'refs\/heads\/main' && steps\.published-version\.outputs\.verified == 'true' \}\}/);
 const gate=fs.readFileSync(path.join(__dirname,'published-version.cjs'),'utf8');
 assert.match(gate,/reportPublicationVerdict\(\{mode:result\.mode,liveRevision:result\.liveRevision\|\|result\.supersededBy\}\)/);
});

test('step 15 publishes its verdict as mode and liveRevision next to verified',t=>{
 const {reportWorkflowResult,reportPublicationVerdict}=require('./published-version.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'deployed-output-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const output=path.join(dir,'output');
 reportWorkflowResult(false,output);
 reportWorkflowResult(true,output);
 reportPublicationVerdict({mode:'superseded',liveRevision:NEWER},output);
 assert.equal(fs.readFileSync(output,'utf8'),'verified=false\nverified=true\nmode=superseded\nliveRevision='+NEWER+'\n');
 // A step output that GitHub cannot parse is worse than an empty one, so a missing
 // value is written empty instead of the string "undefined".
 reportPublicationVerdict({},output);
 assert.match(fs.readFileSync(output,'utf8'),/mode=\nliveRevision=\n$/);
});
