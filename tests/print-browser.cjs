'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const observe=process.env.PRINT_OBSERVE==='1';
const base=process.env.PRINT_URL||'http://127.0.0.1:8087/ai-agent-use-cases/';
fs.mkdirSync('qa-artifacts',{recursive:true});
(async()=>{
 const report=[];
 for(const width of [1440,390]){
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width,height:width===390?844:1000}});
  await page.goto(base+'?q=報告&case=UC-313#explore',{waitUntil:'networkidle'});
  await page.locator('#detail[open]').waitFor();
  await page.screenshot({path:`qa-artifacts/print-${observe?'before':'after'}-${width}.png`});
  await page.emulateMedia({media:'print'});
  const metrics=await page.locator('#detail').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,position:getComputedStyle(el).position,overflow:getComputedStyle(el).overflow,body:getComputedStyle(document.body).overflow}));
  report.push({width,...metrics});
  await page.screenshot({path:`qa-artifacts/print-paper-${observe?'before':'after'}-${width}.png`,fullPage:true});
  await page.pdf({path:`qa-artifacts/case-${observe?'before':'after'}-${width}.pdf`,format:'A4'});
  if(!observe)assert(metrics.scroll<=metrics.height+2,'printing must not clip the case inside its dialog');
  await browser.close();
 }
 fs.writeFileSync(`qa-artifacts/print-${observe?'baseline':'verification'}.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
