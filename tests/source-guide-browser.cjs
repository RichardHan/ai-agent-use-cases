'use strict';
const sourceRoute=require('./source-route.cjs');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.GUIDE_URL||'http://127.0.0.1:8123/ai-agent-use-cases/';
const output=process.env.GUIDE_OUTPUT||'qa-artifacts/source-guide';
const observe=process.env.GUIDE_OBSERVE==='1';
fs.mkdirSync(output,{recursive:true});
const report=[];const save=()=>fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));
(async()=>{
 for(const [engine,width,height] of observe||process.env.GUIDE_PUBLISHED==='1'?[[chromium,1440,1000],[chromium,390,844]]:[[chromium,1440,1000],[chromium,390,844],[chromium,320,740],[firefox,390,844],[webkit,390,844]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
  const catalog=await (await context.request.get(base+'catalog.json')).json();
  const hasPending=catalog.files.includes('sources/pending.md');
  const pending=hasPending?await (await context.request.get(base+'sources/pending.md')).text():'';
  const expectedEntries=catalog.files.length-(hasPending?1:0)+(pending.match(/^##\s+P-/gm)||[]).length;
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  const row={engine:engine.name(),width,audits:[]};report.push(row);save();
  const ready=async()=>page.waitForFunction(()=>discoveryReady,null,{timeout:30000});
  const start=Date.now();await page.goto(base+'?q=UC001&proof='+encodeURIComponent('作者報告／示範')+'#explore');await ready();
  row.readyMs=Date.now()-start;row.entries=await page.evaluate(()=>entries.length);row.failed=await page.evaluate(()=>[...failedPaths]);assert.equal(row.entries,expectedEntries);assert.deepEqual(row.failed,[]);
  await page.locator('#results-count').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${observe?'before':'after'}-results-${engine.name()}-${width}.png`});
  row.hasGuide=await page.locator('#source-guide').count();save();
  if(observe){await browser.close();continue;}
  assert.equal(row.hasGuide,1,'readers can inspect what source labels mean next to the results');
  assert(await page.locator('#source-type-note').isHidden(),'long explanations stay optional before reading results');
  if(engine===chromium&&width===1440){
   const cdp=await context.newCDPSession(page);
   const {root}=await cdp.send('DOM.getDocument');
   const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#proof'});
   const {nodes}=await cdp.send('Accessibility.getPartialAXTree',{nodeId,fetchRelatives:false});
   row.sourceSelectDescription=nodes.find(node=>node.description)?.description.value||'';
   assert.match(row.sourceSelectDescription,/未獨立重現/,'closed guidance still describes the source filter in the real accessibility tree');
   await cdp.detach();
  }
  assert.match(await page.locator('#source-type-note').textContent(),/作者報告／示範.*本庫未獨立重現/);
  const summary=page.locator('#source-guide summary');await summary.focus();await page.keyboard.press('Enter');
  assert(await page.locator('#source-guide').evaluate(e=>e.open));assert.equal(await page.locator('#source-guide dt').count(),5);
  assert(await page.locator('#source-type-note').isVisible());
  assert((await summary.boundingBox()).height>=44);
  await page.locator('#source-guide').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/after-guide-${engine.name()}-${width}.png`});
  await page.locator('.source-guidance').screenshot({path:`${output}/after-complete-guide-${engine.name()}-${width}.png`});
  const scan=async state=>{const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({state,violations:a.violations.map(v=>v.id)});save();assert.deepEqual(a.violations,[]);};
  await scan('guide-open');
  await page.keyboard.press('Enter');assert(!(await page.locator('#source-guide').evaluate(e=>e.open)));
  assert(await page.evaluate(()=>entries.every(item=>Object.hasOwn(SOURCE_TYPES,item.proof))),'every source label in the real corpus has a definition');
  // Removing a source condition and clearing facets both restore the default explanation.
  await page.locator('#active-filters [data-remove-filter="proof"]').click();assert.match(await page.locator('#source-type-note').textContent(),/不是.*驗證/);
  await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#proof').selectOption('作者報告／示範');
  await page.locator('#clear-facets').click();assert.match(await page.locator('#source-type-note').textContent(),/不是.*驗證/);
  await page.locator('#proof').selectOption('作者報告／示範');
  // 1. Find an author's account, verify the full original label and source, return to the same card.
  const read=page.locator('#results .card[data-case-id="UC-001"] .card-bottom button');await read.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();
  await page.locator('.research-details').evaluate(e=>e.open=true);
  row.source=await page.locator('.detail-source').getAttribute('href');assert.match(row.source,/github.com\/RichardHan\/ai-agent-use-cases\/blob\/main\/cases\/001-/);
  if(engine===chromium&&width===1440){const pending=page.waitForEvent('popup');await page.locator('.detail-source').click();const popup=await pending;await popup.waitForLoadState('domcontentloaded');row.openedSource=popup.url();await popup.close();const response=await context.request.get(row.source);row.sourceStatus=response.status();}
  await page.keyboard.press('Escape');assert(await read.evaluate(e=>e===document.activeElement));
  // 2. Official origin is explained even with zero matching results; reset updates the message.
  await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#proof').selectOption('官方自報');
  await page.locator('#source-guide summary').click();assert(await page.locator('#source-type-note').isVisible());
  assert.match(await page.locator('#source-type-note').textContent(),/官方.*本庫未獨立重現/);assert(await page.locator('#empty').isVisible());
  await page.locator('#query').fill('no-source-guide-results-987654');assert(await page.locator('#empty').isVisible());await scan('empty');
  await page.locator('#empty-reset').click();assert.match(await page.locator('#source-type-note').textContent(),/不是.*驗證/);
  assert.equal(await page.locator('#results .card').count(),expectedEntries);
  // 3. Shared combined conditions and a long case survive reload and browser Back.
  await page.goto(base+'?q=旅遊&scenario=生活&tool=Grok+Bot&proof='+encodeURIComponent('作者報告／示範')+'&case=UC-001');await ready();await page.locator('#detail[open]').waitFor();await page.reload();await ready();await page.locator('#detail[open]').waitFor();await page.locator('#close-detail').click();
  assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#proof').inputValue(),'作者報告／示範');assert.equal(await page.locator('#scenario').inputValue(),'生活');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
  assert.match(await page.locator('#source-type-note').textContent(),/作者報告/);
  await page.locator('#results .card-bottom button').first().click();await page.goBack();assert(await page.locator('#detail').evaluate(e=>!e.open));
  await page.goto(base+'?case=UC-313');await ready();await page.locator('#detail[open]').waitFor();await page.locator('.research-details').evaluate(e=>e.open=true);assert(await page.locator('.markdown').evaluate(e=>e.scrollWidth<=e.clientWidth));await page.locator('#close-detail').click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  row.journeys=['author source and keyboard return','official origin and empty/reset','shared combined filters/reload/Back and long reading'];row.requests=requests.length;row.complete=true;save();await browser.close();
 }
 if(!observe){
  const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844}});
  let release;const gate=new Promise(r=>release=r);
  await page.route('**/catalog.json',async r=>{await gate;await r.continue();});
  await page.goto(base+'?proof='+encodeURIComponent('官方自報'),{waitUntil:'domcontentloaded'});
  await page.locator('#source-guide summary').click();assert(await page.locator('#source-guide').evaluate(e=>e.open));release();await page.waitForFunction(()=>discoveryReady);assert(await page.locator('#source-guide').evaluate(e=>e.open));
  await sourceRoute(page,'**/cases/001-travel-checkout.md',r=>r.fulfill({status:503,body:'Unavailable'}));await page.reload();await page.waitForFunction(()=>discoveryReady);assert(await page.locator('#partial-load').isVisible());assert.match(await page.locator('#source-type-note').textContent(),/官方/);
  await page.unroute('**/cases/001-travel-checkout.md');await page.locator('#retry-failed').click();await page.waitForFunction(()=>!recoveringSources);assert(await page.locator('#partial-load').isHidden());
  await page.evaluate(()=>{const value='未知來源 <img src=x onerror=alert(1)> '+ '長文字'.repeat(30);const option=document.createElement('option');option.value=value;option.textContent=value;document.getElementById('proof').append(option);document.getElementById('proof').value=value;render();});
  await page.locator('#source-guide').evaluate(e=>e.open=true);
  assert.match(await page.locator('#source-type-note').textContent(),/未列入.*核對原文/);assert.equal(await page.locator('#source-type-note img').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:output+'/after-long-unknown-390.png'});
  await page.route('**/catalog.json',r=>r.fulfill({status:503,body:'Unavailable'}));await page.reload();await page.locator('#error').waitFor({state:'visible'});await page.locator('#source-guide summary').click();assert(await page.locator('#source-guide').evaluate(e=>e.open));await page.unroute('**/catalog.json');await page.locator('#retry').click();await page.waitForFunction(()=>discoveryReady);
  report.push({journey:'loading/disclosure/partial/retry/long-unknown/error',complete:true});save();await browser.close();
 }
 console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);save();process.exit(1);});
