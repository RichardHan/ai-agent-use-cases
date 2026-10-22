'use strict';
const {chromium}=require('playwright'),fs=require('node:fs');
const base=process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out='qa-artifacts/before';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch();try{const report=[];
for(const width of [1440,390]){const page=await browser.newPage({viewport:{width,height:900}}),row={width,errors:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});row.total=await page.evaluate(()=>entries.length);row.failed=await page.evaluate(()=>failedPaths);await page.screenshot({path:`${out}/home-${width}.png`});
await page.locator('[data-search-entry]').first().click();await page.locator('#filter-options').evaluate(n=>n.open=true);row.tasks=[];
for(const q of ['每日','收件匣','比價','排程']){await page.locator(`.chip[data-query="${q}"]`).click();row.tasks.push(await page.evaluate(()=>({query:document.getElementById('query').value,count:currentFiltered.length,first:currentFiltered.slice(0,8).map(e=>({id:e.id,title:e.title,purpose:e.purpose}))})));}
await page.locator('#query').fill('旅遊');await page.locator('#scenario').selectOption('生活');await page.locator('#search-submit').click();row.filtered=await page.locator('#results-count').innerText();await page.screenshot({path:`${out}/results-${width}.png`});
await page.locator('#results .card[data-case-id="UC-001"] .card-bottom button').click();await page.locator('#detail[open]').waitFor();await page.screenshot({path:`${out}/detail-${width}.png`});row.detail=(await page.locator('#detail-body').innerText()).slice(0,14000);
await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();row.source=await page.locator('.markdown a[href^="https:"]').first().getAttribute('href');if(width===1440){const pending=page.waitForEvent('popup');await page.locator('.markdown a[href^="https:"]').first().click();const popup=await pending;await popup.waitForLoadState('domcontentloaded',{timeout:15000}).catch(()=>{});row.sourceOpened=popup.url().split('?')[0];await popup.close();}
await page.keyboard.press('Escape');row.returnFocus=await page.evaluate(()=>document.activeElement.outerHTML);await page.locator('#query').fill('no-match-round22');row.empty=await page.locator('#empty').isVisible();await page.screenshot({path:`${out}/empty-${width}.png`});await page.close();fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
