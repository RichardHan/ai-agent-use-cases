'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch();const out=process.env.QA_OUT||'qa-artifacts';fs.mkdirSync(out,{recursive:true});const report=[];
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();
  await page.goto(process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof discoveryReady!=='undefined'&&discoveryReady,{timeout:120000});
  await page.screenshot({path:`${out}/home-${width}.png`});
  if(!await page.locator('#filter-options').evaluate(n=>n.open))await page.locator('#filter-summary').click();
  for(const q of ['每日','收件匣','比價','排程']){
   const button=page.locator(`.chip[data-query="${q}"]`);await button.click();
   const state=await page.evaluate(()=>({query:document.getElementById('query').value,count:currentFiltered.length,total:entries.length,first:currentFiltered.slice(0,5).map(x=>({id:x.id,title:x.title})),focus:document.activeElement.outerHTML,results:document.getElementById('results-count').getBoundingClientRect().toJSON(),scrollY}));
   report.push({width,q,...state});await page.screenshot({path:`${out}/task-${q}-${width}.png`});
  }
  await page.locator('#query').fill('旅遊');await page.locator('#scenario').selectOption('生活');await page.locator('#search-submit').click();
  await page.locator('#results .card .card-bottom button').first().click();await page.locator('#detail[open]').waitFor();
  await page.screenshot({path:`${out}/detail-${width}.png`});
  report.push({width,detail:await page.locator('#detail-title').innerText(),sources:await page.locator('#detail-body a[href^="https://"]').evaluateAll(nodes=>nodes.slice(0,3).map(n=>({text:n.textContent,href:n.href}))) });
  await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),'旅遊');
  await context.close();
 }
 fs.writeFileSync(out+'/baseline.json',JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
