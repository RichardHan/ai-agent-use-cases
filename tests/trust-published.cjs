'use strict';
const fs=require('node:fs'),{createHash}=require('node:crypto');
const origin=process.env.TRUST_URL;
const {skipIfSupersededPublishedUrl}=require('../scripts/published-check.cjs');
const {waitForPublishedAssets}=require('../scripts/published-assets.cjs');
(async()=>{
 const paths=['index.html','assets/audit.js','assets/style.css'];
 const latest=fs.readFileSync('sources/qualification-audit-2026-10-16.md','utf8').split(/^## /m)[1];
 let summary;
 const result=await waitForPublishedAssets({
  base:origin,sha:process.env.GITHUB_SHA,files:paths,
  isCurrent:()=>!skipIfSupersededPublishedUrl(origin),
  verify:async ({base,sha,attempt,signal,cache})=>{
   const url=new URL('audit-summary.json',base);
   url.searchParams.set('publication',sha+'-'+attempt);
   const response=await fetch(url,{signal,cache});
   if(!response.ok){await response.body?.cancel();return false;}
   const candidate=await response.json();
   if(typeof candidate.latestBatch!=='string'||candidate.latestBatch.trimEnd()!==latest.trimEnd())return false;
   summary=candidate;return true;
  }
 });
 if(result==='superseded'){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);return;}
 fs.mkdirSync('qa-artifacts/published',{recursive:true});
 fs.writeFileSync('qa-artifacts/published/assets.json',JSON.stringify({checkedAt:new Date().toISOString(),sha:process.env.GITHUB_SHA,paths:paths.map(path=>({path,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')})),summary},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
