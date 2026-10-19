'use strict';
// Reproduce the old exhaustive test against current and unchanged application JS.
// This stress diagnostic never relaxes the normal journey's URL/error assertions.
const {firefox}=require('playwright'),fs=require('node:fs');
(async()=>{
 const browser=await firefox.launch(),records=[];
 for(const [version,source] of [['current',null],...(process.env.FACET_BASELINE_SOURCE?[['baseline',process.env.FACET_BASELINE_SOURCE]]:[])]){
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],consoleMessages=[];
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(['warning','error'].includes(m.type())&&consoleMessages.length<5)consoleMessages.push(m.text());});
  if(source)await page.route('**/assets/app.js',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(source,'utf8')}));
  await page.goto('http://127.0.0.1:8096/ai-agent-use-cases/?q=旅遊#explore',{waitUntil:'networkidle'});
  await page.locator('#filter-summary').click();
  const started=Date.now();let selections=0;
  for(const key of ['scenario','kind','tool','category','proof']){
   const values=await page.locator('#'+key+' option').evaluateAll(nodes=>nodes.map(n=>n.value));
   for(const value of values){await page.locator('#'+key).selectOption(value);selections++;}
   await page.locator('#'+key).selectOption('');
  }
  await page.locator('#reset').click();await page.locator('#query').fill('旅遊');
  await page.locator('#results .card .card-bottom button').first().click();
  records.push({version,selections,elapsedMs:Date.now()-started,errors,consoleMessages,url:page.url(),history:await page.evaluate(()=>history.length)});
  await page.close();
 }
 fs.writeFileSync('qa-artifacts/firefox-exhaustive-diagnostic.json',JSON.stringify(records,null,2));
 console.log('FIREFOX_EXHAUSTIVE_DIAGNOSTIC '+JSON.stringify(records));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
