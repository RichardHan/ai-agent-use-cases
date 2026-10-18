'use strict';
const {webkit}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.CONTROL_URL,modeName=process.env.CONTROL_NAME;
fs.mkdirSync('qa-artifacts',{recursive:true});
(async()=>{
 const browser=await webkit.launch(),report=[];
 for(const [iteration,shot] of [true,false,false,true,true,false].entries()){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();
  await page.goto(origin+'?q=旅遊&tool=Grok%20Bot#explore',{waitUntil:'networkidle'});
  await page.request.get(origin+'assets/app.js');
  const trigger=page.locator('#results .card .card-bottom button').first();await trigger.waitFor();
  const id=await page.locator('#results .card').first().getAttribute('data-case-id');
  await trigger.click();await page.locator('#detail[open]').waitFor();await page.locator('.reader-jump').first().click();
  await page.goBack();const start=Date.now(),row={iteration,shot,id,samples:[]};report.push(row);
  const inspect=async label=>{
   const state=await page.evaluate(()=>{const active=document.activeElement,button=document.querySelector('#results .card .card-bottom button');return {time:performance.now(),card:active.closest('.card')?.dataset.caseId,tag:active.tagName,id:active.id,scrollY,rect:button.getBoundingClientRect().toJSON(),height:innerHeight,open:document.getElementById('detail').open,query:document.getElementById('query').value,tool:document.getElementById('tool').value};});
   row.samples.push({label,...state});fs.writeFileSync('qa-artifacts/control-'+modeName+'.json',JSON.stringify(report,null,2));return state;
  };
  const valid=state=>{assert.equal(state.card,id);assert.equal(state.open,false);assert.equal(state.query,'旅遊');assert.equal(state.tool,'Grok Bot');assert(state.rect.y>=-1&&state.rect.bottom<=state.height+1);};
  await page.waitForTimeout(Math.max(0,500-(Date.now()-start)));
  valid(await inspect('500-before-shot'));
  if(shot){row.shotStart=Date.now()-start;await page.screenshot({path:'qa-artifacts/control-'+modeName+'-'+iteration+'.png'});row.shotEnd=Date.now()-start;await inspect('immediately-after-shot');}
  for(const time of [800,1000]){await page.waitForTimeout(Math.max(0,time-(Date.now()-start)));const state=await inspect(String(time));if(!shot)valid(state);}
  await context.close();
 }
 await browser.close();console.log('CONTROL '+JSON.stringify(report));
})().catch(error=>{console.error(error);process.exit(1)});
