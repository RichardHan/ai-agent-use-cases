'use strict';
const fs=require('node:fs'),{chromium}=require('playwright');
const base=process.env.SITE_URL,out='qa-artifacts/arrival-diagnostic';fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[],browser=await chromium.launch();
 for(const mode of ['baseline','bundle'])for(const [width,height] of [[1440,1000],[390,844],[320,740]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),row={mode,width,height};rows.push(row);
  if(mode==='baseline')await page.route('**/assets/app.js',route=>route.fulfill({path:process.env.BEFORE_APP,contentType:'text/javascript'}));
  await page.goto(base+'?q=旅遊&tool=Grok%20Bot#explore',{waitUntil:'networkidle'});await page.locator('#results-count').filter({hasText:'顯示'}).waitFor();
  const measure=()=>page.evaluate(()=>({queryTop:document.querySelector('#query').getBoundingClientRect().top,resultsTop:document.querySelector('#results-count').getBoundingClientRect().top,focus:document.activeElement.id,scrollY,ready:discoveryReady,failed:failedPaths,filtersOpen:document.querySelector('#filter-options').open,filtersHeight:document.querySelector('#filter-options').getBoundingClientRect().height,label:document.querySelector('#results-count').textContent}));
  row.immediate=await measure();await page.screenshot({path:`${out}/${mode}-${width}.png`});await page.waitForTimeout(700);row.settled=await measure();fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
