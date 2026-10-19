const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.RECOVERY_URL||'http://127.0.0.1:8099/ai-agent-use-cases/';
const observe=process.env.OBSERVE==='1',prefix=observe?'before':'after';
fs.mkdirSync('qa-artifacts',{recursive:true});
(async()=>{
 const report=[];
 for(const [engine,width,height] of (observe?[[chromium,1440,1000],[chromium,390,844]]:[[chromium,1440,1000],[chromium,390,844],[chromium,320,740],[firefox,390,844],[webkit,390,844]])){
 const browser=await engine.launch(),page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const start=Date.now();await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>!document.getElementById('copy-search-link').disabled);
 const row={engine:engine.name(),width,readyMs:Date.now()-start};report.push(row);
 await page.screenshot({path:`qa-artifacts/${prefix}-home-${engine.name()}-${width}.png`});
 // Known-task journey: query, facets, details, source and return.
 await page.locator('#query').fill('旅遊');await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');
 const read=page.locator('#results .card .card-bottom button').first();await read.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();
 await page.locator('.research-details').evaluate(e=>e.open=true);
 const source=page.locator('.markdown a[href^="https:"]').first();row.source=await source.getAttribute('href');
 if(width===1440){const pending=page.waitForEvent('popup');await source.click();const popup=await pending;await popup.waitForLoadState('domcontentloaded');row.sourceOpened=popup.url();await popup.close();}
 await page.keyboard.press('Escape');assert(await read.evaluate(e=>e===document.activeElement));
 // Two contradictory facets: removing either alone cannot recover UC-001.
 await page.goto(base+'?q=UC001&scenario=開發&kind=pending&tool=Grok%20Bot#explore',{waitUntil:'networkidle'});await page.locator('#empty').waitFor({state:'visible'});
 row.emptyHint=await page.locator('#empty-hint').innerText();row.suggestions=await page.locator('#empty-suggestions').innerText();
 await page.locator('#empty').scrollIntoViewIfNeeded();await page.screenshot({path:`qa-artifacts/${prefix}-empty-${engine.name()}-${width}.png`});
 if(!observe){
  const recovery=page.locator('#empty-suggestions button');assert.equal(await recovery.count(),1);assert.match(await recovery.innerText(),/使用情境/);assert.match(await recovery.innerText(),/收錄狀態/);assert.match(await recovery.innerText(),/1 筆/);
  await recovery.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#query').inputValue(),'UC001');assert.equal(await page.locator('#scenario').inputValue(),'');assert.equal(await page.locator('#kind').inputValue(),'');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');assert.equal(new URL(page.url()).searchParams.get('tool'),'Grok Bot');assert.equal(await page.locator('#results .card').count(),1);assert(await page.locator('#results-count').evaluate(e=>e===document.activeElement));assert(!new URL(page.url()).searchParams.has('scenario'));
  await page.locator('#results .card .card-bottom button').click();await page.locator('#detail[open]').waitFor();await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();await page.locator('#close-detail').click();assert.equal(await page.locator('#query').inputValue(),'UC001');
  // No query matches: no invented recovery; query editor keeps facets.
  await page.locator('#query').fill('no-task-987654');await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');assert.equal(await page.locator('#empty-suggestions button').count(),0);await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(e=>e===document.activeElement));assert.equal(await page.locator('#scenario').inputValue(),'生活');
  await page.locator('#empty-reset').click();assert(await page.locator('#results .card').count()>300);
  await page.goto(base+'?q=UC001&scenario=開發&kind=pending&tool=Grok%20Bot#explore',{waitUntil:'networkidle'});await page.locator('#empty').waitFor({state:'visible'});
  row.recoveryRenderMs=await page.evaluate(()=>{const t=performance.now();document.getElementById('query').dispatchEvent(new Event('input',{bubbles:true}));return performance.now()-t;});
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.axe=audit.violations.map(v=>v.id);assert.deepEqual(row.axe,[]);
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);fs.writeFileSync(`qa-artifacts/${prefix}-report.json`,JSON.stringify(report,null,2));await browser.close();
 }
 if(!observe){
  const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844}});
  // Source loading, partial recovery and focus retention during background refresh.
  let release;const gate=new Promise(r=>release=r);
  await page.route('**/catalog.json',async route=>{await gate;await route.continue();});
  await page.route('**/cases/001-travel-checkout.md',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.goto(base+'?q=UC001&scenario=開發&kind=pending&tool=Grok%20Bot#explore',{waitUntil:'domcontentloaded'});
  assert(await page.locator('#empty').isHidden());release();
  await page.locator('#partial-load').waitFor({state:'visible'});assert.equal(await page.locator('#empty-suggestions button').count(),0);
  await page.unroute('**/cases/001-travel-checkout.md');await page.locator('#retry-failed').click();await page.locator('#partial-load').waitFor({state:'hidden'});
  const recovery=page.locator('#empty-suggestions [data-remove-filters]');assert.equal(await recovery.count(),1);
  await recovery.focus();
  // The same preservation path used by retry must match a newly rendered button.
  assert(await page.evaluate(()=>{const restore=preserveRecoveryFocus();render(false,true);restore();return document.activeElement.dataset.removeFilters===document.querySelector('#empty-suggestions button').dataset.removeFilters;}));
  // Unknown, long shared facet values wrap and all five removals remain explicit.
  const params=new URLSearchParams({q:'UC001',scenario:'未知情境'.repeat(15),kind:'unknown',tool:'unknown',category:'unknown',proof:'unknown'});
  await page.goto(base+'?'+params+'#explore',{waitUntil:'networkidle'});await page.locator('#empty-suggestions button').waitFor();
  assert.match(await page.locator('#empty-hint').innerText(),/5 項/);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#empty').scrollIntoViewIfNeeded();await page.screenshot({path:'qa-artifacts/after-long-390.png'});
  await page.locator('#empty-suggestions button').click();assert.equal(await page.locator('#results .card').count(),1);
  // Fully unavailable catalog: retain the existing honest error/retry flow.
  await page.route('**/catalog.json',route=>route.fulfill({status:503,body:'Unavailable'}));await page.reload({waitUntil:'networkidle'});await page.locator('#error').waitFor({state:'visible'});assert(await page.locator('#empty').isHidden());await page.unroute('**/catalog.json');await page.locator('#retry').click();await page.locator('#results .card').first().waitFor();
  report.push({journey:'loading-partial-retry-focus-long-error',passed:true});await browser.close();
  fs.writeFileSync('qa-artifacts/after-report.json',JSON.stringify(report,null,2));
 }
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
