'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {AxeBuilder}=require('@axe-core/playwright');
module.exports=async function arrival({browser,origin,prefix='arrival',sizes=[['mobile',390,844]]}){
 fs.mkdirSync('qa-artifacts',{recursive:true});const report=[];
 for(const [name,width,height] of sizes){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedSearch=text;}}}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const ready=async suffix=>{await page.goto(origin+suffix,{waitUntil:'networkidle'});await page.locator('#results-count').filter({hasText:'顯示'}).waitFor();};
  const snapshot=async label=>{
   const shot=await page.screenshot({type:'jpeg',quality:70});
   fs.writeFileSync('qa-artifacts/'+prefix+'-'+label+'-'+name+'.jpg',shot);
   console.log('VISUAL:'+prefix+'-'+label+'-'+name+':'+shot.toString('base64'));
  };
  // Journey 1: a received search link lands with its query, facets and results.
  await ready('?q=旅遊&tool=Grok%20Bot');
  const metrics=await page.evaluate(()=>({queryTop:Math.round(document.getElementById('query').getBoundingClientRect().top),resultsTop:Math.round(document.getElementById('results-count').getBoundingClientRect().top),focus:document.activeElement.id,scrollY}));
  assert(metrics.queryTop>0&&metrics.queryTop<height/2,'Shared search should show query in the upper half');
  assert(metrics.resultsTop>0&&metrics.resultsTop<height,'Shared search should show the result count');
  assert.equal(metrics.focus,'search-title');
  const count=await page.locator('#results .card').count();assert(count>0);
  await snapshot('search');
  await page.locator('#copy-search-link').focus();await page.keyboard.press('Enter');
  const shared=await page.evaluate(()=>window.copiedSearch);
  const url=new URL(shared);assert.equal(url.hash,'#explore');assert.equal(url.searchParams.get('q'),'旅遊');
  assert.equal(url.searchParams.get('tool'),'Grok Bot');assert.equal(url.searchParams.has('case'),false);
  assert.match(await page.locator('#search-share-status').innerText(),/已複製/);
  await page.goto(shared,{waitUntil:'networkidle'});
  assert.equal(await page.locator('#results .card').count(),count);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'search-title');
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#results .card').count(),count);
  const trigger=page.locator('#results .card .card-bottom button').first();
  await trigger.click();await page.locator('#detail[open]').waitFor();const direct=page.url();
  await page.goBack();assert.equal(await trigger.evaluate(n=>n===document.activeElement),true);
  await page.goto(direct,{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
  await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'detail-title');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert.equal(await page.locator('#results .card').count(),count);
  const returned=await page.locator('#results-count').boundingBox();assert(returned.y>=0&&returned.y<height/2);
  await snapshot('return');
  // Journey 2: a shared empty result is visible and can be recovered without losing the query.
  await ready('?q=旅遊&scenario=開發&category='+encodeURIComponent('旅遊／消費研究'));
  assert.equal(await page.locator('#empty').isVisible(),true);
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.deepEqual(audit.violations,[]);
  await snapshot('empty');
  await page.locator('#empty-suggestions [data-remove-filter="scenario"]').click();
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert((await page.locator('#results .card').count())>0);
  // Journey 3: permission-denied copying offers a selectable URL, with stale feedback cleared.
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied');}}}));
  await page.locator('#query').fill('長搜尋文字'.repeat(40)+' <script>');
  await page.locator('#copy-search-link').click();
  const manual=page.locator('#search-share-url');assert.equal(await manual.isVisible(),true);
  assert.equal(await manual.evaluate(n=>n===document.activeElement),true);
  assert.equal(new URL(await manual.inputValue()).searchParams.get('q'),await page.locator('#query').inputValue());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.doesNotMatch(await page.locator('#search-share-status').innerText(),/已複製/);
  const manualAudit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(manualAudit.violations,[]);
  await page.locator('#query').fill('旅遊');assert.equal(await manual.isVisible(),false);
  assert.equal(await page.locator('#search-share-status').innerText(),'');
  // Homepage and an explicit discovery anchor keep their original destination.
  await ready('');assert.equal(await page.evaluate(()=>scrollY),0);
  await ready('?q=旅遊#discover');assert.notEqual(await page.evaluate(()=>document.activeElement.id),'search-title');
  await ready('?kind=pending');assert((await page.locator('#results .card').count())>0);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'search-title');
  assert.deepEqual(errors,[]);
  report.push({viewport:name,...metrics,matches:count,axeScans:2,axeViolations:0,passed:true});
  await context.close();
 }
 // A delayed load must not steal a reader's keyboard focus or scroll position.
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await page.route('**/catalog.json',async route=>{await new Promise(resolve=>setTimeout(resolve,1200));await route.continue();});
 await page.goto(origin+'?q=旅遊',{waitUntil:'domcontentloaded'});
 await page.locator('#query').focus();await page.keyboard.press('Tab');
 const focus=await page.evaluate(()=>document.activeElement.id);
 await page.evaluate(()=>scrollTo({top:100,behavior:'instant'}));
 await page.locator('#results-count').filter({hasText:'顯示'}).waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement.id),focus);
 assert.equal(await page.evaluate(()=>scrollY),100);
 await page.unroute('**/catalog.json');
 // Failures are reached; retry is explicit and does not jump away from the results.
 await page.route('**/catalog.json',route=>route.fulfill({status:503,body:'Unavailable'}));
 await page.goto(origin+'?q=旅遊',{waitUntil:'networkidle'});
 assert.equal(await page.locator('#error').isVisible(),true);
 assert.equal(await page.locator('#copy-search-link').isDisabled(),true);
 await page.unroute('**/catalog.json');await page.locator('#retry').click();
 await page.locator('#results-count').filter({hasText:'顯示'}).waitFor();
 assert.equal(await page.locator('#copy-search-link').isEnabled(),true);
 assert.equal(await page.locator('#query').inputValue(),'旅遊');
 await page.close();
 fs.writeFileSync('qa-artifacts/'+prefix+'.json',JSON.stringify(report,null,2));console.log('ARRIVAL_RESULTS '+prefix+' '+JSON.stringify(report));
};
