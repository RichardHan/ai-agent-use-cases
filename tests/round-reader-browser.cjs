'use strict';
const {chromium}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/before';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch(),report=[];
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'}),page=await context.newPage();
  const row={width,errors:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
  await page.screenshot({path:`${out}/home-${width}.png`});
  await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(e=>e.open=true);
  await page.locator('#scenario').selectOption('生活');row.count=await page.locator('#results .card').count();
  await page.locator('#search-submit').click();await page.screenshot({path:`${out}/results-${width}.png`});
  await page.locator('#results .card .card-bottom button').first().click();await page.locator('#detail[open]').waitFor();
  row.id=await page.locator('#detail-toolbar-id').innerText();
  await page.screenshot({path:`${out}/detail-${width}.png`});
  await page.locator('.research-details summary').click();
  row.headings=await page.locator('.markdown h2,.markdown h3').allTextContents();
  await page.locator('.markdown h2').last().scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/long-${width}.png`});
  const source=page.locator('.markdown a[href^="https:"]').first();row.source=await source.getAttribute('href');
  const popupPromise=page.waitForEvent('popup');await source.click();const popup=await popupPromise;
  await popup.waitForLoadState('domcontentloaded',{timeout:30000}).catch(()=>{});row.sourceOpened=popup.url();await popup.close();
  await page.keyboard.press('Escape');await page.locator('#detail').waitFor({state:'hidden'});
  row.returnFocus=await page.evaluate(()=>document.activeElement.outerHTML);
  await page.locator('#query').fill('no-results-round-qa');await page.locator('#empty').waitFor({state:'visible'});
  row.axe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(x=>x.id);
  await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(e=>e===document.activeElement));
  await page.goto(base+'?case='+row.id);await page.locator('#detail[open]').waitFor();await page.reload();await page.locator('#detail[open]').waitFor();
  row.directReload=true;assert.deepEqual(row.errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
