'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.RELATED_URL||'http://127.0.0.1:8088/ai-agent-use-cases/';
(async()=>{
 const browser=await chromium.launch();fs.mkdirSync('qa-artifacts',{recursive:true});
 const report=[];
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.locator('#results .card').first().waitFor();
  await page.screenshot({path:`qa-artifacts/related-before-home-${name}.png`});
  await page.locator('#query').fill('旅遊');
  if(!await page.locator('#tool').isVisible())await page.locator('#filter-summary').click();
  await page.locator('#tool').selectOption('Grok Bot');
  const ids=await page.locator('#results .card').evaluateAll(es=>es.map(e=>e.dataset.caseId));assert(ids.length);
  await page.locator('#results .card .card-bottom button').first().click();
  await page.locator('#detail[open]').waitFor();
  await page.screenshot({path:`qa-artifacts/related-before-detail-${name}.png`});
  const related=await page.locator('.related-cases').count();
  const nextTitle=await page.locator('#nav-next-case').getAttribute('title');
  await page.locator('.research-details summary').click();
  const source=await page.locator('.research-details .markdown a[href^="https:"]').first().getAttribute('href');
  const external=await page.context().newPage();let sourceStatus=null,sourceError=null;
  try{sourceStatus=(await external.goto(source,{waitUntil:'domcontentloaded',timeout:15000}))?.status();}catch(e){sourceError=e.message;}
  await external.close();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert.deepEqual(await page.locator('#results .card').evaluateAll(es=>es.map(e=>e.dataset.caseId)),ids);
  await page.locator('#query').fill('zzzz-no-such-task');assert(await page.locator('#empty').isVisible());
  report.push({name,results:ids.length,related,nextTitle,source,sourceStatus,sourceError});
  await page.goto(origin+'?case=UC-005',{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
  report.push({name,direct:'UC-005',related:await page.locator('.related-cases').count(),nextTitle:await page.locator('#nav-next-case').getAttribute('title')});
  await page.close();
 }
 await browser.close();fs.writeFileSync('qa-artifacts/related-baseline.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
