'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.CATEGORY_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.CATEGORY_OUTPUT||'qa-artifacts/category';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch();const report=[];
try{for(const width of [1440,390]){
const page=await browser.newPage({viewport:{width,height:width===1440?1000:844}}),row={width,errors:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
await page.screenshot({path:`${out}/home-${width}.png`});
await page.locator('[data-search-entry]').first().click();await page.locator('#query').fill('旅遊');
await page.locator('#filter-options').evaluate(e=>e.open=true);await page.locator('#scenario').selectOption('生活');
row.categories=await page.locator('#category option').count();row.tools=await page.locator('#tool option').count();row.available=await page.locator('#category optgroup').first().locator('option').count();
await page.locator('#category').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/filters-${width}.png`});
await page.locator('#category').selectOption('旅遊／消費研究');
const trigger=page.locator('#results .card-bottom button').first();await trigger.click();await page.locator('.research-details').evaluate(e=>e.open=true);
row.source=await page.locator('.research-details .markdown a').first().getAttribute('href');await page.screenshot({path:`${out}/detail-${width}.png`});
await page.goBack();assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#category').inputValue(),'旅遊／消費研究');
await page.locator('#query').fill('no-such-case-987');assert(await page.locator('#empty').isVisible());row.failed=await page.evaluate(()=>failedPaths);row.entries=await page.evaluate(()=>entries.length);await page.close();
}}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
