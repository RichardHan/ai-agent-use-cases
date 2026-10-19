'use strict';
// Diagnose the earlier exhaustive browser test; never relax production checks.
const {firefox}=require('playwright'),fs=require('node:fs');
(async()=>{
 const browser=await firefox.launch(),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8096/ai-agent-use-cases/?q=旅遊#explore',{waitUntil:'networkidle'});
 await page.locator('#filter-summary').click();
 let selections=0;
 for(const key of ['scenario','kind','tool','category','proof']){
  const values=await page.locator('#'+key+' option').evaluateAll(nodes=>nodes.map(n=>n.value));
  for(const value of values){await page.locator('#'+key).selectOption(value);selections++;}
  await page.locator('#'+key).selectOption('');
 }
 await page.locator('#reset').click();await page.locator('#query').fill('旅遊');
 await page.locator('#results .card .card-bottom button').first().click();
 fs.writeFileSync('qa-artifacts/firefox-exhaustive-diagnostic.json',JSON.stringify({selections,errors,url:page.url(),history:await page.evaluate(()=>history.length)},null,2));
 console.log('FIREFOX_EXHAUSTIVE_DIAGNOSTIC '+JSON.stringify({selections,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
