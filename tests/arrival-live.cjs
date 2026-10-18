'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {AxeBuilder}=require('@axe-core/playwright');
const {ensureFiltersVisible}=require('./filter-controls.cjs');
// Real published HTTP, without fixture responses or retries. Chromium uses four
// corpus loads; Firefox/WebKit use two each. Exhaustive boundaries run in preview.
module.exports=async function publishedArrival({browser,origin,engine}){
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const context=await browser.newContext({viewport:engine==='chromium'?{width:1440,height:1000}:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedSearch=text;}}}));
 let page=await context.newPage();const network=[],errors=[],report=[];let loads=0;
 context.on('response',r=>{if(r.status()>=400)network.push({url:r.url(),status:r.status()});});
 context.on('requestfailed',r=>network.push({url:r.url(),failure:r.failure()?.errorText}));
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 page.on('pageerror',e=>errors.push(e.message));
 const capture=async stage=>{
  const shot=await page.screenshot({type:'jpeg',quality:70});
  fs.writeFileSync('qa-artifacts/live-'+engine+'-'+stage+'.jpg',shot);
  console.log('VISUAL:live-'+engine+'-'+stage+':'+shot.toString('base64'));
 };
 const state=async stage=>{
  const row=await page.evaluate(()=>({url:location.href,entries:entries.length,failedPaths,ids:currentFiltered.map(x=>x.id),query:document.getElementById('query').value,
   tool:document.getElementById('tool').value,scenario:activeScenario,focus:document.activeElement.id,
   queryTop:Math.round(document.getElementById('query').getBoundingClientRect().top),
   resultsTop:Math.round(document.getElementById('results-count').getBoundingClientRect().top),viewport:{width:innerWidth,height:innerHeight}}));
  report.push({stage,...row,loads,network:network.splice(0)});
  fs.writeFileSync('qa-artifacts/live-'+engine+'-arrival.json',JSON.stringify(report,null,2));
  console.log('LIVE_ARRIVAL_STATE '+JSON.stringify(report.at(-1)));
  assert.deepEqual(row.failedPaths,[],'Every published source must load; partial results are a failure');
  assert(row.entries>0);assert.deepEqual(errors,[]);
  return row;
 };
 const audit=async stage=>{
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  fs.writeFileSync('qa-artifacts/live-'+engine+'-'+stage+'-axe.json',JSON.stringify(result.violations,null,2));
  assert.deepEqual(result.violations,[]);
 };
 try{
  await page.goto(origin+'?q=旅遊&tool=Grok%20Bot#explore',{waitUntil:'networkidle'});loads++;
  await page.locator('#results .card').first().waitFor();
  const initial=await state('received-search');
  assert.equal(initial.focus,'search-title');assert(initial.queryTop>0&&initial.queryTop<initial.viewport.height/2);
  assert(initial.resultsTop>0&&initial.resultsTop<initial.viewport.height);assert(initial.ids.length>0);
  await capture('search');await audit('search');
  await page.locator('#copy-search-link').focus();await page.keyboard.press('Enter');
  const shared=await page.evaluate(()=>window.copiedSearch),sharedURL=new URL(shared);
  assert.equal(sharedURL.searchParams.get('q'),'旅遊');assert.equal(sharedURL.searchParams.get('tool'),'Grok Bot');
  assert.equal(sharedURL.searchParams.has('case'),false);assert.equal(sharedURL.hash,'#explore');
  const trigger=page.locator('#results .card .card-bottom button').first();
  await trigger.click();await page.locator('#detail[open]').waitFor();const direct=page.url();
  const jump=page.locator('.reader-jump').first(),target=await jump.getAttribute('aria-controls');
  await jump.focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(id=>document.activeElement.id===id,target),true);
  assert.match(await page.locator('.detail-source').getAttribute('href'),/^https:\/\/github\.com\//);
  await capture('reading');await audit('reading');
  await page.goBack();assert.equal(await trigger.evaluate(n=>n===document.activeElement),true);
  assert.deepEqual((await state('in-session-return')).ids,initial.ids);
  await trigger.click();await page.locator('#detail[open]').waitFor();
  if(engine==='chromium'){
   const original=page;page=await context.newPage();await page.setViewportSize({width:390,height:844});
   await page.goto(direct,{waitUntil:'networkidle'});loads++;await page.locator('#detail[open]').waitFor();
   const received=await state('fresh-case-link');assert.deepEqual(received.ids,initial.ids);assert.equal(received.entries,initial.entries);
   await original.close();
  }
  await page.reload({waitUntil:'networkidle'});loads++;await page.locator('#detail[open]').waitFor();
  const reloaded=await state('case-reload');
  assert.deepEqual(reloaded.ids,initial.ids);assert.equal(reloaded.entries,initial.entries);
  assert.equal(reloaded.focus,'detail-title');assert.equal(reloaded.query,'旅遊');assert.equal(reloaded.tool,'Grok Bot');
  await page.keyboard.press('Escape');
  const returned=await state('direct-return');assert.equal(returned.focus,'results-count');
  assert.deepEqual(returned.ids,initial.ids);assert(returned.resultsTop>=0&&returned.resultsTop<returned.viewport.height/2);
  await capture('return');
  await ensureFiltersVisible(page);await page.locator('#scenario').selectOption('開發');
  await page.locator('#category').selectOption('旅遊／消費研究');
  assert.equal(await page.locator('#empty').isVisible(),true);await page.locator('#empty').scrollIntoViewIfNeeded();
  await capture('empty');await audit('empty');
  await page.locator('#empty-suggestions [data-remove-filter="scenario"]').click();
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert((await page.locator('#results .card').count())>0);
  if(engine==='chromium'){
   await page.goto(shared,{waitUntil:'networkidle'});loads++;await page.locator('#results .card').first().waitFor();
   const received=await state('mobile-received-search');
   assert.equal(received.focus,'search-title');assert.deepEqual(received.ids,initial.ids);assert.equal(received.entries,initial.entries);
   assert(received.queryTop>0&&received.queryTop<received.viewport.height/2);
   assert(received.resultsTop>0&&received.resultsTop<received.viewport.height);
   await capture('mobile-search');await audit('mobile-search');
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);console.log('LIVE_ARRIVAL_PASS '+JSON.stringify({engine,loads,entries:initial.entries,matches:initial.ids.length}));
 }catch(error){await capture('failure');throw error;}finally{await context.close();}
};
