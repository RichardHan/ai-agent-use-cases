'use strict';
const assert=require('node:assert/strict');
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
exports.sameContent=sameContent;
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path');
 const base=process.env.FACET_URL||'https://richardhan.github.io/ai-agent-use-cases/';
 const {skipIfSupersededPublishedUrl}=require('../scripts/published-check.cjs');
 if(skipIfSupersededPublishedUrl(base)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
 const built=process.env.BUILT_SITE||'_site',output=process.env.PUBLISHED_BUILD||'/tmp/facet-published';
 const assets=['index.html','assets/app.js','assets/style.css','assets/reader.js','assets/reader.css'];
 const local={catalog:JSON.parse(fs.readFileSync(path.join(built,'catalog.json'),'utf8')),corpus:JSON.parse(fs.readFileSync(path.join(built,'corpus.json'),'utf8'))};
 (async()=>{
  let diagnostic='';
  for(let attempt=0;attempt<300;attempt++){
   try{
    const responses=await Promise.all([...assets,'catalog.json','corpus.json'].map(async file=>{
     const response=await fetch(base+(file==='index.html'?'':file)+'?facet-release='+process.env.GITHUB_SHA,{cache:'no-store',signal:AbortSignal.timeout(15000)});
     assert(response.ok,'HTTP '+response.status+' '+file);return response.text();
    }));
    const remote={catalog:JSON.parse(responses[assets.length]),corpus:JSON.parse(responses[assets.length+1])};
    assert(assets.every((file,i)=>responses[i]===fs.readFileSync(path.join(built,file),'utf8')),'Product asset mismatch');
    assert(sameContent(local,remote),'Published source content or internal revision mismatch');
    fs.mkdirSync(output,{recursive:true});
    fs.writeFileSync(path.join(output,'catalog.json'),responses[assets.length]);fs.writeFileSync(path.join(output,'corpus.json'),responses[assets.length+1]);
    fs.writeFileSync('qa-artifacts/published-version.json',JSON.stringify({base,assets,sourceCount:remote.corpus.sources.length,localRevision:local.corpus.revision,publishedRevision:remote.corpus.revision,verifiedAt:new Date().toISOString()},null,2));
    console.log('PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH '+process.env.GITHUB_SHA);return;
   }catch(error){diagnostic=error.message;}
   await new Promise(resolve=>setTimeout(resolve,3000));
  }
  throw Error('Published release mismatch: '+diagnostic);
 })().catch(error=>{console.error(error);process.exitCode=1});
}
