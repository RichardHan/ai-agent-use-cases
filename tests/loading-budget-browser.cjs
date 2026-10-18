'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.BUDGET_URL||'http://127.0.0.1:8087/ai-agent-use-cases/',observe=!!process.env.BUDGET_OBSERVE;
const report=[],label=observe?'before':'after';
const save=()=>fs.writeFileSync(`qa-artifacts/loading-${label}.json`,JSON.stringify(report,null,2));
async function audit(page,state){const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.equal(r.violations.length,0,JSON.stringify(r.violations));return {state,violations:r.violations};}
const hung=route=>new Promise(()=>{});
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 for(const [engine,type] of observe?[['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]]){
  const browser=await type.launch();
  for(const [size,width,height] of engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   // Only one actual source never responds: the other 336 complete normally.
   await page.addInitScript(()=>performance.setResourceTimingBufferSize(2000));
   await page.route('**/cases/001-travel-checkout.md',hung);
   await page.goto(origin+'?q=旅遊&scenario=生活&tool=Grok%20Bot');
   await page.waitForFunction(()=>performance.getEntriesByType('resource').filter(r=>/\/(cases|evidence)\/.*\.md$|\/sources\/pending\.md$/.test(r.name)).length>=336,null,{timeout:30000});
   assert.equal(await page.evaluate(()=>discoveryReady),false);
   const row={engine,size,waiting:true};report.push(row);save();
   await page.screenshot({path:`qa-artifacts/loading-home-${label}-${engine}-${size}.png`});
   await page.locator('#discover').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
   await page.screenshot({path:`qa-artifacts/loading-${label}-${engine}-${size}.png`});
   if(observe){await context.close();continue;}
   assert.equal(await page.locator('#source-progress').getAttribute('max'),'337');
   assert.equal(await page.locator('#source-progress').getAttribute('value'),'336');
   row.progress=await page.locator('#loading-summary').innerText();
   // Editing a shared search before completion must preserve its unedited facets.
   await page.locator('#query').fill('郵件');
   assert.equal(new URL(page.url()).searchParams.get('scenario'),'生活');
   assert.equal(new URL(page.url()).searchParams.get('tool'),'Grok Bot');
   assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
   assert.match(await page.locator('#results-count').innerText(),/正在讀取案例/);
   await page.locator('#query').fill('旅遊');
   row.audits=[await audit(page,'waiting')];
   assert(await page.locator('#draw-status').evaluate(e=>!e.closest('[aria-busy=true]')));
   await page.locator('#use-loaded').focus();await page.keyboard.press('Enter');
   await page.waitForFunction(()=>discoveryReady);
   assert(await page.locator('#loading-progress').isHidden());assert(await page.locator('#partial-load').isVisible());
   assert.equal(await page.locator('#results-count').evaluate(e=>e===document.activeElement),true);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const focusBounds=await page.locator('#results-count').boundingBox();row.focusBounds=focusBounds;save();assert(focusBounds.y>=0&&focusBounds.y+focusBounds.height<=height,JSON.stringify({size,height,focusBounds}));
   assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
   row.partial=await page.evaluate(()=>({entries:entries.length,failed:[...failedPaths]}));assert.equal(row.partial.entries,338);assert.deepEqual(row.partial.failed,['cases/001-travel-checkout.md']);
   await page.locator('#partial-load').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
   await page.screenshot({path:`qa-artifacts/loading-partial-${engine}-${size}.png`});
   await page.unroute('**/cases/001-travel-checkout.md');let requests=0;page.on('request',r=>{if(r.url().endsWith('.md'))requests++;});
   await page.locator('#retry-failed').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>!recoveringSources);
   assert.equal(requests,1);assert.equal(await page.evaluate(()=>entries.length),339);assert(await page.locator('#partial-load').isHidden());
   row.recovered=339;row.retryRequests=requests;row.audits.push(await audit(page,'recovered'));assert.deepEqual(errors,[]);row.errors=errors;save();await context.close();
  }
  if(!observe){
   // Every request hangs: the whole 20s budget must cap queue waves, including copy time.
   const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();let requested=0;
   await page.route('**/*.md',r=>{requested++;return hung(r);});
   const start=Date.now();await page.goto(origin);await page.locator('#error').waitFor({state:'visible',timeout:26000});const elapsed=Date.now()-start;
   assert(elapsed>=19000&&elapsed<25000,'whole initial load finishes around its 20s deadline');assert(requested<=32,'deadline stops queued requests after at most two concurrency waves');
   assert(await page.locator('#loading-progress').isHidden());assert(await page.locator('#guide-options').evaluate(e=>e.disabled));assert(await page.locator('#guide-options button').first().isDisabled());
   const row={engine,mode:'whole budget',elapsedMs:elapsed,requested};report.push(row);save();
   await page.unroute('**/*.md');await page.locator('#retry').click();await page.waitForFunction(()=>discoveryReady,null,{timeout:30000});assert.equal(await page.evaluate(()=>entries.length),339);row.retryRecovered=339;save();await context.close();
   // A missing requested case waits only for its file timeout and opens after recovery.
   const direct=await browser.newContext(),p=await direct.newPage();await p.route('**/cases/001-travel-checkout.md',hung);
   const started=Date.now();await p.goto(origin+'?case=UC-001');await p.waitForFunction(()=>discoveryReady,null,{timeout:18000});
   assert(await p.locator('#partial-load').isVisible());assert.match(await p.locator('#partial-message').innerText(),/分享的案例/);assert(await p.locator('#detail').evaluate(e=>!e.open));
   await p.unroute('**/cases/001-travel-checkout.md');await p.locator('#retry-failed').click();await p.locator('#detail[open]').waitFor();assert.equal(await p.locator('#detail-toolbar-id').innerText(),'UC-001');
   report.push({engine,mode:'missing direct link',elapsedMs:Date.now()-started,recovered:'UC-001'});save();await direct.close();
  }
  if(!observe){
   // Index hangs are recoverable; display-copy hangs fall back to source text.
   for(const [path,expected] of [['catalog.json','error'],['assets/copy.json','ready']]){
    const context=await browser.newContext(),page=await context.newPage();await page.route('**/'+path,hung);
    const start=Date.now();await page.goto(origin);
    if(expected==='error')await page.locator('#error').waitFor({state:'visible',timeout:11000});
    else await page.waitForFunction(()=>discoveryReady,null,{timeout:15000});
    assert(await page.locator('#loading-progress').isHidden());
    const row={engine,mode:path+' stalled',elapsedMs:Date.now()-start,expected};report.push(row);save();
    await page.unroute('**/'+path);
    if(expected==='error'){await page.locator('#query').fill('旅遊');assert.equal(await page.locator('#results-count').innerText(),'載入未完成');await page.locator('#retry').click();await page.waitForFunction(()=>discoveryReady,null,{timeout:30000});}
    assert.equal(await page.evaluate(()=>entries.length),339);await context.close();
   }
  }
  await browser.close();
 }
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
