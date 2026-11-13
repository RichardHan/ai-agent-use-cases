'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {waitForLiveRevision}=require('../scripts/published-revision.cjs');
const fs=require('node:fs');
const origin=process.env.DEPLOYED_URL||'https://richardhan.github.io/ai-agent-use-cases/';
// Step 15 owns byte equality and ancestry. A newer build still needs a browser
// walk: docs-only descendants need not have their own Website QA run. Check the
// visitor contract, not this checkout's counts, case titles or layout geometry.
async function walkSuperseded(browser){
 for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.setDefaultTimeout(15000);
  try{
   const response=await page.goto(origin,{waitUntil:'networkidle',timeout:30000});
   assert(response.ok(),'Pages response '+response.status());
   await page.locator('#results .card').first().waitFor();
   const revision=await page.evaluate(async()=>{const r=await fetch('catalog.json',{cache:'no-store'});if(!r.ok)throw Error('Catalog HTTP '+r.status);return (await r.json()).sourceRevision;});
   assert(revision,'The browser must identify the build it walked');
   await page.locator('#query').fill('會議');
   await page.locator('#query').press('Enter');
   await page.locator('#results .card').first().waitFor();
   assert.equal(await page.locator('#query').inputValue(),'會議');
   const searchUrl=page.url();
   await page.locator('#results .card .card-bottom button').first().click();
   await page.locator('#detail[open] .detail-source').waitFor();
   const sharedUrl=page.url();
   assert(new URL(sharedUrl).searchParams.get('case'),'A detail must have a shareable case ID');
   await page.reload({waitUntil:'networkidle'});
   await page.locator('#detail[open] .detail-source').waitFor();
   assert.match(await page.locator('.detail-trust-summary').innerText(),/成果主張.*核讀/s);
   const source=await page.locator('.detail-source').getAttribute('href');
   assert.match(source,/^https:\/\/github\.com\/RichardHan\/ai-agent-use-cases\/blob\/[a-f0-9]{40}\//,'The source link must pin a repository revision');
   // External availability is evidence, not Pages health (GitHub may return 429).
   const sourceStatus=await context.request.get(source,{timeout:15000})
    .then(response=>response.status(),()=> 'unreachable');
   console.log('LIVE_EXTERNAL_SOURCE '+name+' '+sourceStatus+' '+source);
   await page.screenshot({path:'qa-artifacts/superseded-'+name+'-detail.png'});
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.querySelector('#detail').open);
   assert.equal(await page.locator('#query').inputValue(),'會議','Closing a shared detail retains the query');
   assert.equal(page.url(),searchUrl,'Closing a shared detail returns to the same search');
   assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
   await require('./filter-controls.cjs').ensureFiltersVisible(page);
   await page.locator('#scenario').selectOption('工作');
   await page.locator('#query').fill('會議 zxq987-no-match');
   await page.locator('#query').press('Enter');
   await page.locator('#empty').waitFor();
   await page.locator('#active-filters [data-remove-filter="query"]').focus();
   await page.keyboard.press('Enter');
   await page.locator('#results .card').first().waitFor();
   assert.equal(await page.locator('#query').inputValue(),'');
   assert.equal(await page.locator('#scenario').inputValue(),'工作','Recovery retains the other filter');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(errors,[],'Live browser errors');
   await page.screenshot({path:'qa-artifacts/superseded-'+name+'-recovered.png'});
   console.log('PASS LIVE SUPERSEDED: '+name+' problem search, shared detail/reload/source/return, filtered empty recovery; observed sourceRevision='+revision);
  }finally{await context.close();}
 }
}
function reportGate(verdict){
 if(verdict.mode==='superseded'){
  console.log('PUBLISHED_LIVE_BUILD_SUPERSEDED '+(verdict.liveRevision||'unknown revision')+' (step 15 verified bytes; walking the live visitor contract)');
 }else{
  console.log('PUBLISHED_LIVE_BUILD_CURRENT '+(verdict.liveRevision||'')+' (walking the live site)');
 }
}
if(require.main===module)(async()=>{
 // Without a verdict from step 15 (a manual dispatch, or an older caller) the gate
 // derives one itself from the live revision; either way it is bounded: 120s, 5s apart.
 const verdict=await waitForLiveRevision({
  base:origin,sha:process.env.GITHUB_SHA,
  mode:process.env.PUBLICATION_MODE||'',liveRevision:process.env.PUBLICATION_LIVE_REVISION||''
 });
 reportGate(verdict);
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const browser=await chromium.launch();
 try{
 if(verdict.mode==='superseded'){
  await walkSuperseded(browser);
  return;
 }
 {
  const desktop=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await desktop.newPage();
  try{
   const response=await page.goto(origin+'?deploy-check='+Date.now(),{waitUntil:'networkidle',timeout:30000});
   assert(response.ok(),'Pages response '+response.status());
   await page.locator('#drawn-case .card').waitFor({timeout:10000});
   await page.locator('#guide-options [data-scenario="省錢"]').click();
   assert.equal(await page.locator('#scenario').inputValue(),'省錢');
   await page.locator('#active-filters [data-remove-filter="scenario"]').waitFor({timeout:1000});
   assert.match(await page.locator('#active-filters [data-remove-filter="scenario"]').innerText(),/省錢/);
   await page.locator('#drawn-case .card-bottom button').click();
   await page.locator('#detail[open]').waitFor();
   await page.locator('#close-detail').click();
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:'qa-artifacts/live-desktop.png'});
   console.log('PASS LIVE: Pages HTTPS, real generated catalog, scenario discovery and detail');
  }finally{await desktop.close();}
 }
  const mobile=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await mobile.newPage();
 await page.goto(origin+'?scenario=生活&case=UC-001',{waitUntil:'networkidle'});
 await page.locator('#detail[open]').waitFor();
 await page.reload({waitUntil:'networkidle'});
 await page.locator('#detail[open]').waitFor();
 assert.match(await page.locator('#detail-title').innerText(),/交通和住宿/);
 await page.locator('#close-detail').click();
 await page.locator('#guide-options [data-scenario="創作"]').click();
 await page.screenshot({path:'qa-artifacts/live-mobile.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 console.log('PASS LIVE: mobile direct link, refresh, close, scenario selection and no horizontal overflow');
 await require('./mobile-search-browser.cjs')({browser,origin,prefix:'live-mobile-search',sizes:[['desktop',1440,1000],['mobile',390,844]]});
 await require('./search-recovery-browser.cjs')({browser,origin,prefix:'live-search',sizes:[['desktop',1440,1000],['mobile',390,844]]});
 await mobile.close();
 await require('./initial-index-fallback-browser.cjs')({browser,origin});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
