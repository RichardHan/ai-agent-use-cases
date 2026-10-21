'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {promptSections,selectCopySections}=require('../assets/reader.js');
const base=process.env.COPY_URL||'http://127.0.0.1:8180/ai-agent-use-cases/';
const out=process.env.COPY_OUTPUT||'qa-artifacts/after',observe=process.env.COPY_OBSERVE==='1',live=process.env.COPY_LIVE==='1';
fs.mkdirSync(out,{recursive:true});const report=[];const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
async function loaded(page){await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});assert.deepEqual(await page.evaluate(()=>failedPaths),[]);}
async function prompt(page,index){
 await page.locator('.reader-outline').evaluate(e=>e.open=true);
 await page.locator(`.reader-outline-jump[aria-controls="reader-section-${index}"]`).click();
}
(async()=>{for(const [engine,launcher] of (observe||live?[['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]])){
 const browser=await launcher.launch();try{for(const width of (engine==='chromium'?[1440,390]:[390])){
 const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(20000);
 const row={engine,width,errors:[],audits:[],journeys:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 try{
 // Journey 1: task search + combined filter -> original prompt -> adopt -> Back.
 await page.goto(base+'?q=旅遊&scenario=生活&case=UC-001');await page.locator('#detail[open]').waitFor();await loaded(page);
 row.entries=await page.evaluate(()=>entries.length);row.results=await page.locator('#results-count').innerText();
 const md=await page.evaluate(()=>currentDetailItem.markdown),sections=promptSections(md),index=selectCopySections(sections,'case')[0],expected=sections[index].copyText;
 await prompt(page,index);row.actions=await page.locator('.reader-copy-button').count();
 await page.screenshot({path:`${out}/prompt-${engine}-${width}.png`});
 if(observe){assert.equal(row.actions,0);row.completed=true;continue;}
 const copy=page.locator(`#reader-section-${index} + .reader-return + .reader-copy .reader-copy-button`);
 const controls=copy.locator('..');await copy.focus();
 const bounds=await copy.boundingBox();row.controlHeight=bounds.height;assert(bounds.height>=44);assert.equal(await copy.evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),14);
 // Chromium uses the actual browser clipboard; other engines get a controlled success.
 if(engine==='chromium'){
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('.reader-copy-status').textContent.includes('已複製'));
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),expected);row.realClipboard=true;
 }else{
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}}));
 await page.keyboard.press('Enter');await page.waitForFunction(()=>window.copied);assert.equal(await page.evaluate(()=>window.copied),expected);
 }
 assert.equal(await copy.evaluate(e=>e===document.activeElement),true);
 // Denial exposes full readonly text and selects it for manual copying.
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('test denial');}}}));
 await copy.click();const manual=controls.locator('textarea');await manual.waitFor({state:'visible'});
 assert.equal(await manual.inputValue(),expected);assert.equal(await manual.getAttribute('readonly'),'');
 assert.equal(await manual.evaluate(e=>e===document.activeElement&&e.selectionStart===0&&e.selectionEnd===e.value.length),true);
 assert.equal(await manual.evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),16);
 const editingID=await page.locator('#detail-toolbar-id').innerText();await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#detail-toolbar-id').innerText(),editingID);
 await page.screenshot({path:`${out}/manual-${engine}-${width}.png`});
 row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id));assert.deepEqual(row.audits.at(-1),[]);
 await page.emulateMedia({media:'print'});assert.equal(await controls.evaluate(e=>getComputedStyle(e).display),'none');await page.emulateMedia({media:'screen'});
 assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
 await page.locator('#query').fill('no-copy-round-match-123');assert(await page.locator('#empty').isVisible());await page.locator('#empty-reset').click();assert((await page.locator('#results .card').count())>0);row.journeys.push('search/filter, copy, denial/manual, print exclusion, return, empty recovery');
 // Journey 2: a long case has multiple qualified prompts, links and exact raw text.
 if(!live){
 await page.goto(base+'?case=UC-005');await page.locator('#detail[open]').waitFor();await loaded(page);await page.reload();await page.locator('#detail[open]').waitFor();await loaded(page);
 const longMD=await page.evaluate(()=>currentDetailItem.markdown),longSections=promptSections(longMD),indices=selectCopySections(longSections,'case');
 assert(indices.length>1);assert.equal(await page.locator('.reader-copy-button').count(),indices.length);
 for(const i of indices){
 await prompt(page,i);const button=page.locator(`#reader-section-${i} + .reader-return + .reader-copy button`);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}}));
 await button.click();assert.equal(await page.evaluate(()=>window.copied),longSections[i].copyText);
 }
 row.longPrompts=indices.length;assert(longSections.some(s=>s.copyText.includes('https://docs.x.ai/grok-bot/computer-and-apps')));
 // An empty prompt or pending item never gets a misleading copy affordance.
 await page.evaluate(()=>showDetail(metadata('# UC-999：測試\n\n## 可複製提示詞\n\n## 來源\n沒有提示詞','cases/999-test.md','case'),null,false));assert.equal(await page.locator('.reader-copy-button').count(),0);
 await page.evaluate(()=>showDetail(metadata('# P-999：待查\n\n## 可貼指令（未測）\n請核對','sources/pending.md','pending'),null,false));assert.equal(await page.locator('.reader-copy-button').count(),0);
 row.journeys.push('long direct link/reload, every prompt, original links, empty/pending');
 // Journey 3: late responses do not take focus or report on another case.
 await page.evaluate(()=>showDetail(entries.find(e=>e.id==='UC-001'),null,false));await prompt(page,index);
 const action=page.locator('.reader-copy-button').first();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise((resolve,reject)=>{window.copyResolve=resolve;window.copyReject=reject;})}}));
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise((resolve,reject)=>{(window.copyQueue??=[]).push({resolve,reject});})}}));
 await action.click();await action.click();await page.evaluate(()=>{copyQueue[1].resolve();copyQueue[0].reject(Error('old denial'));});
 await page.waitForFunction(()=>document.querySelector('.reader-copy-status').textContent.includes('已複製'));assert.equal(await controls.locator('textarea').isVisible(),false);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise((resolve,reject)=>{window.copyResolve=resolve;window.copyReject=reject;})}}));
 await action.click();await page.locator('#close-detail').focus();await page.evaluate(()=>window.copyReject(Error('delayed denial')));
 await controls.locator('textarea').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>document.activeElement.id),'close-detail');
 await action.click();await page.locator('#nav-next-case').click();await page.evaluate(()=>window.copyResolve());
 assert.equal(await page.evaluate(()=>document.activeElement.id),'detail-title');assert.equal(await page.locator('.reader-copy-status').filter({hasText:'已複製'}).count(),0);
 await page.evaluate(()=>showDetail(entries.find(e=>e.id==='UC-001'),null,false));await prompt(page,index);await page.locator('.reader-copy-button').first().click();
 await page.keyboard.press('Escape');await page.evaluate(()=>window.copyReject(Error('closed denial')));assert.equal(await page.locator('#detail').evaluate(e=>e.open),false);
 row.journeys.push('stale denial after latest success; delayed denial retains moved focus; late success after switch; late denial after close');
 if(engine==='chromium'&&width===1440){
 row.corpus=await page.evaluate(()=>{let count=0,actions=0;for(const item of entries){
 showDetail(item,null,false);const original=renderMarkdown(item.markdown,item.path),copy=document.querySelector('.research-details .markdown').cloneNode(true);
 copy.querySelectorAll('.reader-copy,.reader-return').forEach(e=>e.remove());
 if(copy.textContent!==original.textContent)throw Error('Changed original text '+item.id);
 actions+=document.querySelectorAll('.reader-copy-button').length;count++;
 }return {entries:count,copyActions:actions,originalTextUnchanged:true};});
 }

 }
 assert.deepEqual(row.errors,[]);row.completed=true;
 }catch(e){row.failure=e.stack;throw e;}finally{save();await context.close();}
 }}finally{await browser.close();}}
})().catch(e=>{console.error(e);process.exitCode=1});
