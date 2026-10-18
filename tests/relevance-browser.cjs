const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.RELEVANCE_URL||'http://127.0.0.1:8091/ai-agent-use-cases/';
const observe=process.env.OBSERVE==='1',prefix=observe?'before':'after';
fs.mkdirSync('qa-artifacts',{recursive:true});
(async()=>{
 const report=[];
 for(const engine of observe?[chromium]:[chromium,firefox,webkit]){
 const browser=await engine.launch();
 for(const [width,height] of engine===chromium?[[1440,1000],[390,844],[320,740]]:[[390,844]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const start=Date.now();await page.goto(origin,{waitUntil:'networkidle'});await page.locator('#results .card').first().waitFor();
 const row={engine:engine.name(),width,readyMs:Date.now()-start,queries:[]};report.push(row);
 await page.screenshot({path:'qa-artifacts/'+prefix+'-home-'+engine.name()+'-'+width+'.jpg',type:'jpeg',quality:75});
 for(const query of ['薪水','收件匣','UC313']){
  const t=Date.now();await page.locator('#query').fill(query);
  const results=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.caseId,title:n.querySelector('h3').textContent})));
  row.queries.push({query,ms:Date.now()-t,count:results.length,first:results.slice(0,5),salaryPosition:results.findIndex(n=>n.id==='UC-230')+1,incidentalPosition:results.findIndex(n=>n.id==='UC-024')+1});
  await page.locator('#results-count').scrollIntoViewIfNeeded();
  if(query==='薪水')await page.screenshot({path:'qa-artifacts/'+prefix+'-salary-'+engine.name()+'-'+width+'.jpg',type:'jpeg',quality:85});
  if(!observe){
   if(query==='薪水'){assert(results.some(n=>n.id==='UC-230')&&results.some(n=>n.id==='UC-024'));assert(results.findIndex(n=>n.id==='UC-230')<results.findIndex(n=>n.id==='UC-024'));}
   if(query==='UC313')assert.equal(results[0].id,'UC-313');
   assert(await page.locator('#search-order-note').isVisible());
  }
 }
 // Known task: intersect filters, read a source, move through ordered neighbours, then return.
 await page.locator('#query').fill('旅遊');await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');
 const cards=page.locator('#results .card');assert(await cards.count()>1);
 const id=await cards.first().getAttribute('data-case-id'),next=await cards.nth(1).getAttribute('data-case-id');
 const read=cards.first().locator('.card-bottom button');await read.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();
 await page.locator('.research-details').evaluate(e=>e.open=true);
 const link=page.locator('.markdown a[href^="https:"]').first();assert(await link.count());row.source=await link.getAttribute('href');
 if(width===1440){const pending=page.waitForEvent('popup');await link.click();const popup=await pending;await popup.waitForLoadState('domcontentloaded');row.sourceOpened=popup.url();await popup.close();}
 await page.locator('#nav-next-case').click();assert.match(await page.locator('#detail-toolbar-id').innerText(),new RegExp(next));
 await page.locator('#nav-prev-case').click();assert.match(await page.locator('#detail-toolbar-id').innerText(),new RegExp(id));
 await page.keyboard.press('Escape');assert(await read.evaluate(e=>document.activeElement===e));assert.equal(await page.locator('#query').inputValue(),'旅遊');
 // Empty search: edit without resetting the retained facet.
 await page.locator('#query').fill('no-such-task-987654');await page.locator('#empty').waitFor({state:'visible'});
 if(!observe)assert(await page.locator('#search-order-note').isHidden());
 await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(e=>e===document.activeElement));
 // Shared case: direct link, reload and return.
 await page.goto(origin+'?q=UC313&case=UC-313#explore',{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
 await page.locator('#close-detail').click();assert.equal(await page.locator('#query').inputValue(),'UC313');
 if(!observe){
  assert.equal(await page.locator('#results .card').first().getAttribute('data-case-id'),'UC-313');
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.axe=audit.violations.map(v=>v.id);assert.deepEqual(row.axe,[]);
  await page.locator('#query').fill('');assert(await page.locator('#search-order-note').isHidden());
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 fs.writeFileSync('qa-artifacts/'+prefix+'-relevance.json',JSON.stringify(report,null,2));
 await page.close();
 }
 await browser.close();
 }
 console.log('RELEVANCE '+JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
