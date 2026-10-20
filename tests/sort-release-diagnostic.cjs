'use strict';
const {webkit}=require('playwright'),fs=require('node:fs');
const out='qa-artifacts/sort-release';fs.mkdirSync(out,{recursive:true});const report=[];
(async()=>{
 const browser=await webkit.launch();
 const timings={};
 for(let attempt=1;attempt<=3;attempt++)for(const [variant,base] of [['before','http://127.0.0.1:8125/ai-agent-use-cases/'],['after-preview','http://127.0.0.1:8124/ai-agent-use-cases/'],['after-published','https://richardhan.github.io/ai-agent-use-cases/']])for(const mode of ['screenshot','equal-wait']){
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();
   const row={variant,attempt,mode,errors:[]};report.push(row);const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));save();page.on('pageerror',e=>row.errors.push(e.message));
   await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});row.failed=await page.evaluate(()=>failedPaths);
   await page.locator('[data-search-entry]').first().click();await page.locator('#query').fill('旅遊');await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');
   await page.evaluate(()=>{globalThis.focusTrace=[];for(const type of ['focusin','focusout','scroll','keydown'])document.addEventListener(type,e=>{if(focusTrace.length<100)focusTrace.push({type,key:e.key||'',at:performance.now(),tag:document.activeElement.tagName,focus:document.activeElement.id,scrollY,resultsTop:$('results-count').getBoundingClientRect().top});},true);});
   const state=()=>page.evaluate(()=>({tag:document.activeElement.tagName,focus:document.activeElement.id,scrollY,top:$('results-count').getBoundingClientRect().top}));
   await page.locator('#query').focus();await page.keyboard.press('Enter');await page.waitForTimeout(350);row.after350=await state();
   const start=Date.now();
   if(mode==='screenshot'){await page.screenshot({path:`${out}/${variant}-${attempt}-before-tab.png`});timings[variant]=Date.now()-start;}
   else await page.waitForTimeout(timings[variant]);
   row.measurementMs=Date.now()-start;row.beforeTab=await state();
   await page.keyboard.press('Tab');row.immediateAfterTab=await state();await page.waitForTimeout(350);row.settledAfterTab=await state();row.trace=await page.evaluate(()=>focusTrace);row.passed=row.after350.focus==='results-count'&&row.beforeTab.focus==='results-count'&&row.immediateAfterTab.focus==='copy-search-link'&&row.settledAfterTab.focus==='copy-search-link';
   save();await context.close();
 }
 await browser.close();console.log(JSON.stringify(report.map(({trace,...r})=>r),null,2));
})().catch(e=>{console.error(e);fs.writeFileSync(out+'/error.txt',e.stack);process.exit(1)});
