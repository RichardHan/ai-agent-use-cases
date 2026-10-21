'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/before';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch();const report=[];
for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'}),page=await context.newPage();
 const row={width,pageErrors:[]};report.push(row);page.on('pageerror',e=>row.pageErrors.push(e.message));
 await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
 row.total=await page.evaluate(()=>entries.length);await page.screenshot({path:out+'/home-'+width+'.png'});
 await page.locator('.hero-search-link').click();await page.locator('#filter-options').evaluate(e=>e.open=true);
 const task=page.locator('[data-query="驗收"], [data-kind="evidence"]');row.task=await task.innerText();await task.click();
 row.query=await page.locator('#query').inputValue();row.kind=await page.locator('#kind').inputValue();row.results=await page.evaluate(()=>currentFiltered.length);
 row.sample=await page.locator('#results .card h3').allTextContents();
 row.kinds=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.kind));
 if(process.env.VERIFY_TASK==='1'){assert.equal(row.kind,'evidence','experience shortcut must filter by collection status');assert.equal(row.query,'');assert(row.results>0&&row.results<row.total);assert(row.kinds.every(k=>k==='evidence'));assert.equal(await task.getAttribute('aria-pressed'),'true');}
 await page.locator('#scenario-chips').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/task-'+width+'.png'});
 await page.locator('#results .card .card-bottom button').first().click();await page.locator('#detail[open]').waitFor();
 row.detail=(await page.locator('#detail-body').innerText()).slice(0,1800);await page.screenshot({path:out+'/detail-'+width+'.png'});
 await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();row.source=await page.locator('.markdown a[href^="https:"]').first().getAttribute('href');
 const pending=page.waitForEvent('popup');await page.locator('.markdown a[href^="https:"]').first().click();const popup=await pending;await popup.waitForLoadState('domcontentloaded').catch(()=>{});row.openedSource=popup.url();await popup.close();
 await page.keyboard.press('Escape');row.returnFocus=await page.evaluate(()=>document.activeElement.outerHTML);
 if(process.env.VERIFY_TASK==='1'){
   await page.locator('#filter-options').evaluate(e=>e.open=true);await task.click();assert.equal(await page.locator('#kind').inputValue(),'');assert.equal(await task.getAttribute('aria-pressed'),'false');
   await page.locator('#query').fill('晨報');await page.locator('#scenario').selectOption('工作');await page.locator('#sort').selectOption('reviewed');await page.locator('#kind').selectOption('pending');
   await task.focus();await page.keyboard.press('Space');assert.equal(await page.locator('#kind').inputValue(),'evidence');assert.equal(await page.locator('#query').inputValue(),'晨報');assert.equal(await page.locator('#scenario').inputValue(),'工作');assert.equal(await page.locator('#sort').inputValue(),'reviewed');
   assert(await page.locator('#results .card[data-case-id="UC-008"]').count());
   const url=page.url();assert.equal(new URL(url).searchParams.get('kind'),'evidence');await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
   await page.locator('#filter-options').evaluate(e=>e.open=true);assert.equal(await task.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#query').inputValue(),'晨報');
   await page.locator('#kind').selectOption('case');assert.equal(await task.getAttribute('aria-pressed'),'false');await task.click();assert.equal(await task.getAttribute('aria-pressed'),'true');
   await page.locator('#query').fill('no-such-task-entry');await page.locator('#empty').waitFor({state:'visible'});assert.equal(await page.locator('#kind').inputValue(),'evidence');
   await task.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#kind').inputValue(),'');assert.equal(await page.locator('#query').inputValue(),'no-such-task-entry');assert.equal(await page.locator('#scenario').inputValue(),'工作');assert.equal(await page.locator('#sort').inputValue(),'reviewed');
   await page.locator('#reset').click();await page.locator('#kind').selectOption('evidence');assert.equal(await task.getAttribute('aria-pressed'),'true');await page.locator('#reset').click();assert.equal(await task.getAttribute('aria-pressed'),'false');
   assert(await task.evaluate(e=>e.getBoundingClientRect().height>=44));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   row.taskAxe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(row.taskAxe,[]);
 }
 await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(e=>e.open=true);await page.locator('#kind').selectOption('');await page.locator('#scenario').selectOption('生活');
 await page.locator('#results .card[data-case-id="UC-001"] .card-bottom button').click();await page.locator('#detail[open]').waitFor();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.locator('#detail[open]').waitFor();await page.keyboard.press('Escape');
 assert.equal(await page.locator('#scenario').inputValue(),'生活');
 await page.locator('#query').fill('no-such-task-entry');await page.locator('#empty').waitFor({state:'visible'});await page.locator('#edit-query').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
 row.axe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(row.pageErrors,[]);assert.deepEqual(row.axe,[]);
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await context.close();
}await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
