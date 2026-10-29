'use strict';
const {chromium,firefox,webkit}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/before';fs.mkdirSync(out,{recursive:true});
(async()=>{const report=[];
const configs=process.env.VERIFY_TASK==='1'?[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]]:[[chromium,1440],[chromium,390]];
for(const [engine,width] of configs){const browser=await engine.launch();const label=engine.name()+'-'+width;
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'}),page=await context.newPage();
 const row={engine:engine.name(),width,pageErrors:[]};report.push(row);page.on('pageerror',e=>row.pageErrors.push(e.message));
 await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
 console.log('LOADED '+label);row.total=await page.evaluate(()=>entries.length);await page.screenshot({path:out+'/home-'+label+'.png'});
 await page.locator('.hero-search-link').click();await page.locator('#filter-options').evaluate(e=>e.open=true);
 const task=page.locator('.chip[data-query="驗收"], .chip[data-kind="evidence"]');row.task=await task.innerText();await task.click();
 row.query=await page.locator('#query').inputValue();row.kind=await page.locator('#kind').inputValue();row.results=await page.evaluate(()=>currentFiltered.length);
 row.sample=await page.locator('#results .card h3').allTextContents();
 row.kinds=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.kind));
 if(process.env.VERIFY_TASK==='1'){assert.equal(row.kind,'evidence','experience shortcut must filter by collection status');assert.equal(row.query,'');assert(row.results>0&&row.results<row.total);assert(row.kinds.every(k=>k==='evidence'));assert.equal(await task.getAttribute('aria-pressed'),'true');}
 if(process.env.VERIFY_TASK==='1'){
   assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count','experience shortcut must focus the results');
   const bounds=await page.locator('#results-count').boundingBox();
   assert(bounds&&bounds.y>=0&&bounds.y<page.viewportSize().height,'experience shortcut must bring results into view');
 }
 await page.locator('#scenario-chips').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/task-'+label+'.png'});
 const initialId=await page.locator('#results .card').first().getAttribute('data-case-id');
 if(process.env.VERIFY_TASK==='1'){row.entryAxe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(row.entryAxe,[]);}
 await page.locator('#results .card .card-bottom button').first().click();await page.locator('#detail[open]').waitFor();
 row.detail=(await page.locator('#detail-body').innerText()).slice(0,1800);await page.screenshot({path:out+'/detail-'+label+'.png'});
 await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();row.source=await page.locator('.markdown a[href^="https:"]').first().getAttribute('href');
 const pending=page.waitForEvent('popup');await page.locator('.markdown a[href^="https:"]').first().click();const popup=await pending;await popup.waitForLoadState('domcontentloaded',{timeout:10000}).catch(()=>{row.sourceLoadTimedOut=true;});row.openedSource=popup.url().split('?')[0];await popup.close();
 await page.keyboard.press('Escape');row.returnFocus=await page.evaluate(()=>document.activeElement.outerHTML);
 if(process.env.VERIFY_TASK==='1'){
   assert(await page.locator('#results .card[data-case-id="'+initialId+'"] .card-bottom button').evaluate(el=>el===document.activeElement),'return must focus the exact reading button');
   await page.locator('#filter-options').evaluate(e=>e.open=true);await task.click();assert.equal(await page.locator('#kind').inputValue(),'');assert.equal(await task.getAttribute('aria-pressed'),'false');
   await page.locator('#query').fill('晨報');await page.locator('#scenario').selectOption('工作');await page.locator('#sort').selectOption('reviewed');await page.locator('#kind').selectOption('pending');
   await task.focus();await page.keyboard.press('Space');assert.equal(await page.locator('#kind').inputValue(),'evidence');assert.equal(await page.locator('#query').inputValue(),'晨報');assert.equal(await page.locator('#scenario').inputValue(),'工作');assert.equal(await page.locator('#sort').inputValue(),'reviewed');
   assert(await page.locator('#results .card[data-case-id="UC-008"]').count());
   const url=page.url();assert.equal(new URL(url).searchParams.get('kind'),'evidence');await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
   await page.locator('#filter-options').evaluate(e=>e.open=true);assert.equal(await task.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#query').inputValue(),'晨報');
   await page.locator('#active-filters button').filter({hasText:'收錄狀態'}).click();assert.equal(await task.getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#query').inputValue(),'晨報');await task.click();
   await page.locator('#clear-facets').click();assert.equal(await task.getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#query').inputValue(),'晨報');await page.locator('#scenario').selectOption('工作');await task.click();
   await page.locator('#kind').selectOption('case');assert.equal(await task.getAttribute('aria-pressed'),'false');await task.click();assert.equal(await task.getAttribute('aria-pressed'),'true');
   await page.locator('#query').fill('no-such-task-entry');await page.locator('#empty').waitFor({state:'visible'});assert.equal(await page.locator('#kind').inputValue(),'evidence');
   await task.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#kind').inputValue(),'');assert.equal(await page.locator('#query').inputValue(),'no-such-task-entry');assert.equal(await page.locator('#scenario').inputValue(),'工作');assert.equal(await page.locator('#sort').inputValue(),'reviewed');
   await page.locator('#reset').click();await page.locator('#kind').selectOption('evidence');assert.equal(await task.getAttribute('aria-pressed'),'true');await page.locator('#reset').click();assert.equal(await task.getAttribute('aria-pressed'),'false');
   assert(await task.evaluate(e=>e.getBoundingClientRect().height>=24));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   row.taskAxe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(row.taskAxe,[]);
 }
 await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(e=>e.open=true);await page.locator('#kind').selectOption('');await page.locator('#scenario').selectOption('生活');
 await page.locator('#results .card[data-case-id="UC-001"] .card-bottom button').click();await page.locator('#detail[open]').waitFor();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.locator('#detail[open]').waitFor();await page.keyboard.press('Escape');
 assert.equal(await page.locator('#scenario').inputValue(),'生活');
 await page.locator('#query').fill('no-such-task-entry');await page.locator('#empty').waitFor({state:'visible'});await page.locator('#edit-query').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
 row.axe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(row.pageErrors,[]);assert.deepEqual(row.axe,[]);
 console.log('PASS TASK '+label+' results='+row.results);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await context.close();await browser.close();
}
if(process.env.VERIFY_TASK==='1'){
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 let release;const gate=new Promise(resolve=>release=resolve);await page.route('**/catalog.json',async route=>{await gate;await route.continue();});
 await page.goto(base);await page.locator('#filter-options').evaluate(e=>e.open=true);await page.locator('#query').fill('晨報');await page.locator('.chip[data-kind="evidence"]').click();
 assert(await page.locator('.chip[data-kind="evidence"]').evaluate(el=>el===document.activeElement),'loading shortcut must retain focus');
 release();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
 assert(await page.locator('.chip[data-kind="evidence"]').evaluate(el=>el===document.activeElement),'loading completion must not steal focus');
 assert.equal(await page.locator('#kind').inputValue(),'evidence');assert.equal(await page.locator('#query').inputValue(),'晨報');assert.equal(await page.locator('.chip[data-kind="evidence"]').getAttribute('aria-pressed'),'true');assert(await page.locator('#results .card[data-case-id="UC-008"]').count());
 await context.close();const errorContext=await browser.newContext();const errorPage=await errorContext.newPage();await errorPage.route('**/catalog.json',route=>route.abort());await errorPage.goto(base);await errorPage.locator('#error').waitFor({state:'visible'});await errorPage.locator('#filter-options').evaluate(e=>e.open=true);await errorPage.locator('.chip[data-kind="evidence"]').click();await errorPage.unroute('**/catalog.json');await errorPage.locator('#retry').click();await errorPage.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await errorPage.locator('#kind').inputValue(),'evidence');assert.equal(await errorPage.locator('.chip[data-kind="evidence"]').getAttribute('aria-pressed'),'true');
 fs.writeFileSync(out+'/lifecycle.json',JSON.stringify({loadingIntentPreserved:true,catalogRetryPreserved:true}));await errorContext.close();await browser.close();
}
})().catch(e=>{console.error(e);process.exit(1)});
