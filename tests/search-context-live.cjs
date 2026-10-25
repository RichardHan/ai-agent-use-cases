'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.MATCH_LIVE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const {skipIfSupersededPublishedUrl}=require('../scripts/published-check.cjs');
if(skipIfSupersededPublishedUrl(origin)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
(async()=>{
 for(const path of ['assets/app.js','assets/style.css']){
  const expected=fs.readFileSync(path,'utf8');
  let matched=false;
  for(let i=0;i<181;i++){
   const response=await fetch(origin+path+'?context-qa='+Date.now(),{cache:'no-store'});
   if(response.ok&&await response.text()===expected){matched=true;break;}
   await new Promise(r=>setTimeout(r,5000));
  }
  assert(matched,'Published asset must match checked-out commit: '+path);
 }
 const browser=await chromium.launch();
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  const actualAssets=['assets/app.js','assets/style.css'].map(async path=>{
   const response=await page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/'+path));
   assert.equal(await response.text(),fs.readFileSync(path,'utf8'),'Browser-loaded asset: '+path);
  });
  await page.goto(origin+'?q='+encodeURIComponent('薪水')+'#explore',{waitUntil:'networkidle'});
  await Promise.all(actualAssets);
  await page.locator('#results .card').first().waitFor();
  assert.equal(await page.evaluate(()=>failedPaths.length),0);
  const cards=page.locator('#results .card');
  assert.equal(await cards.count(),await page.locator('#results .search-context').count());
  assert.match(await page.locator('[data-case-id="UC-024"] .search-context-excerpt').innerText(),/不登入系統、改派車、算薪資/);
  const ids=await cards.evaluateAll(es=>es.map(e=>e.dataset.caseId));
  await cards.first().locator('.card-bottom button').click();await page.locator('#detail[open]').waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>!!document.activeElement.closest('#results')),true);
  assert.deepEqual(await cards.evaluateAll(es=>es.map(e=>e.dataset.caseId)),ids);
  await page.locator('#query').fill('');assert.equal(await page.locator('#results .search-context').count(),0);
  console.log('MATCH_LIVE_PASS '+name+': exact deployed assets, complete corpus, explanations, detail and return, clear');
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
