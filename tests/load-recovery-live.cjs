'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const origin='https://richardhan.github.io/ai-agent-use-cases/';
const {skipIfSupersededPublishedUrl}=require('../scripts/published-check.cjs');
const {waitForPublishedAssets}=require('../scripts/published-assets.cjs');
if(process.env.LOAD_DEPLOYED==='1'&&skipIfSupersededPublishedUrl(origin)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
(async()=>{
 const records=[];
 if(process.env.LOAD_DEPLOYED==='1'){
  const result=await waitForPublishedAssets({base:origin,sha:process.env.GITHUB_SHA,files:['assets/app.js','assets/style.css','index.html'],isCurrent:()=>!skipIfSupersededPublishedUrl(origin),maxDuration:60*60*1000});
  if(result==='superseded'){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);return;}
 }
 const browser=await chromium.launch();
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height}});
  const page=await context.newPage();const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',request=>network.push({url:request.url(),failure:request.failure()}));
  page.on('response',response=>{if(response.status()>=400)network.push({url:response.url(),status:response.status()});});
  const served={};
  page.on('response',async response=>{for(const path of ['assets/app.js','assets/style.css'])if(new URL(response.url()).pathname.endsWith('/'+path))served[path]=await response.text();});
  const started=Date.now();
  await page.goto(origin);await page.waitForFunction(()=>document.querySelector('#results-count').textContent.includes('筆收錄'),{},{timeout:90000});
  const elapsedMs=Date.now()-started;
  const state=await page.evaluate(()=>({entries:entries.length,failed:failedPaths.length,failedPaths:[...failedPaths],recoveryUI:!!document.getElementById('partial-load')}));
  if(process.env.LOAD_DEPLOYED==='1'){
   assert.equal(state.recoveryUI,true);
   for(const path of ['assets/app.js','assets/style.css']){
    const actual=served[path];
    assert.equal(actual,fs.readFileSync(path,'utf8'),'published '+path+' matches checkout');
   }
  }
  const record={name,...state,elapsedMs,network,errors};records.push(record);
  fs.mkdirSync('qa-artifacts',{recursive:true});
  fs.writeFileSync('qa-artifacts/load-live.json',JSON.stringify(records,null,2));
  if(state.failed){await page.locator('#partial-load').scrollIntoViewIfNeeded();await page.screenshot({path:'qa-artifacts/live-incomplete-'+name+'.png'});}
  assert.equal(state.failed,0,'live corpus must load completely: '+JSON.stringify({failedPaths:state.failedPaths,network}));
  fs.mkdirSync('qa-artifacts',{recursive:true});
  await page.screenshot({path:'qa-artifacts/live-home-'+name+'.jpg',type:'jpeg',quality:70});
  console.log('VISUAL:live-home-'+name+':'+fs.readFileSync('qa-artifacts/live-home-'+name+'.jpg').toString('base64'));
  await page.locator('#query').fill('旅遊');
  if(!await page.locator('#tool').isVisible())await page.locator('#filter-summary').click();
  await page.locator('#tool').selectOption('Grok Bot');
  const ids=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId));
  assert(ids.length>0);
  await page.locator('#results .card h3 button').first().click();
  await page.locator('#detail[open]').waitFor();
  const id=await page.locator('#detail-toolbar-id').innerText();
  const popupPromise=page.waitForEvent('popup');
  await page.locator('.detail-source').click();const popup=await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  const sourceURL=popup.url();await popup.close();
  await page.locator('.research-details summary').click();
  assert((await page.locator('.research-details .markdown').innerText()).length>100);
  const original=await page.locator('.research-details .markdown a[href^="http"]').first().getAttribute('href');
  const sourcePage=await context.newPage();let originalStatus=null,originalError=null;
  try{originalStatus=(await sourcePage.goto(original,{waitUntil:'domcontentloaded',timeout:20000}))?.status();}catch(e){originalError=e.message;}
  await sourcePage.close();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#results .card h3 button').first().evaluate(n=>n===document.activeElement),true);
  await page.locator('#query').fill('不存在的任務zzzz');
  assert.equal(await page.locator('#empty').isVisible(),true);
  await page.locator('#query').fill('旅遊');
  assert.deepEqual(await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId)),ids);
  Object.assign(record,{matching:ids.length,opened:id,sourceURL,original,originalStatus,originalError});
  assert.deepEqual(errors,[]);
  await context.close();
 }
 await browser.close();
 fs.writeFileSync('qa-artifacts/load-live.json',JSON.stringify(records,null,2));
 console.log('LOAD_LIVE '+JSON.stringify(records));
})().catch(e=>{console.error(e);process.exit(1)});
