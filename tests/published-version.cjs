'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {waitForPublishedAssets,fatalPublicationError}=require('../scripts/published-assets.cjs');
const {publicationStatus}=require('../scripts/publication-status.cjs');
// The assets gate polls every 5s; asking GitHub on every poll would be 720 API
// calls per merge for an answer that only changes once.
const DEPLOY_POLL_ROUNDS=12;
const {publicationChangeList,isDescendantOf}=require('../scripts/published-check.cjs');
const {pages,checkPageLanguage}=require('../scripts/check-page-language.cjs');
const SOURCE_DIR=/^(?:cases|evidence)\/|^sources\/pending\.md$/;
// Everything the page loads at runtime, taken from the build itself so a new
// asset cannot be added to index.html and silently left out of this comparison.
function servedAssets(built){
 const assets=['index.html'];
 const dir=path.join(built,'assets');
 for(const file of fs.readdirSync(dir))if(/\.(?:js|css|json)$/.test(file))assets.push('assets/'+file);
 return assets.sort();
}
function sameContent(local,remote){
 try{
  assert.equal(remote.corpus.version,1);
  assert(remote.catalog.bundleRevision);
  assert.equal(remote.catalog.bundleRevision,remote.corpus.revision);
  assert.deepEqual([...remote.catalog.files].sort(),[...local.catalog.files].sort());
  const sources=value=>value.corpus.sources.map(source=>[source.path,source.markdown]).sort((a,b)=>a[0].localeCompare(b[0]));
  assert.deepEqual(sources(remote),sources(local));
  return true;
 }catch{return false;}
}
function reportWorkflowResult(verified,output=process.env.GITHUB_OUTPUT){
 if(output)require('node:fs').appendFileSync(output,`verified=${verified}\n`);
}
// The bytes this push wrote, read once. A deleted file is verified by absence.
function readChangedBytes(changes,root='.'){
 const entries=[];
 for(const change of changes||[]){
  const file=path.join(root,change.path);
  const deleted=/^D/.test(String(change.status||''));
  if(deleted){entries.push({path:change.path,deleted:true});continue;}
  if(!fs.existsSync(file))throw Error('Changed file is missing from the checkout: '+change.path);
  entries.push({path:change.path,deleted:false,bytes:fs.readFileSync(file)});
 }
 return entries;
}
// Pages keeps building after a merge (a docs-only commit moves main tip), so the
// live build is often newer than this SHA. That is not a reason to skip the gate:
// a newer build must be a descendant of this push and must carry these exact bytes.
async function verifySupersededPublication({changed,changeList,remote,local,buffers,assets,sha,isDescendant=isDescendantOf,probeMissing}){
 assert(changeList?.known,'Cannot verify a newer published build without knowing what this push changed');
 assert(remote.catalog.sourceRevision,'Published catalog has no source revision; cannot tell which build is live');
 assert.equal(remote.corpus.sourceRevision,remote.catalog.sourceRevision,'Published corpus and catalog revisions disagree');
 const live=remote.catalog.sourceRevision;
 assert.notEqual(live,sha,'Superseded comparison needs a different live revision');
 isDescendant(sha,live);
 if(!changed.length){
  // Nothing this push published changed, so the live content set must still equal
  // the set this push builds; a later content commit is not this push's proof.
  assert(sameContent(local,remote),'This push published no changed files and the live content is not identical to it');
 }
 const sources=new Map(remote.corpus.sources.map(source=>[source.path,source.markdown]));
 let verified=0;
 for(const entry of changed){
  if(SOURCE_DIR.test(entry.path)){
   const markdown=sources.get(entry.path);
   if(entry.deleted){assert.equal(markdown,undefined,'A deleted source is still published: '+entry.path);verified++;continue;}
   assert.notEqual(markdown,undefined,'Published corpus is missing '+entry.path);
   assert(Buffer.from(markdown,'utf8').equals(entry.bytes),'Published source differs from this push: '+entry.path);
  }else if(entry.deleted){
   // A deleted asset leaves the build, so it cannot be in servedAssets; ask the
   // site itself whether the old URL is gone.
   assert(probeMissing,'Cannot confirm a deleted asset without a live probe: '+entry.path);
   await probeMissing(entry.path);
  }else{
   const index=assets.indexOf(entry.path);
   assert(index>=0,'Unsupported changed file: '+entry.path);
   assert(buffers.get(entry.path).equals(entry.bytes),'Published asset differs from this push: '+entry.path);
  }
  verified++;
 }
 return {mode:'superseded',supersededBy:live,changedVerified:verified};
}
// The revision the live site is serving right now, or '' when it cannot be read.
// Only used to decide whether a failed deployment still matters.
async function liveRevision({base,fetchAsset,sha,attempt}){
 try{
  const url=new URL('catalog.json',base);
  url.searchParams.set('publication',sha+'-'+attempt+'-revision');
  const signal=typeof AbortSignal!=='undefined'&&AbortSignal.timeout?AbortSignal.timeout(15000):undefined;
  const response=await fetchAsset(url,{cache:'no-store',signal});
  if(!response.ok)return '';
  const catalog=JSON.parse(Buffer.from(await response.arrayBuffer()).toString('utf8'));
  return String(catalog.sourceRevision||'');
 }catch{return '';}
}
async function waitForPublishedVersion({base,built='_site',sha=process.env.GITHUB_SHA,expectedSourceRevision=process.env.GITHUB_REF==='refs/heads/main'?sha:null,changeList={known:true,entries:[]},root='.',fetchAsset=fetch,isDescendant=isDescendantOf,now,sleep,deployment}){
 // The live site cannot say whether its own deploy failed or is still running, so
 // ask GitHub about the Pages run for this exact push. Only a push that publishes
 // a known revision can have such a run; a branch build has none, and asking
 // would only ever answer "no run for this SHA".
 const deploySha=expectedSourceRevision||'';
 const deployCheck=deployment||(()=>publicationStatus({sha:deploySha}));
 const assets=servedAssets(built);
 const files=[...assets,'catalog.json','corpus.json',...pages.filter(page=>page!=='index.html')];
 const buffers=new Map();
 for(const file of files)buffers.set(file,fs.readFileSync(path.join(built,file)));
 // `files` already carries INDEX.html and the sampled pages; index.html comes from assets.
 const local={catalog:JSON.parse(buffers.get('catalog.json').toString('utf8')),corpus:JSON.parse(buffers.get('corpus.json').toString('utf8'))};
 const changed=readChangedBytes(changeList.entries,root);
 // Retries repeat every few seconds; the answer for one revision pair cannot change.
 const ancestry=new Map();
 const assertDescendant=(ancestor,descendant)=>{
  const key=ancestor+'..'+descendant;
  const cached=ancestry.get(key);
  // Only answers that cannot change are cached. "This revision does not contain
  // that push" is a fact about two commits; a git/network failure is not, and
  // caching it would make one ETIMEDOUT outlive every later retry.
  if(cached){
   if(Object.hasOwn(cached,'value'))return cached.value;
   if(cached.definitive)throw cached.definitive;
  }
  try{
   const value=isDescendant(ancestor,descendant);
   ancestry.set(key,{value});
   return value;
  }catch(error){
   if(/does not contain this push/.test(String(error&&error.message)))ancestry.set(key,{definitive:error});
   throw error;
  }
 };
 let publication, deployNoticeLogged=false, carriedLogged=false, undecidedLogged=false;
 // The shared 60-minute deadline covers product bytes and semantic corpus checks together.
 const status=await waitForPublishedAssets({
  base,sha,files:[],now,sleep,
  // A newer main tip is no longer a reason to stop looking: the comparison below
  // decides whether the live build provably contains what this push published.
  isCurrent:()=>true,
  verify:async({signal,cache,attempt})=>{
   // Ask GitHub once a minute (and on the first round) whether the deployment
   // this push needs has already finished without it. A failed deploy is not a
   // slow deploy — but a later merge can still have published these bytes, so the
   // verdict only ends the wait when no newer build carries this push either.
   if(deploySha&&attempt%DEPLOY_POLL_ROUNDS===0){
    // A checker that throws or returns nothing is "unknown", never a verdict.
    let state={state:'unknown'};
    try{state=(await deployCheck())||{state:'unknown'};}catch{state={state:'unknown'};}
    // One line in the run log says what the deploy for this SHA did, so a reader
    // never has to guess whether the API was reachable at all.
    if(!deployNoticeLogged){
     deployNoticeLogged=true;
     console.log('Pages deployment for '+deploySha+': '+(state.state||'unknown')+(state.conclusion?' ('+state.conclusion+')':'')+(state.reason?' — '+state.reason:'')+(state.runUrl?' — '+state.runUrl:''));
    }
    if(state&&state.state==='failed'){
     const live=await liveRevision({base,fetchAsset,sha,attempt});
     // Only a positive answer may end the wait: "the live build provably does not
     // contain this push". A git/network failure while comparing revisions, or a
     // live revision that cannot be read, proves nothing and keeps waiting — a
     // transient error must never turn into a red release.
     let verdict='unknown';
     if(live&&live===deploySha)verdict='superseded';
     else if(live){
      try{assertDescendant(deploySha,live);verdict='carried';}
      catch(error){if(/does not contain this push/.test(String(error&&error.message)))verdict='absent';}
     }
     if(verdict==='carried'||verdict==='superseded'){
      if(!carriedLogged){
       carriedLogged=true;
       console.warn('The deployment for '+deploySha+' failed ('+(state.conclusion||'no conclusion')+'), but the live build '+live+' already carries it; verifying the bytes it published'+(state.runUrl?' — '+state.runUrl:''));
      }
     }else if(verdict==='absent'){
      throw fatalPublicationError('The Pages deployment for '+deploySha+' failed ('+(state.conclusion||'no conclusion')+'); the published site can never contain this push'+(state.runUrl?' — '+state.runUrl:''),{runUrl:state.runUrl});
     }else if(!undecidedLogged){
      undecidedLogged=true;
      console.warn('The deployment for '+deploySha+' failed ('+(state.conclusion||'no conclusion')+'), but the live revision could not be compared; keeping the window open'+(state.runUrl?' — '+state.runUrl:''));
     }
    }
   }
   const responses=await Promise.allSettled(files.map(async file=>{
    const url=new URL(file==='index.html'?'':file,base);
    url.searchParams.set('publication',sha+'-'+attempt);
    const response=await fetchAsset(url,{signal,cache});
    if(!response.ok){await response.body?.cancel();throw Error('HTTP '+response.status+' '+file);}
    return Buffer.from(await response.arrayBuffer());
   }));
   // Finish every response body before the shared gate starts another round.
   const remoteBuffers=new Map();
   responses.forEach((response,index)=>{
    if(response.status==='rejected')throw response.reason;
    remoteBuffers.set(files[index],response.value);
   });
   const remote={catalog:JSON.parse(remoteBuffers.get('catalog.json').toString('utf8')),corpus:JSON.parse(remoteBuffers.get('corpus.json').toString('utf8'))};
   assert(assets.every(file=>remoteBuffers.get(file).equals(buffers.get(file))),'Product asset mismatch');
   for(const page of pages)checkPageLanguage(page,remoteBuffers.get(page).toString('utf8'));
   const exact=expectedSourceRevision&&remote.catalog.sourceRevision===expectedSourceRevision;
   let mode,supersededBy,changedVerified;
   if(exact){
    assert.equal(remote.corpus.sourceRevision,expectedSourceRevision,'Published corpus source revision mismatch');
    assert(sameContent(local,remote),'Published source content or internal revision mismatch');
    // A generated page can keep valid language metadata while its body went stale,
    // so the build that claims to be this SHA is compared byte-for-byte. A newer
    // build may legitimately render newer pages; there the changed files are checked.
    for(const page of pages)assert(remoteBuffers.get(page).equals(buffers.get(page)),'Published page differs from this build: '+page);
    mode='exact';
   }else{
    ({mode,supersededBy,changedVerified}=await verifySupersededPublication({changed,changeList,remote,local,buffers:remoteBuffers,assets,sha,isDescendant:assertDescendant,probeMissing:async path=>{
     const url=new URL(path,base);
     url.searchParams.set('publication',sha+'-'+attempt+'-removed');
     const response=await fetchAsset(url,{signal,cache});
     if(response.ok){await response.body?.cancel?.();throw Error('A deleted asset is still published: '+path);}
     // Only an explicit "not found" proves absence; a server error proves nothing.
     if(response.status!==404&&response.status!==410)throw Error('Cannot confirm a deleted asset is gone (HTTP '+response.status+'): '+path);
    }}));
   }
   publication={catalog:remoteBuffers.get('catalog.json').toString('utf8'),corpus:remoteBuffers.get('corpus.json').toString('utf8'),sourceCount:remote.corpus.sources.length,localRevision:local.corpus.revision,publishedRevision:remote.corpus.revision,mode,supersededBy,changedVerified};
   return true;
  }
 });
 return status==='matched'?{status,...publication}:{status};
}
exports.sameContent=sameContent;
exports.servedAssets=servedAssets;
exports.reportWorkflowResult=reportWorkflowResult;
exports.waitForPublishedVersion=waitForPublishedVersion;
exports.verifySupersededPublication=verifySupersededPublication;
if(require.main===module){
 reportWorkflowResult(false);
 const base=process.env.FACET_URL||'https://richardhan.github.io/ai-agent-use-cases/';
 const built=process.env.BUILT_SITE||'_site',output=process.env.PUBLISHED_BUILD||'/tmp/facet-published';
 (async()=>{
  const changeList=publicationChangeList(process.env.PUSH_BASE_SHA,process.env.GITHUB_SHA);
  const result=await waitForPublishedVersion({base,built,changeList});
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,'catalog.json'),result.catalog);fs.writeFileSync(path.join(output,'corpus.json'),result.corpus);
  fs.writeFileSync('qa-artifacts/published-version.json',JSON.stringify({base,sourceCount:result.sourceCount,localRevision:result.localRevision,publishedRevision:result.publishedRevision,mode:result.mode,supersededBy:result.supersededBy||null,changedVerified:result.changedVerified||0,verifiedAt:new Date().toISOString()},null,2));
  reportWorkflowResult(true);
  console.log(result.mode==='exact'
   ?'PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH '+process.env.GITHUB_SHA
   :'PUBLISHED_CHANGED_BYTES_MATCH '+process.env.GITHUB_SHA+' superseded by '+result.supersededBy+' ('+result.changedVerified+' files verified)');
 })().catch(error=>{console.error(error);process.exitCode=1});
}
