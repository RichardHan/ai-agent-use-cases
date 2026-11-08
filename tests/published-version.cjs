'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {waitForPublishedAssets}=require('../scripts/published-assets.cjs');
const {changedPublicationPaths,isDescendantOf}=require('../scripts/published-check.cjs');
const {pages,checkPageLanguage}=require('../scripts/check-page-language.cjs');
const assets=['index.html','assets/app.js','assets/style.css','assets/reader.js','assets/reader.css'];
const SOURCE_DIR=/^(?:cases|evidence)\/|^sources\/pending\.md$/;
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
function readChangedBytes(changedPaths,root='.'){
 const entries=[];
 for(const change of changedPaths||[]){
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
function verifySupersededPublication({changed,remote,buffers,ancestor,sha,isDescendant=isDescendantOf}){
 assert(remote.catalog.sourceRevision,'Published catalog has no source revision; cannot tell which build is live');
 assert.equal(remote.corpus.sourceRevision,remote.catalog.sourceRevision,'Published corpus and catalog revisions disagree');
 const live=remote.catalog.sourceRevision;
 assert.notEqual(live,sha,'Superseded comparison needs a different live revision');
 isDescendant(sha,live);
 const sources=new Map(remote.corpus.sources.map(source=>[source.path,source.markdown]));
 let verified=0;
 for(const entry of changed){
  if(SOURCE_DIR.test(entry.path)){
   const markdown=sources.get(entry.path);
   if(entry.deleted){assert.equal(markdown,undefined,'A deleted source is still published: '+entry.path);verified++;continue;}
   assert.notEqual(markdown,undefined,'Published corpus is missing '+entry.path);
   assert(Buffer.from(markdown,'utf8').equals(entry.bytes),'Published source differs from this push: '+entry.path);
  }else{
   const index=assets.indexOf(entry.path);
   assert(index>=0,'Unsupported changed file: '+entry.path);
   if(entry.deleted){continue;}
   assert(buffers[index].equals(entry.bytes),'Published asset differs from this push: '+entry.path);
  }
  verified++;
 }
 return {mode:'superseded',supersededBy:live,changedVerified:verified};
}
async function waitForPublishedVersion({base,built='_site',sha=process.env.GITHUB_SHA,expectedSourceRevision=process.env.GITHUB_REF==='refs/heads/main'?sha:null,changedPaths=[],root='.',fetchAsset=fetch,isDescendant=isDescendantOf,now,sleep}){
 const files=[...assets,'catalog.json','corpus.json',...pages.filter(page=>page!=='index.html')];
 const expected=files.slice(0,assets.length+2).map(file=>fs.readFileSync(path.join(built,file)));
 const local={catalog:JSON.parse(expected[assets.length]),corpus:JSON.parse(expected[assets.length+1])};
 const changed=readChangedBytes(changedPaths,root);
 // Retries repeat every few seconds; the answer for one revision pair cannot change.
 const ancestry=new Map();
 const assertDescendant=(ancestor,descendant)=>{
  const key=ancestor+'..'+descendant;
  if(!ancestry.has(key)){
   try{ancestry.set(key,{value:isDescendant(ancestor,descendant)})}
   catch(error){ancestry.set(key,{error})}
  }
  const entry=ancestry.get(key);
  if(entry.error)throw entry.error;
  return entry.value;
 };
 let publication;
 // The shared 60-minute deadline covers product bytes and semantic corpus checks together.
 const status=await waitForPublishedAssets({
  base,sha,files:[],now,sleep,
  // A newer main tip is no longer a reason to stop looking: the comparison below
  // decides whether the live build provably contains what this push published.
  isCurrent:()=>true,
  verify:async({signal,cache,attempt})=>{
   const responses=await Promise.allSettled(files.map(async file=>{
    const url=new URL(file==='index.html'?'':file,base);
    url.searchParams.set('publication',sha+'-'+attempt);
    const response=await fetchAsset(url,{signal,cache});
    if(!response.ok){await response.body?.cancel();throw Error('HTTP '+response.status+' '+file);}
    return Buffer.from(await response.arrayBuffer());
   }));
   // Finish every response body before the shared gate starts another round.
   const buffers=responses.map(response=>{
    if(response.status==='rejected')throw response.reason;
    return response.value;
   });
   const catalog=buffers[assets.length].toString('utf8'),corpus=buffers[assets.length+1].toString('utf8');
   const remote={catalog:JSON.parse(catalog),corpus:JSON.parse(corpus)};
   assert(assets.every((file,i)=>buffers[i].equals(expected[i])),'Product asset mismatch');
   for(const [i,page] of pages.entries())checkPageLanguage(page,(i===0?buffers[0]:buffers[assets.length+1+i]).toString('utf8'));
   const exact=expectedSourceRevision&&remote.catalog.sourceRevision===expectedSourceRevision;
   let mode,supersededBy,changedVerified;
   if(exact){
    assert.equal(remote.corpus.sourceRevision,expectedSourceRevision,'Published corpus source revision mismatch');
    assert(sameContent(local,remote),'Published source content or internal revision mismatch');
    mode='exact';
   }else{
    ({mode,supersededBy,changedVerified}=verifySupersededPublication({changed,remote,buffers,sha,isDescendant:assertDescendant}));
   }
   publication={catalog,corpus,sourceCount:remote.corpus.sources.length,localRevision:local.corpus.revision,publishedRevision:remote.corpus.revision,mode,supersededBy,changedVerified};
   return true;
  }
 });
 return status==='matched'?{status,...publication}:{status};
}
exports.sameContent=sameContent;
exports.reportWorkflowResult=reportWorkflowResult;
exports.waitForPublishedVersion=waitForPublishedVersion;
exports.verifySupersededPublication=verifySupersededPublication;
if(require.main===module){
 reportWorkflowResult(false);
 const base=process.env.FACET_URL||'https://richardhan.github.io/ai-agent-use-cases/';
 const built=process.env.BUILT_SITE||'_site',output=process.env.PUBLISHED_BUILD||'/tmp/facet-published';
 (async()=>{
  const changedPaths=changedPublicationPaths(process.env.PUSH_BASE_SHA,process.env.GITHUB_SHA);
  const result=await waitForPublishedVersion({base,built,changedPaths});
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,'catalog.json'),result.catalog);fs.writeFileSync(path.join(output,'corpus.json'),result.corpus);
  fs.writeFileSync('qa-artifacts/published-version.json',JSON.stringify({base,assets,sourceCount:result.sourceCount,localRevision:result.localRevision,publishedRevision:result.publishedRevision,mode:result.mode,supersededBy:result.supersededBy||null,changedVerified:result.changedVerified||0,verifiedAt:new Date().toISOString()},null,2));
  reportWorkflowResult(true);
  console.log(result.mode==='exact'
   ?'PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH '+process.env.GITHUB_SHA
   :'PUBLISHED_CHANGED_BYTES_MATCH '+process.env.GITHUB_SHA+' superseded by '+result.supersededBy+' ('+result.changedVerified+' files verified)');
 })().catch(error=>{console.error(error);process.exitCode=1});
}
