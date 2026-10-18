'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();
 const origin='https://richardhan.github.io/ai-agent-use-cases/';
 let ready=false,lastError;
 for(let attempt=0;attempt<18;attempt++){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();
  try{
   const response=await page.goto(origin+'?deploy-check='+Date.now(),{waitUntil:'networkidle',timeout:30000});
   assert(response.ok(),'Pages response '+response.status());
   await page.locator('#drawn-case .card').waitFor({timeout:10000});
   await page.locator('#guide-options [data-scenario="省錢"]').click();
   assert.equal(await page.locator('#scenario').inputValue(),'省錢');
   await page.locator('#active-filters [data-remove-filter="scenario"]').waitFor({timeout:1000});
   assert.match(await page.locator('#active-filters [data-remove-filter="scenario"]').innerText(),/省錢/);
   await page.locator('#drawn-case .card-bottom button').click();
   await page.locator('#detail[open]').waitFor();
   await page.locator('#close-detail').click();
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:'qa-artifacts/live-desktop.png'});
   console.log('PASS LIVE: Pages HTTPS, real generated catalog, scenario discovery and detail');
   ready=true;
  }catch(e){lastError=e;console.log('Waiting for Pages update, attempt '+(attempt+1));}
  await context.close();
  if(ready)break;
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 assert(ready,String(lastError));
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.goto(origin+'?scenario=生活&case=UC-001',{waitUntil:'networkidle'});
 await page.locator('#detail[open]').waitFor();
 await page.reload({waitUntil:'networkidle'});
 await page.locator('#detail[open]').waitFor();
 assert.match(await page.locator('#detail-title').innerText(),/交通和住宿/);
 await page.locator('#close-detail').click();
 await page.locator('#guide-options [data-scenario="創作"]').click();
 await page.screenshot({path:'qa-artifacts/live-mobile.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 console.log('PASS LIVE: mobile direct link, refresh, close, scenario selection and no horizontal overflow');
 await require('./search-recovery-browser.cjs')({browser,origin,prefix:'live-search',sizes:[['desktop',1440,1000],['mobile',390,844]]});
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
