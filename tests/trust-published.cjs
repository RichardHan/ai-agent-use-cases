'use strict';
const fs=require('node:fs'),{createHash}=require('node:crypto');
(async()=>{
 const origin=process.env.TRUST_URL;
 const paths=['index.html','assets/audit.js','assets/style.css'];
 const latest=fs.readFileSync('sources/qualification-audit-2026-10-16.md','utf8').split(/^## /m)[1];
 for(let attempt=0;attempt<90;attempt++){
  try{
   const bodies=await Promise.all(paths.map(async path=>{const response=await fetch(origin+path,{cache:'no-store'});if(!response.ok)throw Error(path);return response.text();}));
   const response=await fetch(origin+'audit-summary.json',{cache:'no-store'}),summary=await response.json();
   if(response.ok&&summary.latestBatch.trimEnd()===latest.trimEnd()&&bodies.every((body,i)=>body===fs.readFileSync(paths[i],'utf8'))){
    fs.mkdirSync('qa-artifacts/published',{recursive:true});
    fs.writeFileSync('qa-artifacts/published/assets.json',JSON.stringify({checkedAt:new Date().toISOString(),sha:process.env.GITHUB_SHA,paths:paths.map((path,i)=>({path,sha256:createHash('sha256').update(bodies[i]).digest('hex')})),summary},null,2));return;
   }
  }catch{}
  await new Promise(r=>setTimeout(r,5000));
 }
 throw Error('Published assets and current audit batch do not match checkout');
})().catch(e=>{console.error(e);process.exit(1)});
