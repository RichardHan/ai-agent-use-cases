'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {waitForPublishedAssets}=require('../scripts/published-assets.cjs');
const {skipIfSupersededPublishedUrl}=require('../scripts/published-check.cjs');
const assets=['index.html','assets/app.js','assets/style.css','assets/reader.js','assets/reader.css'];
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
async function waitForPublishedVersion({base,built='_site',sha=process.env.GITHUB_SHA,fetchAsset=fetch,isCurrent=()=>!skipIfSupersededPublishedUrl(base),now,sleep}){
 if(!isCurrent())return {status:'superseded'};
 const files=[...assets,'catalog.json','corpus.json'];
 const expected=files.map(file=>fs.readFileSync(path.join(built,file)));
 const local={catalog:JSON.parse(expected[assets.length]),corpus:JSON.parse(expected[assets.length+1])};
 let publication;
 // The shared 60-minute deadline covers product bytes and semantic corpus checks together.
 const status=await waitForPublishedAssets({
  base,sha,files:[],isCurrent,now,sleep,
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
   assert(sameContent(local,remote),'Published source content or internal revision mismatch');
   publication={catalog,corpus,sourceCount:remote.corpus.sources.length,localRevision:local.corpus.revision,publishedRevision:remote.corpus.revision};
   return true;
  }
 });
 return status==='matched'?{status,...publication}:{status};
}
exports.sameContent=sameContent;
exports.reportWorkflowResult=reportWorkflowResult;
exports.waitForPublishedVersion=waitForPublishedVersion;
if(require.main===module){
 reportWorkflowResult(false);
 const base=process.env.FACET_URL||'https://richardhan.github.io/ai-agent-use-cases/';
 const built=process.env.BUILT_SITE||'_site',output=process.env.PUBLISHED_BUILD||'/tmp/facet-published';
 (async()=>{
  const result=await waitForPublishedVersion({base,built});
  if(result.status==='superseded'){
   console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);
   return;
  }
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,'catalog.json'),result.catalog);fs.writeFileSync(path.join(output,'corpus.json'),result.corpus);
  fs.writeFileSync('qa-artifacts/published-version.json',JSON.stringify({base,assets,sourceCount:result.sourceCount,localRevision:result.localRevision,publishedRevision:result.publishedRevision,verifiedAt:new Date().toISOString()},null,2));
  reportWorkflowResult(true);
  console.log('PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH '+process.env.GITHUB_SHA);
 })().catch(error=>{console.error(error);process.exitCode=1});
}
