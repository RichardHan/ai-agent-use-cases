'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8135/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/after',observe=process.env.OBSERVE==='1';fs.mkdirSync(out,{recursive:true});
(async()=>{const report=[];
for(const [engine,width] of (observe?[[chromium,1440],[chromium,390]]:process.env.RED==='1'?[[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();const label=engine.name()+'-'+width,row={label,errors:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 const ready=async suffix=>{await page.goto(base+suffix);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.evaluate(()=>failedPaths.length),0);};
 const view=()=>page.evaluate(()=>({id:currentDetailItem.id,scroll:document.getElementById('detail').scrollTop,open:document.querySelector('.research-details').open,focus:document.activeElement.id,top:document.activeElement.getBoundingClientRect().top,toolbar:document.querySelector('.detail-toolbar').getBoundingClientRect().bottom}));
 const settle=async()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const returnTo=async(id,forward=false)=>{await page[forward?'goForward':'goBack']();await page.waitForFunction(id=>currentDetailItem?.id===id&&document.getElementById('detail').open,id);await settle();};
 // 1. Compare two long cases, then traverse both directions.
 await ready('?q=PR&case=UC-005#explore');row.total=await page.evaluate(()=>entries.length);
 await page.locator('.reader-jump').filter({hasText:'限制與權限'}).click();row.a=await view();await page.screenshot({path:`${out}/reading-${label}.png`});
 await page.locator('#nav-next-case').click();row.b=await view();assert.equal(row.b.scroll,0);assert.equal(row.b.focus,'detail-title');
 await page.locator('.reader-jump').first().click();row.bRead=await view();
 await returnTo('UC-005');row.aReturned=await view();await page.screenshot({path:`${out}/returned-${label}.png`});
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
 if(!observe){assert(row.aReturned.open,'Back restores expanded original research');assert(Math.abs(row.aReturned.scroll-row.a.scroll)<3,'Back restores A reading position');assert.equal(row.aReturned.focus,row.a.focus);}
 await returnTo(row.b.id,true);row.bReturned=await view();if(!observe){assert.equal(row.bReturned.open,row.bRead.open);assert(Math.abs(row.bReturned.scroll-row.bRead.scroll)<3);}
 if(observe){await browser.close();continue;}
 // 2. Back to results and Forward reopen with original result trigger retained.
 await ready('?q=旅遊&scenario=生活');await page.locator('#query').press('Enter');const trigger=page.locator('#results .card .card-bottom button').first(),id=await trigger.evaluate(n=>n.closest('.card').dataset.caseId);await trigger.click();
 await page.locator('.reader-jump').filter({hasText:'來源與版本'}).click();const original=await view();await page.goBack();assert(!await page.locator('#detail').evaluate(n=>n.open));assert(await trigger.evaluate(n=>n===document.activeElement));
 await returnTo(id,true);const reopened=await view();assert.equal(reopened.open,original.open);assert(Math.abs(reopened.scroll-original.scroll)<3);await page.keyboard.press('Escape');assert(await trigger.evaluate(n=>n===document.activeElement));
 // 3. Same article in separate entries, outline filtering and source content unchanged.
 await ready('?case=UC-005');await page.locator('.reader-outline summary').click();const finder=page.locator('#reader-outline-query');assert(await finder.count());await finder.fill('限制');await finder.press('Enter');const first=await view();
 const originalText=await page.locator('.markdown').evaluate(n=>{const c=n.cloneNode(true);c.querySelectorAll('.reader-return,.reader-copy').forEach(x=>x.remove());return c.textContent;});
 await page.locator('#nav-next-case').click();await page.evaluate(()=>showDetail(entries.find(e=>e.id==='UC-005'),null,true));const fresh=await view();assert.equal(fresh.scroll,0);assert.equal(fresh.focus,'detail-title');assert.equal(await finder.inputValue(),'');
 await page.goBack();await page.goBack();await page.waitForFunction(()=>currentDetailItem.id==='UC-005');await settle();assert.equal(await finder.inputValue(),'限制');assert(await page.locator('.reader-outline').evaluate(n=>n.open));assert(Math.abs((await view()).scroll-first.scroll)<3);
 assert.equal(await page.locator('.markdown').evaluate(n=>{const c=n.cloneNode(true);c.querySelectorAll('.reader-return,.reader-copy').forEach(x=>x.remove());return c.textContent;}),originalText);
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.axe=audit.violations.map(v=>v.id);assert.deepEqual(row.axe,[]);assert.deepEqual(row.errors,[]);
 if(width===390){
  await page.locator('.reader-jump').filter({hasText:'限制與權限'}).click();const beforeResize=await view();
  await page.locator('#nav-next-case').click();await page.setViewportSize({width:320,height:900});await returnTo('UC-005');
  const resized=await view();assert.equal(resized.focus,beforeResize.focus);assert(Math.abs(resized.top-beforeResize.top)<3);row.resized=resized;
  await page.setViewportSize({width,height:900});
 }
 assert(await page.locator('#detail').evaluate(n=>n.scrollWidth<=n.clientWidth));row.resultReopen={original,reopened};row.sameEntry={first,fresh};
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log('PASS '+label);
}
if(!observe&&process.env.RED!=='1'){
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/cases/001-travel-checkout.md',route=>route.abort());await page.goto(base+'?q=PR#explore');await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert(await page.locator('#partial-load').isVisible());
 await page.unroute('**/cases/001-travel-checkout.md');let release;const gate=new Promise(r=>release=r);
 await page.route('**/cases/001-travel-checkout.md',async route=>{await gate;await route.continue();});
 await page.locator('#retry-failed').click();await page.locator('#results .card[data-case-id="UC-005"] .card-bottom button').click();await page.locator('.reader-jump').filter({hasText:'限制與權限'}).click();
 const before=await page.evaluate(()=>({scroll:document.getElementById('detail').scrollTop,focus:document.activeElement.id}));await page.locator('#nav-next-case').click();release();await page.waitForFunction(()=>!recoveringSources&&failedPaths.length===0,null,{timeout:120000});
 await page.goBack();await page.waitForFunction(()=>currentDetailItem.id==='UC-005');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const after=await page.evaluate(()=>({scroll:document.getElementById('detail').scrollTop,focus:document.activeElement.id,open:document.querySelector('.research-details').open}));
 assert(after.open);assert(Math.abs(after.scroll-before.scroll)<3);assert.equal(after.focus,before.focus);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/recovery.json',JSON.stringify({before,after,errors},null,2));await browser.close();
}
})().catch(e=>{console.error(e);process.exit(1)});
