'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin='http://127.0.0.1:8086/ai-agent-use-cases/';
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const browser=await chromium.launch();
 const results=[];
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height}});
  const catalog=await (await page.request.get(origin+'catalog.json')).json();
  const path=catalog.files.find(p=>p.startsWith('cases/'));
  const md=await (await page.request.get(origin+path)).text();
  const id=md.match(/UC-\d+/)[0];
  let blocked=true,requests=0;
  await page.route('**/'+path,async route=>{requests++;if(blocked)await route.fulfill({status:429,body:'Rate limited'});else await route.continue();});
  await page.goto(origin+'?q='+id+'#explore');
  await page.waitForFunction(()=>document.querySelector('#results-count').textContent.includes('筆收錄'));
  await page.locator('#search-title').scrollIntoViewIfNeeded();
  const state=await page.evaluate(()=>({count:document.querySelector('#results-count').textContent,empty:!document.querySelector('#empty').hidden,error:!document.querySelector('#error').hidden,retryVisible:!!document.querySelector('#retry-failed')&&!document.querySelector('#partial-load').hidden}));
  await page.screenshot({path:'qa-artifacts/before-partial-'+name+'.jpg',type:'jpeg',quality:70});
  console.log('VISUAL:before-partial-'+name+':'+fs.readFileSync('qa-artifacts/before-partial-'+name+'.jpg').toString('base64'));
  results.push({name,id,path,requests,...state});
  if(!process.env.OBSERVE) assert.equal(state.retryVisible,true,'Partial results must provide a visible recovery action');
  await page.close();
 }
 await browser.close();
 fs.writeFileSync('qa-artifacts/load-baseline.json',JSON.stringify(results,null,2));
 console.log('LOAD_BASELINE '+JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
