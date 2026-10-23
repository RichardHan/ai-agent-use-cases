'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'http://127.0.0.1:8178/ai-agent-use-cases/',out=process.env.QA_OUT||'qa-artifacts/after',before=process.env.QA_BEFORE==='1';fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];for(const [engine,width] of (before?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),row={label:engine.name()+'-'+width,errors:[],requests:{}};rows.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 if(before)await page.route('**/assets/app.js',r=>r.fulfill({path:process.env.BEFORE_APP,contentType:'text/javascript'}));
 const path='cases/001-travel-checkout.md';
 await page.route('**/'+path,async r=>{row.requests[path]=(row.requests[path]||0)+1;if(row.requests[path]===1)await r.fulfill({status:503,headers:{'Retry-After':'0'},body:'Temporary failure'});else await r.continue();});
 try{
 const start=Date.now();await page.goto(base+'?q=旅遊&scenario=生活&tool=Grok%20Bot');await page.waitForFunction(()=>discoveryReady,null,{timeout:30000});row.elapsedMs=Date.now()-start;row.corpus=await page.evaluate(()=>({total:entries.length,failed:[...failedPaths]}));row.resultText=await page.locator('#results-count').innerText();
 if(before){assert.deepEqual(row.corpus.failed,[path]);assert.equal(row.requests[path],1);await page.locator('#partial-load').scrollIntoViewIfNeeded();}else {assert.deepEqual(row.corpus.failed,[]);assert.equal(row.requests[path],2);assert(await page.locator('#partial-load').isHidden());await page.locator('#results-count').scrollIntoViewIfNeeded();}
 await page.screenshot({path:`${out}/results-${row.label}.png`});
 if(before){await page.locator('#retry-failed').click();await page.waitForFunction(()=>!recoveringSources);assert.equal(await page.evaluate(()=>failedPaths.length),0);}
 const trigger=page.locator('#results .card[data-case-id="UC-001"] .card-bottom button');await trigger.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();row.source=await page.locator('.research-details a[href^="https:"]').first().getAttribute('href');await page.keyboard.press('Escape');assert(await trigger.evaluate(n=>n===document.activeElement));assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
 await page.locator('#query').fill('no_transient_result_731');await page.locator('#empty').waitFor({state:'visible'});await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(n=>n===document.activeElement));
 if(!before){row.axe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));assert.deepEqual(row.axe,[]);}
 await page.goto(base+'?case=UC-366');await page.locator('#detail[open]').waitFor();await page.locator('.research-details summary').click();await page.locator('.research-details pre').scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.locator('#detail').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.screenshot({path:`${out}/reading-${row.label}.png`});await page.reload();await page.locator('#detail[open]').waitFor();assert.equal(await page.locator('#detail-toolbar-id').innerText(),'UC-366');assert.deepEqual(row.errors,[]);
 }finally{fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));await context.close();await browser.close();}
}
if(!before){
 const browser=await chromium.launch();const lifecycle=[];
 for(const mode of ['shared-early','persistent','permanent','cancel','long-server-wait']){
  const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage(),row={mode,calls:0};lifecycle.push(row);let release;const gate=new Promise(r=>release=r);
  try{
  await page.route('**/*.md',async route=>{const url=route.request().url();if(url.endsWith('/001-travel-checkout.md')){row.calls++;if(mode==='shared-early'&&row.calls>1){await route.continue();return;}await route.fulfill({status:mode==='permanent'?404:503,headers:{'Retry-After':mode==='long-server-wait'?'120':mode==='cancel'?'2':'0'},body:'QA source unavailable'});return;}if(mode==='shared-early')await gate;await route.continue();});
  await page.goto(base+(mode==='shared-early'?'?case=UC-001&q=旅遊':'?q=旅遊&scenario=生活'));
  if(mode==='shared-early'){await page.locator('#detail[open]').waitFor();row.early=await page.evaluate(()=>!discoveryReady);assert(row.early);assert.equal(await page.locator('#detail-toolbar-id').innerText(),'UC-001');await page.locator('.research-details summary').click();await page.locator('.research-details h2').first().focus();const focused=await page.evaluate(()=>document.activeElement.id);release();await page.waitForFunction(()=>discoveryReady);assert.equal(await page.evaluate(()=>document.activeElement.id),focused);assert.equal(row.calls,2);}
  else {
   if(mode==='cancel'){await page.waitForFunction(()=>!document.querySelector('#use-loaded').disabled);await page.locator('#use-loaded').click();}
   await page.waitForFunction(()=>discoveryReady);assert(await page.locator('#partial-load').isVisible());assert.equal(row.calls,mode==='persistent'?2:1);row.failed=await page.evaluate(()=>[...failedPaths]);assert(row.failed.includes('cases/001-travel-checkout.md'));await page.screenshot({path:`${out}/${mode}-390.png`});
   await page.unroute('**/*.md');await page.locator('#retry-failed').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>!recoveringSources);assert.equal(await page.evaluate(()=>failedPaths.length),0);assert.equal(await page.locator('#query').inputValue(),'旅遊');row.recovered=true;
  }
  }finally{release();fs.writeFileSync(out+'/lifecycle.json',JSON.stringify(lifecycle,null,2));await context.close();}
 }
 await browser.close();
}
})().catch(e=>{fs.writeFileSync(out+'/failure.log',String(e.stack||e));console.error(e);process.exit(1)});
