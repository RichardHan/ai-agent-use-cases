'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const base=process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/before';fs.mkdirSync(out,{recursive:true});
(async()=>{const report=[];for(const width of [1440,390]){
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const row={width,errors:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});row.total=await page.evaluate(()=>entries.length);await page.screenshot({path:`${out}/home-${width}.png`});
await page.locator('[data-search-entry]').first().click();await page.locator('#query').fill('旅遊');if(!await page.locator('#filter-options').evaluate(n=>n.open))await page.locator('#filter-summary').click();await page.locator('#scenario').selectOption('生活');await page.locator('#query').press('Enter');await page.screenshot({path:`${out}/results-${width}.png`});row.count=await page.evaluate(()=>currentFiltered.length);
const trigger=page.locator('#results .card .card-bottom button').first();await trigger.click();await page.locator('#detail[open]').waitFor();row.direct=page.url();await page.screenshot({path:`${out}/detail-${width}.png`});
row.headings=await page.locator('#detail-body h2').allTextContents();row.buttons=await page.locator('#detail-body button').allTextContents();
await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();row.source=await page.locator('.markdown a[href^="https:"]').first().getAttribute('href');const response=await page.request.get(row.source,{timeout:15000}).catch(e=>null);row.sourceStatus=response?.status();await page.keyboard.press('Escape');assert(await trigger.evaluate(n=>n===document.activeElement));
await page.goto(base+'?case=UC-005');await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.locator('#detail[open]').waitFor();
await page.locator('.reader-jump').filter({hasText:'限制與權限'}).click();
const reading=()=>page.evaluate(()=>({id:currentDetailItem.id,scroll:document.getElementById('detail').scrollTop,open:document.querySelector('.research-details').open,focus:document.activeElement.id}));
row.readingBefore=await reading();await page.screenshot({path:`${out}/reading-${width}.png`});await page.locator('#nav-next-case').click();await page.goBack();await page.waitForFunction(()=>currentDetailItem.id==='UC-005');row.readingReturned=await reading();await page.screenshot({path:`${out}/returned-${width}.png`});
await page.goto(row.direct);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.locator('#detail[open]').waitFor();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.keyboard.press('Escape');
await page.locator('#query').fill('zzzz-no-results');assert(await page.locator('#empty').isVisible());await page.locator('#empty-reset').click();row.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
