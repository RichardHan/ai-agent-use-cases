'use strict';
const {webkit,chromium,firefox}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.RETURN_URL||'http://127.0.0.1:8087/ai-agent-use-cases/';
const published=!!process.env.RETURN_NATIVE;
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});const reports=[];
 if(published){
  for(let attempt=0;attempt<30;attempt++){
   const response=await fetch(origin+'assets/app.js?return-qa='+Date.now(),{cache:'no-store'});
   if(response.ok&&await response.text()===fs.readFileSync('assets/app.js','utf8'))break;
   if(attempt===29)throw Error('Published return asset does not match checkout');
   await new Promise(resolve=>setTimeout(resolve,5000));
  }
 }
 for(const [engine,launch] of [['webkit',webkit],['chromium',chromium],['firefox',firefox]]){
  const browser=await launch.launch();
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const search=origin+'?q=旅遊&tool=Grok%20Bot#explore';
  await page.goto(search,{waitUntil:'networkidle'});
  if(published)assert.equal(await (await page.request.get(origin+'assets/app.js')).text(),fs.readFileSync('assets/app.js','utf8'));
  const trigger=page.locator('#results .card .card-bottom button').first();await trigger.waitFor();
  const ids=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId));
  for(let iteration=1;iteration<=10;iteration++){
   await trigger.click();await page.locator('#detail[open]').waitFor();
   await page.locator('.reader-jump').first().click();
   await page.goBack();
   // Real browser history, without injected scrolls or overridden clocks/rAF.
   // Inspect after the bounded guard has released its listeners.
   await page.waitForTimeout(500);
   await page.screenshot({path:`qa-artifacts/return-${published?'live':'after'}-${engine}-button.png`});
   const state=await page.evaluate(()=>({scrollY,hash:location.hash,tool:document.getElementById('tool').value,focus:document.activeElement.id||document.activeElement.className,card:document.activeElement.closest('.card')?.dataset.caseId,rect:document.querySelector('#results .card .card-bottom button').getBoundingClientRect().toJSON(),height:innerHeight,open:document.getElementById('detail').open,query:document.getElementById('query').value,entries:entries.length,failedPaths:[...failedPaths]}));
   reports.push({engine,iteration,native:true,surface:published?'published':'preview',errors:[...errors],...state});
   fs.writeFileSync(`qa-artifacts/return-${published?'live':'after'}.json`,JSON.stringify(reports,null,2));
   assert.deepEqual(errors,[]);assert.equal(state.open,false);assert.equal(state.query,'旅遊');assert.equal(state.tool,'Grok Bot');assert.equal(state.hash,'#explore');
   assert.deepEqual(await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId)),ids);
   assert.equal(state.card,ids[0]);
   assert(state.rect.y>=-1&&state.rect.bottom<=state.height+1,'returning focused button remains visible: '+JSON.stringify(state));
  }
  await browser.close();
 }
 console.log(JSON.stringify(reports,null,2));
})().catch(error=>{console.error(error);process.exit(1)});
