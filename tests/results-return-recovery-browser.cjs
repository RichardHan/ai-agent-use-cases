'use strict';
const sourceRoute=require('./source-route.cjs');
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.RETURN_URL||'http://127.0.0.1:8130/ai-agent-use-cases/';
const output=process.env.RETURN_RECOVERY_OUTPUT||'qa-artifacts/recovery-diagnostic';
fs.mkdirSync(output,{recursive:true});
(async()=>{const report=[];const save=()=>fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));
 const browser=await chromium.launch();
 for(const motion of ['no-preference','reduce'])for(let attempt=0;attempt<4;attempt++)for(const position of ['first','last']){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:motion}),page=await context.newPage();
  const row={motion,attempt,position,trace:[]};report.push(row);save();
  const sample=async label=>{row.trace.push(await page.evaluate(label=>{const e=document.activeElement,b=e.getBoundingClientRect();return {label,time:performance.now(),scrollY,focus:e.dataset.resultsReturn||e.id,top:b.top,bottom:b.bottom,visible:b.top>=0&&b.bottom<=innerHeight};},label));save();};
  await sourceRoute(page,'**/cases/001-*.md',r=>r.fulfill({status:503,body:'unavailable'}));await page.goto(base);await page.waitForFunction(()=>discoveryReady);row.before=await page.locator('#results .card').count();
  await page.unroute('**/cases/001-*.md');let release;const gate=new Promise(resolve=>release=resolve);await sourceRoute(page,'**/cases/001-*.md',async r=>{await gate;await r.continue();});
  await page.locator('#retry-failed').click();await page.waitForFunction(()=>recoveringSources);const links=page.locator('#results [data-results-return]');await (position==='first'?links.first():links.last()).focus();await sample('focused-before-release');
  release();await page.waitForFunction(()=>failedPaths.length===0&&!recoveringSources);await sample('after-recovery');
  await page.evaluate(()=>new Promise(requestAnimationFrame));await sample('next-frame');
  for(const delay of [50,100,300]){await page.waitForTimeout(delay);await sample('after-'+delay+'ms');}
  await page.screenshot({path:`${output}/${motion}-${attempt}-${position}.png`});
  await context.close();
 }
 await browser.close();console.log(JSON.stringify(report));
 if(process.env.RETURN_RECOVERY_ASSERT==='1')for(const row of report)for(const trace of row.trace.slice(1)){assert.equal(trace.focus,row.position==='first'?'6':String(row.before%6===0?row.before:row.before+1),'recovered route retains focus');assert(trace.visible,JSON.stringify({motion:row.motion,attempt:row.attempt,position:row.position,trace}));}
})().catch(e=>{console.error(e);process.exit(1)});
