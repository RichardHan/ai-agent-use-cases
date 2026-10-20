'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:8142/ai-agent-use-cases/');await page.waitForFunction(()=>discoveryReady&&document.getElementById('audit-count').textContent!=='—');
 const status=page.locator('#audit-status');const record={text:await status.innerText(),visible:await status.isVisible(),display:await status.evaluate(e=>getComputedStyle(e).display)};
 assert.match(record.text,/20:00/);assert.equal(record.visible,false,'first implementation reproduces hidden mobile status');
 fs.mkdirSync('qa-artifacts/hidden-status',{recursive:true});fs.writeFileSync('qa-artifacts/hidden-status/red.json',JSON.stringify(record,null,2));
 await page.locator('.stats').scrollIntoViewIfNeeded();await page.screenshot({path:'qa-artifacts/hidden-status/before-mobile.png'});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
