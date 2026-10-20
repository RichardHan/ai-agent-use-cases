'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SHARE_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.SHARE_OUTPUT||'qa-artifacts/share-before';
const observe=process.env.SHARE_OBSERVE==='1';
const reports=[];fs.mkdirSync(out,{recursive:true});
const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(reports,null,2));
(async()=>{
 for(const [engine,width,height] of observe?[[chromium,1440,1000],[chromium,390,844],[chromium,320,740]]:[[chromium,1440,1000],[chromium,390,844],[chromium,320,740],[firefox,390,844],[webkit,390,844]]){
 const browser=await engine.launch();let page;
 const row={engine:engine.name(),width,errors:[],audits:[]};reports.push(row);save();
 try{
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});page=await context.newPage();
 page.on('pageerror',e=>row.errors.push(e.message));
 await page.addInitScript(()=>{window.copiedURLs=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copiedURLs.push(value);if(window.denyCopy)throw Error('Clipboard denied for test');}}});});
 const ready=()=>page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
 await page.goto(base);await ready();await page.screenshot({path:`${out}/home-${engine.name()}-${width}.png`});
 await page.locator('#query').fill('旅遊');await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');
 await page.locator('#results .card h3 button').first().click();await page.locator('#detail[open]').waitFor();
 row.caseId=await page.locator('#detail-toolbar-id').innerText();row.entries=await page.evaluate(()=>entries.length);row.failed=await page.evaluate(()=>failedPaths);assert.deepEqual(row.failed,[]);
 row.source=await page.locator('.detail-source').getAttribute('href');
 if(width===1440){const popupWait=page.waitForEvent('popup');await page.locator('.detail-source').click();const popup=await popupWait;row.sourceOpened=popup.url();await popup.close();row.sourceStatus=(await page.request.get(row.source)).status();}
 await page.keyboard.press('Escape');assert(!(await page.locator('#detail').evaluate(n=>n.open)));assert.equal(await page.locator('#query').inputValue(),'旅遊');
 await page.locator('#results .card h3 button').first().click();
 await page.evaluate(()=>{const u=new URL(location.href);u.searchParams.set('unrelated','synthetic-marker');u.hash='unrelated-fragment';history.replaceState(history.state,'',u);});
 await page.locator('#copy-case-link').focus();await page.keyboard.press('Enter');
 row.copied=await page.evaluate(()=>copiedURLs.at(-1));row.control=await page.locator('#copy-case-link').evaluate(n=>({text:n.textContent,height:n.getBoundingClientRect().height,font:getComputedStyle(n).fontSize,live:n.getAttribute('aria-live')}));
 await page.screenshot({path:`${out}/success-${engine.name()}-${width}.png`});save();
 await page.evaluate(()=>window.denyCopy=true);await page.locator('#copy-case-link').click();await page.locator('.manual-share-link').waitFor();
 row.manual=await page.locator('.manual-share-link').inputValue();row.active=await page.evaluate(()=>document.activeElement.className);
 await page.screenshot({path:`${out}/manual-${engine.name()}-${width}.png`});
 const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({label:'manual copy',violations:a.violations.map(v=>v.id)});save();
 assert.deepEqual(row.errors,[]);
 }catch(e){row.failure=e.message;save();if(page)await page.screenshot({path:`${out}/failure-${engine.name()}-${width}.png`}).catch(()=>{});throw e;}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);save();process.exit(1)});
