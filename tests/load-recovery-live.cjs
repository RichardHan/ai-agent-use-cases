'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const origin='https://richardhan.github.io/ai-agent-use-cases/';
(async()=>{
 const browser=await chromium.launch();
 const records=[];
 if(process.env.LOAD_DEPLOYED==='1'){
  const deadline=Date.now()+300000;
  while(true){
   const text=await (await fetch(origin+'assets/app.js?deploy-check='+Date.now())).text();
   if(text===fs.readFileSync('assets/app.js','utf8'))break;
   if(Date.now()>deadline)throw Error('Deployment did not match within five minutes');
   await new Promise(resolve=>setTimeout(resolve,5000));
  }
 }
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height}});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const served={};
  page.on('response',async response=>{for(const path of ['assets/app.js','assets/style.css'])if(new URL(response.url()).pathname.endsWith('/'+path))served[path]=await response.text();});
  const started=Date.now();
  await page.goto(origin);await page.waitForFunction(()=>document.querySelector('#results-count').textContent.includes('筆收錄'),{},{timeout:90000});
  const elapsedMs=Date.now()-started;
  const state=await page.evaluate(()=>({entries:entries.length,failed:failedPaths.length,recoveryUI:!!document.getElementById('partial-load')}));
  if(process.env.LOAD_DEPLOYED==='1'){
   assert.equal(state.recoveryUI,true);
   for(const path of ['assets/app.js','assets/style.css']){
    const actual=served[path];
    assert.equal(actual,fs.readFileSync(path,'utf8'),'published '+path+' matches checkout');
   }
  }
  assert.equal(state.failed,0,'live corpus must load completely');
  fs.mkdirSync('qa-artifacts',{recursive:true});
  await page.screenshot({path:'qa-artifacts/live-home-'+name+'.jpg',type:'jpeg',quality:70});
  console.log('VISUAL:live-home-'+name+':'+fs.readFileSync('qa-artifacts/live-home-'+name+'.jpg').toString('base64'));
  await page.locator('#query').fill('旅遊');
  if(!await page.locator('#tool').isVisible())await page.locator('#filter-summary').click();
  await page.locator('#tool').selectOption({label:'Grok Bot'});
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
  records.push({name,...state,elapsedMs,matching:ids.length,opened:id,sourceURL,original,originalStatus,originalError,errors});
  assert.deepEqual(errors,[]);
  await context.close();
 }
 await browser.close();
 fs.writeFileSync('qa-artifacts/load-live.json',JSON.stringify(records,null,2));
 console.log('LOAD_LIVE '+JSON.stringify(records));
})().catch(e=>{console.error(e);process.exit(1)});
