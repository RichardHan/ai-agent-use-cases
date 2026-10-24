'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/',out=process.env.QA_OUT||'qa-artifacts/sharing',before=process.env.QA_BEFORE==='1';
(async()=>{fs.mkdirSync(out,{recursive:true});const rows=[];
for(const [engine,width] of (before?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const b=await engine.launch(),context=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await context.newPage(),r={engine:engine.name(),width,errors:[]};rows.push(r);p.on('pageerror',e=>r.errors.push(e.message));
 try{
 await context.addInitScript(()=>{window.shareWrites=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:url=>new Promise((resolve,reject)=>shareWrites.push({url,resolve,reject}))}});});
 await p.goto(base+'?q=旅遊&scenario=生活&tool=Grok+Bot&sort=reviewed');await p.waitForFunction(()=>discoveryReady,null,{timeout:90000});assert.deepEqual(await p.evaluate(()=>failedPaths),[]);r.total=await p.evaluate(()=>entries.length);
 const button=p.locator('#copy-search-link');await button.focus();await p.keyboard.press('Enter');r.pending=await p.locator('#search-share-status').innerText();await p.screenshot({path:`${out}/pending-${engine.name()}-${width}.png`});
 if(before)assert.equal(r.pending,'');else assert.equal(r.pending,'正在複製搜尋連結…');
 // Move to a control that does not change the query/render or invalidate the request.
 await p.locator('#filter-summary').focus();await p.evaluate(()=>shareWrites[0].reject(Error('QA clipboard denied after moving focus')));await p.locator('#search-share-url').waitFor({state:'visible'});r.focusAfterDenied=await p.evaluate(()=>document.activeElement.id);r.fallback=await p.locator('#search-share-url').inputValue();await p.screenshot({path:`${out}/moved-focus-${engine.name()}-${width}.png`});
 if(before){assert.equal(r.focusAfterDenied,'search-share-url');continue;}
 assert.equal(r.focusAfterDenied,'filter-summary');const shared=new URL(r.fallback);assert.equal(shared.pathname,'/ai-agent-use-cases/');assert.equal(shared.searchParams.get('scenario'),'生活');assert.equal(shared.searchParams.get('tool'),'Grok Bot');assert.equal(shared.searchParams.get('sort'),'reviewed');assert.equal(shared.hash,'#explore');
 assert.equal(await p.locator('#search-share-url').getAttribute('aria-describedby'),'search-share-status');
 // Same button retained: a fresh denial selects the exact URL for manual copying.
 await button.focus();await p.keyboard.press('Enter');await p.evaluate(()=>shareWrites[1].reject(Error('QA denied')));await p.waitForFunction(()=>document.activeElement.id==='search-share-url');assert.equal(await p.locator('#search-share-url').evaluate(n=>n.value.slice(n.selectionStart,n.selectionEnd)),r.fallback);await p.screenshot({path:`${out}/fallback-${engine.name()}-${width}.png`});
 r.buttonSize=await button.evaluate(n=>({height:n.getBoundingClientRect().height,font:getComputedStyle(n).fontSize}));assert(r.buttonSize.height>=44);assert.equal(r.buttonSize.font,'14px');
 r.axe=(await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(r.axe,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Overlapping requests and changed conditions cannot restore obsolete feedback.
 await button.click();await button.click();await p.evaluate(()=>shareWrites[3].resolve());await p.waitForFunction(()=>document.querySelector('#search-share-status').textContent.startsWith('已複製'));await p.evaluate(()=>shareWrites[2].reject(Error('obsolete')));assert(await p.locator('#search-share-url').isHidden());
 await button.click();await p.locator('#query').fill('no-share-result');await p.locator('#empty').waitFor({state:'visible'});await p.evaluate(()=>shareWrites[4].reject(Error('obsolete query')));assert.equal(await p.locator('#search-share-status').innerText(),'');assert(await p.locator('#search-share-url').isHidden());
 // Restored URL has exact original conditions and matches original result IDs.
 await p.goto(shared.href);await p.waitForFunction(()=>discoveryReady);assert.deepEqual(await p.evaluate(()=>failedPaths),[]);assert.equal(await p.locator('#query').inputValue(),'旅遊');assert.equal(await p.locator('#sort').inputValue(),'reviewed');assert.equal(await p.locator('#scenario').inputValue(),'生活');assert.equal(await p.locator('#tool').inputValue(),'Grok Bot');r.resultIds=await p.locator('#results .card').evaluateAll(ns=>ns.map(n=>n.dataset.caseId));assert(r.resultIds.length>0);
 await button.click();await p.evaluate(()=>shareWrites[0].resolve());await p.waitForFunction(()=>document.querySelector('#search-share-status').textContent.startsWith('已複製'));await p.screenshot({path:`${out}/success-${engine.name()}-${width}.png`});assert(await p.locator('#search-share-url').isHidden());
 // A pending denial cannot pull focus out of the detail reading flow.
 await button.click();await p.locator('#results .card .card-bottom button').first().click();await p.locator('#detail[open]').waitFor();const focused=await p.evaluate(()=>document.activeElement.id);await p.evaluate(()=>shareWrites[1].reject(Error('after open')));assert.equal(await p.evaluate(()=>document.activeElement.id),focused);await p.keyboard.press('Escape');assert.deepEqual(r.errors,[]);r.passed=true;
 }catch(e){r.failure=e.stack;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));await b.close();}
}
})().catch(e=>{console.error(e);process.exitCode=1});
