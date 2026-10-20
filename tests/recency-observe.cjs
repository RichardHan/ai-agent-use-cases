'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {ensureFiltersVisible}=require('./filter-controls.cjs');
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const report={errors:[],responses:[]};page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)report.responses.push({url:r.url(),status:r.status()});});
 try{
  await page.goto('https://richardhan.github.io/ai-agent-use-cases/');
  await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
  report.corpus=await page.evaluate(()=>({entries:entries.length,failedPaths,first:entries.slice(0,6).map(e=>({id:e.id,date:e.date})),latest:[...entries].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6).map(e=>({id:e.id,date:e.date})),sortControls:[...document.querySelectorAll('select')].map(e=>({id:e.id,text:e.textContent}))}));
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
   await page.setViewportSize({width,height});await page.locator('#reset').click();
   await page.screenshot({path:`qa-artifacts/before-home-${name}.png`});
   await page.locator('#query').fill('旅遊');await ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');
   assert(await page.locator('#results .card').count()>0);
   await page.locator('#results-count').scrollIntoViewIfNeeded();await page.screenshot({path:`qa-artifacts/before-results-${name}.png`});
   const read=page.locator('#results .card .card-bottom button').first();await read.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();
   report.sources=await page.locator('#detail-body a[href^="https:"]').evaluateAll(nodes=>nodes.map(n=>n.href).slice(0,6));
   await page.screenshot({path:`qa-artifacts/before-detail-${name}.png`});await page.keyboard.press('Escape');assert(await read.evaluate(e=>e===document.activeElement));
   await page.locator('#query').fill('no-such-case-98182');assert(await page.locator('#empty').isVisible());await page.locator('#empty-reset').click();
  }
  await page.goto('https://richardhan.github.io/ai-agent-use-cases/?case=UC-313');await page.locator('#detail[open]').waitFor({timeout:90000});
  await page.reload();await page.locator('#detail[open]').waitFor({timeout:90000});
  const source=page.locator('.reader-report-content a').first();const popupPromise=page.waitForEvent('popup');await source.click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');report.sourceURL=popup.url();await popup.close();
  report.journeys=['homepage desktop/mobile','search + scenario + tool','detail + keyboard return','empty + reset','direct link + reload + source popup'];
 }finally{fs.writeFileSync('qa-artifacts/observation.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
