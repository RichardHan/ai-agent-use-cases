'use strict';
const fs=require('node:fs'),{createHash}=require('node:crypto');
const {waitForPublishedAssets}=require('../scripts/published-assets.cjs');

function auditSummaryMatches(summary,latest){
 return typeof summary?.latestBatch==='string' && summary.latestBatch.trimEnd()===latest.trimEnd();
}
exports.auditSummaryMatches=auditSummaryMatches;

async function main(){
 const origin=process.env.TRUST_URL;
 const paths=['index.html','assets/audit.js','assets/style.css'];
 const latest=fs.readFileSync('sources/qualification-audit-2026-10-16.md','utf8').split(/^## /m)[1];
 let summary;
 const result=await waitForPublishedAssets({base:origin,sha:process.env.GITHUB_SHA,files:paths,verify:async({base,sha,attempt,signal})=>{
  const url=new URL('audit-summary.json',base);
  url.searchParams.set('publication',sha+'-'+attempt);
  const response=await fetch(url,{cache:'no-store',signal});
  if(!response.ok){await response.body?.cancel();return false;}
  const candidate=await response.json();
  if(!auditSummaryMatches(candidate,latest))return false;
  summary=candidate;
  return true;
 }});
 if(result==='superseded'){
  console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);
  return;
 }
 fs.mkdirSync('qa-artifacts/published',{recursive:true});
 fs.writeFileSync('qa-artifacts/published/assets.json',JSON.stringify({checkedAt:new Date().toISOString(),sha:process.env.GITHUB_SHA,paths:paths.map(path=>({path,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')})),summary},null,2));
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,'verified=true\n');
 console.log('PUBLISHED_AUDIT_MATCH '+process.env.GITHUB_SHA);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
