'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const origin=process.env.READER_BASELINE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
(async()=>{
 const browser=await chromium.launch();
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const report=[];
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.locator('#results .card').first().waitFor();
  await page.screenshot({path:`qa-artifacts/reader-before-home-${name}.png`});
  await page.locator('#query').fill('旅遊');
  await page.locator('#tool').selectOption('Grok Bot');
  await page.locator('#category').selectOption('旅遊／消費研究');
  const results=await page.locator('#results .card').count();
  await page.locator('#results .card .card-bottom button').first().click();
  await page.locator('#detail[open]').waitFor();
  await page.locator('#close-detail').click();
  const preserved=await page.locator('#query').inputValue();
  await page.locator('#query').fill('no-matching-case-123');
  const empty=await page.locator('#empty').isVisible();
  await page.locator('#empty-reset').click();
  // A long, updated case and a newer case without editorial overview copy.
  for(const id of ['UC-005','UC-313']){
   await page.goto(origin+'?case='+id,{waitUntil:'networkidle'});
   await page.locator('#detail[open]').waitFor();
   await page.screenshot({path:`qa-artifacts/reader-before-${id}-${name}.png`});
   const collapsed=!(await page.locator('.research-details').getAttribute('open')!==null);
   const generic=await page.locator('.plain-overview').innerText();
   await page.locator('.research-details summary').click();
   const headings=await page.locator('.research-details .markdown h2').allTextContents();
   const links=await page.locator('.research-details .markdown a').count();
   const popupPromise=page.waitForEvent('popup');
   await page.locator('.research-details .markdown a').first().click();
   const popup=await popupPromise;
   await popup.waitForLoadState('domcontentloaded').catch(()=>{});
   const sourceURL=popup.url();
   await popup.close();
   report.push({viewport:name,id,results,searchPreserved:preserved==='旅遊',empty,collapsed,generic,headingCount:headings.length,headings:headings.slice(0,8),links,sourceURL,readerNav:await page.locator('.reader-nav').count()});
  }
  await page.close();
 }
 fs.writeFileSync('qa-artifacts/reader-baseline.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
