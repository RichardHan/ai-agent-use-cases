'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const base=process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/before';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch();const report=[];
for(const width of [1440,390]){const page=await browser.newPage({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'});const row={width};report.push(row);await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});await page.screenshot({path:out+'/home-'+width+'.png'});
await page.locator('.hero-search-link').click();await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(e=>e.open=true);await page.locator('#scenario').selectOption('生活');row.results=await page.locator('#results .card').count();await page.screenshot({path:out+'/search-'+width+'.png'});
await page.locator('#results .card .card-bottom button').first().click();await page.locator('#detail[open]').waitFor();await page.screenshot({path:out+'/detail-'+width+'.png'});row.detailText=(await page.locator('#detail-body').innerText()).slice(0,2600);await page.keyboard.press('Escape');row.returnFocus=await page.evaluate(()=>document.activeElement.outerHTML);row.missing=await page.evaluate(()=>failedPaths);await page.close();}
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
