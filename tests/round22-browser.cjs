'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {AxeBuilder}=require('@axe-core/playwright');
const observe=process.env.OBSERVE==='1';
const base=process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/before';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch();const report=[];
for(const width of [1440,390]){const page=await browser.newPage({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'});const row={width};report.push(row);await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});await page.screenshot({path:out+'/home-'+width+'.png'});
await page.locator('.hero-search-link').click();await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(e=>e.open=true);await page.locator('#scenario').selectOption('生活');row.results=await page.locator('#results .card').count();await page.screenshot({path:out+'/search-'+width+'.png'});
await page.locator('#results .card .card-bottom button').first().click();await page.locator('#detail[open]').waitFor();await page.screenshot({path:out+'/detail-'+width+'.png'});row.detailText=(await page.locator('#detail-body').innerText()).slice(0,2600);
const section=page.locator('.reader-search');row.searchPassage=await section.innerText();
await section.scrollIntoViewIfNeeded();await page.screenshot({path:out+'/passage-'+width+'.png'});
row.target=await page.locator('.reader-search-jump').first().getAttribute('aria-controls');
if(!observe){assert.match(row.searchPassage,/可複製提示詞（本庫原創設計）/u);assert(!row.searchPassage.includes('原文 · 頁首資料'));
const jump=page.locator('.reader-search-jump').first();await jump.focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),row.target);
assert.match(await page.locator(':focus').innerText(),/可複製提示詞（本庫原創設計）/u);
assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
row.axe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(row.axe,[]);
}
await page.keyboard.press('Escape');row.returnFocus=await page.evaluate(()=>document.activeElement.outerHTML);row.missing=await page.evaluate(()=>failedPaths);assert.deepEqual(row.missing,[]);
if(!observe){assert.match(row.returnFocus,/閱讀 UC-001/);
await page.locator('#query').fill('no-such-task-round22');await page.locator('#empty').waitFor({state:'visible'});await page.locator('#edit-query').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
await page.goto(base+'?q=旅遊&scenario=生活&case=UC-001#explore');await page.locator('#detail[open]').waitFor();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});await page.locator('#detail[open]').waitFor();assert.match(await page.locator('.reader-search').innerText(),/可複製提示詞（本庫原創設計）/u);
await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();row.source=await page.locator('.markdown a[href^="https:"]').first().getAttribute('href');
if(width===1440){const pending=page.waitForEvent('popup');await page.locator('.markdown a[href^="https:"]').first().click();const popup=await pending;await popup.waitForLoadState('domcontentloaded').catch(()=>{});row.openedSource=popup.url();await popup.close();}
await page.keyboard.press('Escape');assert.equal(await page.locator('#scenario').inputValue(),'生活');
}
await page.close();}
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
