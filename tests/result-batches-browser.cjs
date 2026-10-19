'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const base=process.env.BATCH_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.BATCH_OUTPUT||'qa-artifacts/batches-before';
fs.mkdirSync(out,{recursive:true});
(async()=>{const report=[];for(const width of [1440,390]){
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForFunction(()=>discoveryReady);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/home-${width}.png`});
 await page.locator('.hero-search-link').click();await page.screenshot({path:`${out}/results-${width}.png`});
 const row={width,entries:await page.evaluate(()=>entries.length),cards:await page.locator('#results .card').count(),pageHeight:await page.evaluate(()=>document.documentElement.scrollHeight)};
 await page.locator('#query').fill('旅遊');await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');row.travelResults=await page.locator('#results .card').count();
 const read=page.locator('#results .card .card-bottom button').first();await read.click();await page.locator('#detail[open]').waitFor();await page.screenshot({path:`${out}/detail-${width}.png`});
 await page.locator('.research-details summary').click();const link=page.locator('.markdown a[href^="https:"]').first();row.source=await link.getAttribute('href');const popup=context.waitForEvent('page');await link.click();const sourcePage=await popup;row.openedSource=sourcePage.url();await sourcePage.close();
 await page.keyboard.press('Escape');row.returnFocus=await read.evaluate(e=>e===document.activeElement);row.errors=errors;report.push(row);await browser.close();
}fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(report);})().catch(e=>{console.error(e);process.exit(1)});
