'use strict';
// GitHub Pages can serve `catalog.json` and `corpus.json` from different builds
// for a few seconds around a deploy. This drives that window with a real browser:
// a newer corpus must still load as one request and pin to its own build, while
// an older corpus still falls back to per-source reads.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.SITE_URL||'http://127.0.0.1:8081/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/publish-window';fs.mkdirSync(out,{recursive:true});
const CATALOG_REVISION='20261109091843207251205';
const CORPUS_REVISION='20261109094004465420250';
const OLDER_REVISION='20261109080000000000000';
const CORPUS_SHA='b'.repeat(40);

(async()=>{
 const browser=await chromium.launch();
 const observations=[];
 const run=async mode=>{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  const requests=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{const path=new URL(request.url()).pathname;if(/\.(md|json)$/.test(path))requests.push(path);});
  await page.route('**/catalog.json',async route=>{
   const response=await route.fetch(),catalog=await response.json();
   catalog.bundleRevision=CATALOG_REVISION;
   await route.fulfill({response,json:catalog});
  });
  await page.route('**/corpus.json',async route=>{
   const response=await route.fetch(),corpus=await response.json();
   corpus.revision=mode==='older'?OLDER_REVISION:CORPUS_REVISION;
   corpus.sourceRevision=CORPUS_SHA;
   await route.fulfill({response,json:corpus});
  });
  try{
   await page.goto(base);
   await page.waitForFunction(()=>discoveryReady,null,{timeout:60000});
   const result=await page.evaluate(()=>({entries:entries.length,failed:failedPaths.length}));
   const bundles=requests.filter(path=>path.endsWith('/corpus.json')).length;
   const sourceFiles=requests.filter(path=>path.endsWith('.md')).length;
   assert.deepEqual(result.failed,0,'a newer corpus must load the whole collection');
   assert(result.entries>400,'the published collection should be fully readable');
   if(mode==='newer'){
    assert.equal(sourceFiles,0,'a newer corpus must not be replaced by per-source reads');
    assert.equal(bundles,1,'the corpus is still one request');
    await page.goto(`${base}?case=UC-514`);
    await page.locator('#detail[open]').waitFor({timeout:30000});
    const href=await page.evaluate(()=>{const link=[...document.querySelectorAll('#detail-body a')].find(anchor=>/GitHub 原始 Markdown/.test(anchor.textContent));return link?link.getAttribute('href'):null;});
    assert(href&&href.includes(CORPUS_SHA),'the delivered text must pin to the build its corpus names');
    observations.push({mode,entries:result.entries,bundles,sourceFiles,pinned:href.slice(0,96)});
    await page.screenshot({path:`${out}/newer-corpus-390.png`});
   }else{
    assert(sourceFiles>0,'an older corpus must fall back to per-source reads');
    observations.push({mode,entries:result.entries,bundles,sourceFiles});
   }
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 };
 try{
  await run('newer');
  await run('older');
  fs.writeFileSync(out+'/report.json',JSON.stringify(observations,null,2));
  console.log(JSON.stringify(observations));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
