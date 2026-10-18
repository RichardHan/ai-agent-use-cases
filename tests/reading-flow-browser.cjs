'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.READING_URL;
const observe=!!process.env.READING_OBSERVE;
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const reports=[],browser=await chromium.launch();
 for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.locator('#results .card').first().waitFor();
  await page.screenshot({path:`qa-artifacts/reading-${observe?'before':'after'}-home-${size}.png`});
  await page.locator('#query').fill('旅遊');
  await require('./filter-controls.cjs').ensureFiltersVisible(page);
  await page.locator('#scenario').selectOption('生活');
  await page.locator('#tool').selectOption('Grok Bot');
  assert((await page.locator('#results .card').count())>0);
  await page.locator('#results .card h3 button').first().click();
  await page.locator('#detail[open]').waitFor();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  await page.locator('#query').fill('no-matching-case-123');assert(await page.locator('#empty').isVisible());
  for(const id of ['UC-001','UC-313','UC-340']){
   await page.goto(origin+'?case='+id,{waitUntil:'networkidle'});
   await page.locator('#detail[open]').waitFor();
   await page.screenshot({path:`qa-artifacts/reading-${observe?'before':'after'}-${id}-${size}.png`});
   reports.push({size,id,...await page.evaluate(()=>({purposeTop:Math.round(document.querySelector('.plain-overview').getBoundingClientRect().top),viewport:innerHeight,dialogTop:document.getElementById('detail').getBoundingClientRect().top,order:[...document.getElementById('detail-body').children].map(e=>e.className||e.tagName),overview:document.querySelector('.plain-overview').innerText}))});
   await page.locator('.research-details summary').click();
   assert((await page.locator('.markdown a').count())>0);
   const href=await page.locator('.markdown a').first().getAttribute('href');
   assert.match(href,/^https?:/);
   await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
  }
  await page.close();
 }
 fs.writeFileSync(`qa-artifacts/reading-${observe?'before':'after'}.json`,JSON.stringify(reports,null,2));
 console.log(JSON.stringify(reports,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
