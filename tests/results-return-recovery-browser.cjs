'use strict';
const {chromium}=require('playwright'),fs=require('node:fs');
const base=process.env.RETURN_URL||'http://127.0.0.1:8130/ai-agent-use-cases/';
fs.mkdirSync('qa-artifacts/recovery-diagnostic',{recursive:true});
(async()=>{const report=[];const save=()=>fs.writeFileSync('qa-artifacts/recovery-diagnostic/report.json',JSON.stringify(report,null,2));
 const browser=await chromium.launch();
 for(const motion of ['no-preference','reduce'])for(let attempt=0;attempt<4;attempt++)for(const position of ['first','last']){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:motion}),page=await context.newPage();
  const row={motion,attempt,position,trace:[]};report.push(row);save();
  const sample=async label=>{row.trace.push(await page.evaluate(label=>{const e=document.activeElement,b=e.getBoundingClientRect();return {label,time:performance.now(),scrollY,focus:e.dataset.resultsReturn||e.id,top:b.top,bottom:b.bottom,visible:b.top>=0&&b.bottom<=innerHeight};},label));save();};
  await page.route('**/cases/001-*.md',r=>r.fulfill({status:503,body:'unavailable'}));await page.goto(base);await page.waitForFunction(()=>discoveryReady);
  await page.unroute('**/cases/001-*.md');let release;const gate=new Promise(resolve=>release=resolve);await page.route('**/cases/001-*.md',async r=>{await gate;await r.continue();});
  await page.locator('#retry-failed').click();await page.waitForFunction(()=>recoveringSources);const links=page.locator('#results [data-results-return]');await (position==='first'?links.first():links.last()).focus();await sample('focused-before-release');
  release();await page.waitForFunction(()=>failedPaths.length===0&&!recoveringSources);await sample('after-recovery');
  await page.evaluate(()=>new Promise(requestAnimationFrame));await sample('next-frame');
  for(const delay of [50,100,300]){await page.waitForTimeout(delay);await sample('after-'+delay+'ms');}
  if(row.trace.some(t=>!t.visible))await page.screenshot({path:`qa-artifacts/recovery-diagnostic/${motion}-${attempt}-${position}.png`});
  await context.close();
 }
 await browser.close();console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
