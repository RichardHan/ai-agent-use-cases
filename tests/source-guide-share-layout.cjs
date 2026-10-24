'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.GUIDE_URL||'http://127.0.0.1:8123/ai-agent-use-cases/';
const output='qa-artifacts/source-guide-share';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch(),report=[];
 try{for(const width of [1440,390,320])for(const reject of [false,true]){
  const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'}),page=await context.newPage();
  await page.addInitScript(reject=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{if(reject)throw Error('Denied');}}}),reject);
  await page.goto(origin+'?q=旅遊');await page.waitForFunction(()=>discoveryReady);
  await page.locator('#copy-search-link').click();await page.waitForFunction(()=>/^(已複製|無法自動複製)/.test(document.getElementById('search-share-status').textContent));
  const row=await page.evaluate(()=>{const box=n=>({top:n.getBoundingClientRect().top,bottom:n.getBoundingClientRect().bottom});return {status:box(document.getElementById('search-share-status')),input:box(document.getElementById('search-share-url')),summary:box(document.querySelector('#source-guide summary')),focused:document.activeElement.id};});
  Object.assign(row,{width,reject});assert(row.summary.top>=row.status.bottom);
  if(reject){assert.equal(row.focused,'search-share-url');assert(row.summary.top>=row.input.bottom+3,'guide must not cover the manual-copy input or its focus ring');}
  await page.locator('.search-share').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/${width}-${reject?'manual':'copied'}.png`});
  report.push(row);await context.close();
 }}finally{await browser.close();}
 fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(error=>{console.error(error);process.exit(1);});
