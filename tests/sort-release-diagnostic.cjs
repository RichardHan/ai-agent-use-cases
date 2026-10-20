'use strict';
const {webkit}=require('playwright'),fs=require('node:fs');
const out='qa-artifacts/sort-release';fs.mkdirSync(out,{recursive:true});const report=[];
(async()=>{
 const browser=await webkit.launch();
 for(const [variant,base] of [['before','http://127.0.0.1:8125/ai-agent-use-cases/'],['after-preview','http://127.0.0.1:8124/ai-agent-use-cases/'],['after-published','https://richardhan.github.io/ai-agent-use-cases/']]){
  for(let attempt=1;attempt<=3;attempt++){
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();
   const row={variant,attempt,errors:[]};report.push(row);const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));save();page.on('pageerror',e=>row.errors.push(e.message));
   await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});row.failed=await page.evaluate(()=>failedPaths);
   await page.locator('[data-search-entry]').first().click();await page.locator('#query').fill('旅遊');await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');
   await page.evaluate(()=>{globalThis.focusTrace=[];for(const type of ['focusin','focusout','scroll','keydown'])document.addEventListener(type,e=>{if(focusTrace.length<100)focusTrace.push({type,key:e.key||'',at:performance.now(),focus:document.activeElement.id,resultsTop:$('results-count').getBoundingClientRect().top});},true);});
   await page.locator('#query').focus();await page.keyboard.press('Enter');await page.waitForTimeout(350);row.beforeTab=await page.evaluate(()=>({focus:document.activeElement.id,top:$('results-count').getBoundingClientRect().top}));
   await page.keyboard.press('Tab');row.immediateAfterTab=await page.evaluate(()=>document.activeElement.id);await page.waitForTimeout(350);row.settledAfterTab=await page.evaluate(()=>document.activeElement.id);row.trace=await page.evaluate(()=>focusTrace);row.passed=row.beforeTab.focus==='results-count'&&row.immediateAfterTab==='copy-search-link'&&row.settledAfterTab==='copy-search-link';
   await page.screenshot({path:`${out}/${variant}-${attempt}.png`});save();await context.close();
  }
 }
 await browser.close();console.log(JSON.stringify(report.map(({trace,...r})=>r),null,2));
})().catch(e=>{console.error(e);fs.writeFileSync(out+'/error.txt',e.stack);process.exit(1)});
