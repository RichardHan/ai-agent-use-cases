'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {AxeBuilder}=require('@axe-core/playwright');
module.exports=async function arrival({browser,origin,prefix='arrival',sizes=[['mobile',390,844]]}){
 fs.mkdirSync('qa-artifacts',{recursive:true});const report=[];
 for(const [name,width,height] of sizes){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedSearch=text;}}}));
  const page=await context.newPage(),errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));
  context.on('response',r=>{if(r.status()>=400)network.push({url:r.url(),status:r.status()});});
  context.on('requestfailed',r=>network.push({url:r.url(),failure:r.failure()?.errorText}));
  context.on('page',p=>p.on('console',m=>{if(m.type()==='warning'||m.type()==='error')network.push({console:m.text()});}));
  page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')network.push({console:m.text()});});
  const diagnose=async(p,stage)=>{
   const state=await p.evaluate(()=>({url:location.href,query:document.getElementById('query').value,
    facets:Object.fromEntries(['kind','tool','category','proof'].map(id=>[id,document.getElementById(id)?.value])),
    scenario:typeof activeScenario==='undefined'?null:activeScenario,
    count:document.querySelectorAll('#results .card').length,label:document.getElementById('results-count').textContent,
    ids:typeof currentFiltered==='undefined'?[]:currentFiltered.map(x=>x.id),
    entries:typeof entries==='undefined'?null:entries.length,failedPaths:typeof failedPaths==='undefined'?[]:failedPaths}));
   const record={prefix,size:name,stage,...state,network:network.splice(0)};
   fs.appendFileSync('qa-artifacts/'+prefix+'-arrival-diagnostics.jsonl',JSON.stringify(record)+'\n');
   console.log('ARRIVAL_STATE '+JSON.stringify(record));
   return state;
  };
  const sameResults=async(p,stage,expected)=>{
   const state=await diagnose(p,stage);
   if(state.count!==expected)await p.screenshot({path:'qa-artifacts/'+prefix+'-'+name+'-'+stage+'-failure.jpg'});
   assert.equal(state.count,expected,'Search result count changed at '+stage+'; inspect ARRIVAL_STATE');
  };
  const ready=async suffix=>{await page.goto(origin+suffix,{waitUntil:'networkidle'});await page.locator('#results-count').filter({hasText:'顯示'}).waitFor();};
  const snapshot=async label=>{
   const shot=await page.screenshot({type:'jpeg',quality:70});
   fs.writeFileSync('qa-artifacts/'+prefix+'-'+label+'-'+name+'.jpg',shot);
   console.log('VISUAL:'+prefix+'-'+label+'-'+name+':'+shot.toString('base64'));
  };
  // Journey 1: a received search link lands with its query, facets and results.
  await ready('?q=旅遊&tool=Grok%20Bot#explore');
  const metrics=await page.evaluate(()=>({queryTop:Math.round(document.getElementById('query').getBoundingClientRect().top),resultsTop:Math.round(document.getElementById('results-count').getBoundingClientRect().top),focus:document.activeElement.id,scrollY,loadMs:Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd),domContentLoadedMs:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd)}));
  assert(metrics.queryTop>0&&metrics.queryTop<height/2,'Shared search should show query in the upper half');
  assert(metrics.resultsTop>0&&metrics.resultsTop<height,'Shared search should show the result count');
  assert.equal(metrics.focus,'search-title');
  const count=await page.locator('#results .card').count();assert(count>0);await diagnose(page,'initial');
  await snapshot('search');
  await page.locator('#copy-search-link').focus();await page.keyboard.press('Enter');
  const shared=await page.evaluate(()=>window.copiedSearch);
  const url=new URL(shared);assert.equal(url.hash,'#explore');assert.equal(url.searchParams.get('q'),'旅遊');
  assert.equal(url.searchParams.get('tool'),'Grok Bot');assert.equal(url.searchParams.has('case'),false);
  assert.match(await page.locator('#search-share-status').innerText(),/已複製/);
  const recipient=await context.newPage();
  await recipient.goto(shared,{waitUntil:'networkidle'});
  await sameResults(recipient,'recipient',count);
  assert.equal(await recipient.evaluate(()=>document.activeElement.id),'search-title');
  await recipient.reload({waitUntil:'networkidle'});
  await sameResults(recipient,'recipient-reload',count);
  await recipient.close();
  const trigger=page.locator('#results .card .card-bottom button').first();
  await trigger.click();await page.locator('#detail[open]').waitFor();const direct=page.url();
  await page.goBack();
  console.log('BACK_FOCUS '+JSON.stringify(await page.evaluate(async()=>{const describe=()=>({tag:document.activeElement.tagName,id:document.activeElement.id,card:document.activeElement.closest('.card')?.dataset.caseId,scrollY,button:document.querySelector('#results .card .card-bottom button').getBoundingClientRect().toJSON()});const before=describe();await new Promise(requestAnimationFrame);const after=describe();await new Promise(requestAnimationFrame);return {before,after,settled:describe()};})));
  await page.waitForFunction(()=>!document.getElementById('detail').open&&document.activeElement.matches('#results .card .card-bottom button'));assert.equal(await trigger.evaluate(n=>n===document.activeElement),true);
  await snapshot('back');const backButton=await trigger.boundingBox();assert(backButton.y>=0&&backButton.y+backButton.height<=height,'Back must restore a visible originating button: '+JSON.stringify({backButton,height}));
  await page.goto(direct,{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();await sameResults(page,'direct',count);
  await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();await sameResults(page,'direct-reload',count);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'detail-title');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  await sameResults(page,'return',count);
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
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:undefined}));
  await page.locator('#copy-search-link').click();assert.equal(await manual.isVisible(),true);
  await page.locator('#query').fill('旅遊');
  // A completed older copy must not announce success for newly changed conditions.
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>new Promise(resolve=>{window.finishCopy=resolve;})}}));
  await page.locator('#copy-search-link').click();
  await page.locator('#query').fill('收件匣');
  await page.evaluate(()=>window.finishCopy());
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
 await page.unroute('**/catalog.json');await page.locator('#retry').focus();await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
 await page.locator('#results-count').filter({hasText:'顯示'}).waitFor();
 assert.equal(await page.locator('#copy-search-link').isEnabled(),true);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
 assert.equal(await page.locator('#query').inputValue(),'旅遊');
 await page.close();
 fs.writeFileSync('qa-artifacts/'+prefix+'.json',JSON.stringify(report,null,2));console.log('ARRIVAL_RESULTS '+prefix+' '+JSON.stringify(report));
};
