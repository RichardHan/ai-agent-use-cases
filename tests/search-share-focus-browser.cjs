'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'http://127.0.0.1:8170/ai-agent-use-cases/',out=process.env.QA_OUT||'qa-artifacts/share',observe=process.env.QA_OBSERVE==='1';fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];
for(const [engine,width] of (observe?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),row={label:engine.name()+'-'+width,errors:[]};rows.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));
 const screenshot=async name=>page.screenshot({path:`${out}/${name}-${row.label}.png`});
 const defer=async()=>page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:text=>new Promise((resolve,reject)=>{window.shareText=text;window.shareResolve=resolve;window.shareReject=()=>reject(Error('denied'));})}}));
 try{
 await page.goto(base+'?q=旅遊&scenario=生活&tool=Grok+Bot');await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.evaluate(()=>failedPaths.length),0);row.total=await page.evaluate(()=>entries.length);
 await defer();const copy=page.locator('#copy-search-link'),manual=page.locator('#search-share-url');
 await copy.focus();await page.keyboard.press('Enter');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'source-guide-summary');
 row.before=await page.evaluate(()=>({focus:document.activeElement.id,y:scrollY}));await screenshot('waiting');await page.evaluate(()=>window.shareReject());await manual.waitFor({state:'visible'});
 row.after=await page.evaluate(()=>({focus:document.activeElement.id,y:scrollY,selected:document.querySelector('#search-share-url').selectionEnd-document.querySelector('#search-share-url').selectionStart}));row.reproduced=row.after.focus!==row.before.focus;await screenshot('moved-focus');save();
 if(observe){await browser.close();continue;}
 assert.equal(row.after.focus,row.before.focus);assert.equal(row.after.y,row.before.y);assert.equal(row.after.selected,0);assert.match(await page.locator('#search-share-status').innerText(),/手動複製/);
 // A reader staying at the button still receives a selected fallback, including long Unicode search text.
 await page.locator('#query').fill('旅遊 '+ '長途行程👩🏽‍💻'.repeat(18));await copy.focus();await page.keyboard.press('Enter');assert.match(await page.locator('#search-share-status').innerText(),/正在複製/);await screenshot('pending');await page.evaluate(()=>window.shareReject());await manual.waitFor({state:'visible'});assert(await manual.evaluate(n=>n===document.activeElement&&n.selectionStart===0&&n.selectionEnd===n.value.length));
 const url=new URL(await manual.inputValue());assert.equal(url.pathname,'/ai-agent-use-cases/');assert.equal(url.searchParams.get('q'),await page.locator('#query').inputValue());assert.equal(url.searchParams.get('scenario'),'生活');assert.equal(url.searchParams.get('tool'),'Grok Bot');assert(!url.searchParams.has('token'));await screenshot('manual');
 row.axe=[];let scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.axe.push(scan.violations.map(v=>v.id));assert.equal(scan.violations.length,0);
 // Changed conditions cancel stale clipboard feedback, and opening a detail does not lose focus on late rejection.
 await page.locator('#query').fill('旅遊');await copy.focus();await page.keyboard.press('Enter');await page.locator('#query').fill('收件匣');await page.evaluate(()=>window.shareReject());assert.equal(await page.locator('#search-share-status').innerText(),'');assert(await manual.isHidden());assert(await page.locator('#query').evaluate(n=>n===document.activeElement));
 await page.locator('#query').fill('旅遊');await copy.focus();await page.keyboard.press('Enter');await page.locator('#results .card .card-bottom button').first().click();await page.locator('#detail[open]').waitFor();await page.evaluate(()=>window.shareReject());assert(await page.locator('#detail-title').evaluate(n=>n===document.activeElement));await screenshot('detail');await page.keyboard.press('Escape');
 // A successful request keeps keyboard focus. The URL reloads the same results on a new page.
 await copy.focus();await page.keyboard.press('Enter');const shared=await page.evaluate(()=>window.shareText);await page.evaluate(()=>window.shareResolve());assert(await copy.evaluate(n=>n===document.activeElement));assert.match(await page.locator('#search-share-status').innerText(),/已複製/);assert(await manual.isHidden());
 const peer=await context.newPage();const expectedIDs=await page.evaluate(()=>currentFiltered.map(item=>item.id));await peer.goto(shared);await peer.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await peer.locator('#query').inputValue(),'旅遊');assert.equal(await peer.locator('#scenario').inputValue(),'生活');assert.equal(await peer.locator('#tool').inputValue(),'Grok Bot');assert.deepEqual(await peer.evaluate(()=>failedPaths),[]);assert.deepEqual(await peer.evaluate(()=>currentFiltered.map(item=>item.id)),expectedIDs);await peer.reload();await peer.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.deepEqual(await peer.evaluate(()=>failedPaths),[]);assert.deepEqual(await peer.evaluate(()=>currentFiltered.map(item=>item.id)),expectedIDs);row.sharedCount=await peer.evaluate(()=>currentFiltered.length);row.sharedIDs=expectedIDs;await peer.close();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.axe.push(scan.violations.map(v=>v.id));assert.equal(scan.violations.length,0);assert.deepEqual(row.errors,[]);row.passed=true;save();await browser.close();
 }catch(e){row.failure=e.stack;save();await browser.close();throw e;}
}
})().catch(e=>{console.error(e);process.exit(1)});
