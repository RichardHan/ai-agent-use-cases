'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SHARE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.SHARE_OUTPUT||'qa-artifacts/share-before';
const observe=process.env.SHARE_OBSERVE==='1',live=process.env.SHARE_LIVE==='1';
const reports=[];fs.mkdirSync(out,{recursive:true});
const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(reports,null,2));
(async()=>{
 for(const [engine,width,height] of live?[[chromium,1440,1000],[chromium,390,844]]:observe?[[chromium,1440,1000],[chromium,390,844],[chromium,320,740]]:[[chromium,1440,1000],[chromium,390,844],[chromium,320,740],[firefox,390,844],[webkit,390,844]]){
 const browser=await engine.launch();let page;
 const row={engine:engine.name(),width,errors:[],audits:[]};reports.push(row);save();
 try{
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});page=await context.newPage();
 page.on('pageerror',e=>row.errors.push(e.message));
 await page.addInitScript(()=>{window.copiedURLs=[];window.pendingCopies=[];window.clipboardStub={writeText:async value=>{window.copiedURLs.push(value);if(window.denyCopy)throw Error('Clipboard denied for test');if(window.delayCopy)await new Promise((resolve,reject)=>pendingCopies.push({resolve,reject}));}};Object.defineProperty(navigator,'clipboard',{configurable:true,value:clipboardStub});});
 const ready=()=>page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
 await page.goto(base);await ready();await page.screenshot({path:`${out}/home-${engine.name()}-${width}.png`});
 await page.locator('#query').fill('旅遊');await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');
 await page.locator('#results .card h3 button').first().click();await page.locator('#detail[open]').waitFor();
 if(!observe){assert.match(await page.locator('#case-share-status').ariaSnapshot(),/status/);assert.equal(await page.locator('#case-share-status').getAttribute('aria-live'),'polite');}
 row.caseId=await page.locator('#detail-toolbar-id').innerText();row.entries=await page.evaluate(()=>entries.length);row.failed=await page.evaluate(()=>failedPaths);assert.deepEqual(row.failed,[]);
 row.source=await page.locator('.detail-source').getAttribute('href');
 if(width===1440){const popupWait=page.waitForEvent('popup');await page.locator('.detail-source').click();const popup=await popupWait;row.sourceOpened=popup.url();await popup.close();row.sourceStatus=(await page.request.get(row.source)).status();}
 await page.keyboard.press('Escape');assert(!(await page.locator('#detail').evaluate(n=>n.open)));assert.equal(await page.locator('#query').inputValue(),'旅遊');
 await page.locator('#results .card h3 button').first().click();
 await page.evaluate(()=>{const u=new URL(location.href);u.searchParams.set('unrelated','synthetic-marker');u.hash='unrelated-fragment';history.replaceState(history.state,'',u);});
 const beforeCopy=page.url(),historyLength=await page.evaluate(()=>history.length);
 await page.locator('#copy-case-link').focus();await page.keyboard.press('Enter');
 row.copied=await page.evaluate(()=>copiedURLs.at(-1));row.control=await page.locator('#copy-case-link').evaluate(n=>({text:n.textContent,height:n.getBoundingClientRect().height,font:getComputedStyle(n).fontSize,live:n.getAttribute('aria-live')}));
 await page.screenshot({path:`${out}/success-${engine.name()}-${width}.png`});save();
 if(!observe){
  const url=new URL(row.copied);assert.equal(url.pathname,new URL(base).pathname);assert.equal(url.searchParams.get('case'),row.caseId);
  assert.equal(url.searchParams.get('q'),'旅遊');assert.equal(url.searchParams.get('scenario'),'生活');assert.equal(url.searchParams.has('unrelated'),false);assert.equal(url.hash,'#explore');
  assert.equal(page.url(),beforeCopy);assert.equal(await page.evaluate(()=>history.length),historyLength);
  assert(row.control.height>=44);assert(parseFloat(row.control.font)>=14);
  assert.equal(await page.locator('#copy-case-link').getAttribute('aria-label'),'複製案例連結');
  assert.equal(await page.locator('#case-share-status').getAttribute('role'),'status');assert.equal(await page.locator('#case-share-status').getAttribute('aria-atomic'),'true');
  assert.match(await page.locator('#case-share-status').innerText(),/已複製.*搜尋與篩選/);
  assert.match(await page.locator('#copy-case-link').innerText(),/複製案例連結/);
  const successAudit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({label:'copy success',violations:successAudit.violations.map(v=>v.id)});assert.deepEqual(successAudit.violations,[]);
 }
 await page.evaluate(()=>window.denyCopy=true);await page.locator('#copy-case-link').click();await page.locator('.manual-share-link').waitFor();
 row.manual=await page.locator('.manual-share-link').inputValue();row.active=await page.evaluate(()=>document.activeElement.className);
 await page.screenshot({path:`${out}/manual-${engine.name()}-${width}.png`});
 const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({label:'manual copy',violations:a.violations.map(v=>v.id)});save();
 if(!observe){
  assert.deepEqual(a.violations,[]);assert.equal(row.manual,row.copied);
  row.manualFocus=await page.locator('.manual-share-link').evaluate(n=>({focused:n===document.activeElement,outline:getComputedStyle(n).outlineStyle,width:getComputedStyle(n).outlineWidth,selected:n.selectionStart===0&&n.selectionEnd===n.value.length,readonly:n.readOnly}));
  assert(row.manualFocus.focused&&row.manualFocus.selected&&row.manualFocus.readonly);assert.equal(row.manualFocus.outline,'solid');assert.equal(row.manualFocus.width,'2px');
  assert.match(await page.locator('#case-share-status').innerText(),/無法自動複製.*手動複製/);
  assert(await page.locator('#detail').evaluate(n=>n.scrollWidth<=n.clientWidth));
  // Retrying succeeds, clears the stale fallback, and keeps the button's accessible name.
  await page.evaluate(()=>window.denyCopy=false);await page.locator('#copy-case-link').click();
  assert(await page.locator('.manual-share-link').isHidden());assert.equal(await page.locator('.manual-share-link').inputValue(),'');
  assert.match(await page.locator('#case-share-status').innerText(),/已複製/);
  // Recipient opens, refreshes and closes the actual copied URL with its context intact.
  const recipient=await context.newPage();await recipient.goto(row.copied);await recipient.waitForFunction(()=>discoveryReady,null,{timeout:90000});await recipient.locator('#detail[open]').waitFor();
  assert.equal(await recipient.locator('#detail-toolbar-id').innerText(),row.caseId);
  await recipient.reload();await recipient.waitForFunction(()=>discoveryReady,null,{timeout:90000});await recipient.locator('#detail[open]').waitFor();assert.deepEqual(await recipient.evaluate(()=>failedPaths),[]);assert.equal(await recipient.evaluate(()=>entries.length),row.entries);await recipient.locator('#close-detail').click();
  assert.equal(await recipient.locator('#query').inputValue(),'旅遊');assert.equal(await recipient.locator('#scenario').inputValue(),'生活');
  await recipient.locator('#results .card h3 button').first().click();await recipient.goBack();assert(!(await recipient.locator('#detail').evaluate(n=>n.open)));await recipient.close();
  // A long source page still reads and returns; an empty task search can recover.
  await page.locator('.research-details').evaluate(n=>n.open=true);await page.locator('.related-cases').scrollIntoViewIfNeeded();
  assert(await page.locator('#detail').evaluate(n=>n.scrollWidth<=n.clientWidth));
  await page.keyboard.press('Escape');await page.locator('#query').fill('完全不存在987 '+ '長問題'.repeat(50));assert(await page.locator('#empty').isVisible());
  await page.locator('#empty-reset').click();assert((await page.locator('#results .card').count())>0);
  // A shared case retains all five facets, reviewed sorting, and the exact result set.
  const combined=await page.evaluate(id=>{const e=entries.find(e=>e.id===id);return {scenario:e.scenario,kind:e.kind,tool:e.tools[0],category:e.category,proof:e.proof};},row.caseId);
  await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#query').fill('旅遊');
  for(const [key,value] of Object.entries(combined))await page.locator('#'+key).selectOption(value);
  await page.locator('#sort').selectOption('reviewed');const combinedIds=await page.evaluate(()=>currentFiltered.map(e=>e.id));
  await page.locator('#results .card h3 button').first().click();await page.locator('#copy-case-link').click();const allURL=await page.evaluate(()=>copiedURLs.at(-1));
  for(const [key,value] of Object.entries(combined))assert.equal(new URL(allURL).searchParams.get(key),value);assert.equal(new URL(allURL).searchParams.get('sort'),'reviewed');
  await page.goto(allURL);await ready();await page.locator('#detail[open]').waitFor();await page.locator('#close-detail').click();
  assert.deepEqual(await page.evaluate(()=>currentFiltered.map(e=>e.id)),combinedIds);assert.equal(await page.locator('#sort').inputValue(),'reviewed');
  const b=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({label:'returned combined results',violations:b.violations.map(v=>v.id)});assert.deepEqual(b.violations,[]);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  row.journeys=['task search + scenario + source + sharing + denied retry','recipient direct URL + refresh + close + Back','long content + empty recovery + five facets + reviewed share'];
 }
 assert.deepEqual(row.errors,[]);
 }catch(e){row.failure=e.message;save();if(page)await page.screenshot({path:`${out}/failure-${engine.name()}-${width}.png`}).catch(()=>{});throw e;}finally{await browser.close();}
 }
 if(!observe&&!live){
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const race={states:[],errors:[]};reports.push(race);page.on('pageerror',e=>race.errors.push(e.message));
 await page.addInitScript(()=>{
  window.pendingCopies=[];window.clipboardStub={writeText:()=>new Promise((resolve,reject)=>pendingCopies.push({resolve,reject}))};
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:clipboardStub});
 });
 const ready=()=>page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
 for(const state of ['closed','next case','reopened','newer success','newer rejection','moved focus']){
  await page.goto(base+'?q=旅遊&scenario=生活&case=UC-001');await ready();await page.locator('#detail[open]').waitFor();
  const title=await page.locator('#detail-title').innerText();await page.locator('#copy-case-link').click();assert.equal(await page.evaluate(()=>pendingCopies.length),1);
  if(state==='closed'||state==='reopened')await page.locator('#close-detail').click();
  if(state==='reopened')await page.locator('#results .card h3 button').filter({hasText:title}).first().click();
  if(state==='next case')await page.locator('#nav-next-case').click();
  if(state.startsWith('newer')){
   await page.locator('#copy-case-link').click();assert.equal(await page.evaluate(()=>pendingCopies.length),2);
   if(state==='newer success')await page.evaluate(()=>pendingCopies[1].resolve());else await page.evaluate(()=>pendingCopies[1].reject(Error('newer denied')));
  }
  if(state==='moved focus')await page.locator('.detail-source').focus();
  const before=await page.locator('#case-share-status').textContent();
  const focus=await page.evaluate(()=>{window.focusBeforeLateCopy=document.activeElement;return document.activeElement.id||document.activeElement.className;});
  if(state==='newer rejection')await page.evaluate(()=>pendingCopies[0].resolve());else await page.evaluate(()=>pendingCopies[0].reject(Error('late denied')));
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  if(state==='moved focus')assert.match(await page.locator('#case-share-status').textContent(),/無法自動複製/);else assert.equal(await page.locator('#case-share-status').textContent(),before);
  assert(await page.evaluate(()=>document.activeElement===focusBeforeLateCopy));
  if(state==='newer success')assert.match(before,/已複製/);
  if(state==='newer rejection'){assert.match(before,/無法自動複製/);assert(await page.locator('.manual-share-link').isVisible());}
  race.states.push({state,focus,status:before,passed:true});save();
 }
 // Missing Clipboard API uses the same accessible manual path.
 await page.goto(base+'?case=UC-313');await ready();await page.locator('#detail[open]').waitFor();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));await page.locator('#copy-case-link').click();
 assert(await page.locator('.manual-share-link').isVisible());assert.match(await page.locator('#case-share-status').innerText(),/手動複製/);
 race.states.push({state:'missing Clipboard API',passed:true});assert.deepEqual(race.errors,[]);save();await browser.close();
 const realBrowser=await chromium.launch(),realContext=await realBrowser.newContext({permissions:['clipboard-read','clipboard-write']}),realPage=await realContext.newPage();
 await realPage.goto(base+'?case=UC-001');await realPage.waitForFunction(()=>discoveryReady,null,{timeout:90000});await realPage.locator('#detail[open]').waitFor();await realPage.locator('#copy-case-link').click();
 await realPage.waitForFunction(()=>document.getElementById('case-share-status').textContent.startsWith('已複製'));
 const actualClipboard=await realPage.evaluate(()=>navigator.clipboard.readText());assert.equal(new URL(actualClipboard).searchParams.get('case'),'UC-001');
 reports.push({realChromiumClipboard:true,url:actualClipboard});save();await realBrowser.close();
 }
})().catch(e=>{console.error(e);save();process.exit(1)});
