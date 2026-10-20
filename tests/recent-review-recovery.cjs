'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {ensureFiltersVisible}=require('./filter-controls.cjs');
const origin=process.env.RECENT_URL||'http://127.0.0.1:8131/ai-agent-use-cases/';
(async()=>{
 const browser=await chromium.launch(),reports=[];
 try{
  // Interact while the catalog is delayed: URL state wins when loading settles.
  let release;const gate=new Promise(resolve=>release=resolve);
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/catalog.json',async route=>{await gate;await route.continue();});
  await page.goto(origin);await ensureFiltersVisible(page);
  await page.locator('#sort').selectOption('reviewed');
  await page.locator('#query').fill('旅遊');release();
  await page.waitForFunction(()=>discoveryReady);
  assert.equal(await page.locator('#sort').inputValue(),'reviewed');assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert(await page.locator('#results .card').count()>0);reports.push({state:'edited during loading',sort:'reviewed',query:'旅遊'});
  await page.close();
  // A missing source rejoins the correct order without losing card focus.
  const partial=await browser.newPage({viewport:{width:390,height:844}});
  let failing=true;
  await partial.route('**/cases/363-*.md',route=>failing?route.fulfill({status:503,body:'test unavailable'}):route.continue());
  await partial.goto(origin+'?sort=reviewed');await partial.waitForFunction(()=>discoveryReady);
  assert.equal(await partial.evaluate(()=>failedPaths.length),1);assert(await partial.locator('#partial-load').isVisible());
  failing=false;
  const button=partial.locator('#results .card .card-bottom button').first();await button.focus();
  const id=await button.evaluate(e=>e.closest('.card').dataset.caseId);
  await partial.evaluate(()=>retryFailedSources());
  assert.equal(await partial.evaluate(()=>failedPaths.length),0);
  assert.equal(await partial.evaluate(()=>document.activeElement.closest('.card')?.dataset.caseId),id);
  assert.equal(await partial.locator('#sort').inputValue(),'reviewed');
  const dates=await partial.evaluate(()=>currentFiltered.map(e=>e.reviewedDate));assert.deepEqual(dates,[...dates].sort().reverse());
  reports.push({state:'partial recovery',focusedID:id,sort:'reviewed',missing:0});await partial.close();
  // A failed catalog can be retried with the selected order intact.
  const error=await browser.newPage();let broken=true;
  await error.route('**/catalog.json',route=>broken?route.fulfill({status:503,body:'unavailable'}):route.continue());
  await error.goto(origin+'?sort=reviewed');await error.locator('#error').waitFor();
  broken=false;await error.locator('#retry').click();await error.waitForFunction(()=>discoveryReady);
  assert.equal(await error.locator('#sort').inputValue(),'reviewed');assert.equal(await error.evaluate(()=>failedPaths.length),0);
  reports.push({state:'catalog error retry',sort:'reviewed',missing:0});await error.close();
 }finally{fs.mkdirSync('qa-artifacts',{recursive:true});fs.writeFileSync('qa-artifacts/recent-recovery.json',JSON.stringify(reports,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
