'use strict';
const {chromium,firefox,webkit}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs'),assert=require('node:assert/strict');
const {skipIfSupersededPublishedUrl}=require('../scripts/published-check.cjs');
if(process.env.LABEL==='live'&&skipIfSupersededPublishedUrl(process.env.CONTROLS_URL)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});const reports=[];
 const views=[['chromium',1440],['chromium',390],['chromium',320],['chromium',360],['firefox',390],['webkit',390]];
 for(const [engine,width] of (process.env.OBSERVE?views.slice(0,3):views)){
 const browser=await ({chromium,firefox,webkit}[engine]).launch();let page;
 try {
 const context=await browser.newContext({viewport:{width,height:width===1440?1000:844}});
 page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let loadedCSS;page.on('response',response=>{if(new URL(response.url()).pathname.endsWith('/assets/reader.css'))loadedCSS=response.text();});
 const base=process.env.CONTROLS_URL||'http://127.0.0.1:8100/ai-agent-use-cases/';
 await page.goto(base);await page.locator('#results .card').first().waitFor();
 if(process.env.LABEL==='live')assert.equal(await loadedCSS,fs.readFileSync('assets/reader.css','utf8'),'actual page-loaded reader.css matches checkout');
 await page.screenshot({path:`qa-artifacts/${process.env.LABEL}-home-${engine}-${width}.png`});
 await page.locator('[data-search-entry]').first().click();await page.locator('#query').fill('旅遊');
 await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');
 const trigger=page.locator('#results .card h3 button').first();await trigger.click();await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);
 const url=page.url(),initialId=await page.locator('#detail-toolbar-id').innerText();await page.screenshot({path:`qa-artifacts/${process.env.LABEL}-reader-${engine}-${width}.png`});
 const controls=await page.locator('.detail-toolbar-actions button').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {id:n.id,width:r.width,height:r.height,font:getComputedStyle(n).fontSize}}));
 console.log('CONTROL_MEASUREMENTS '+JSON.stringify({engine,width,controls}));
 if(!process.env.OBSERVE)for(const c of controls){assert.ok(c.width>=44&&c.height>=44,'TOUCH_TARGET_SIZE '+JSON.stringify(c));assert.ok(parseFloat(c.font)>=14,JSON.stringify(c));}
 await page.locator('#nav-next-case').click();assert.notEqual(await page.locator('#detail-toolbar-id').innerText(),initialId);
 await page.locator('#nav-prev-case').click();assert.equal(await page.locator('#detail-toolbar-id').innerText(),initialId);
 await page.locator('.reader-nav').scrollIntoViewIfNeeded();
 const toolbarVisible=await page.locator('#close-detail').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight});assert.ok(toolbarVisible);
 await page.locator('.detail-source').click({trial:true});const source=await page.locator('.detail-source').getAttribute('href');
 assert.equal(source,'https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/001-travel-checkout.md','source entry keeps the public original path');
 // Remote availability is recorded separately from UI correctness (GitHub can return 429).
 const sourceStatus=width===1440?(await page.request.get(source)).status():null;
 await page.keyboard.press('Escape');assert.equal(await page.locator('#detail').evaluate(n=>n.open),false);
 assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
 assert(await trigger.evaluate(n=>n===document.activeElement),'Escape restores original trigger focus');
 await page.goto(url);await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);await page.reload();await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);
 assert.equal(await page.locator('#detail-toolbar-id').innerText(),initialId);
 await page.locator('#close-detail').click();
 assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
 assert.equal(new URL(page.url()).searchParams.get('q'),'旅遊');assert.equal(new URL(page.url()).searchParams.get('scenario'),'生活');assert(!new URL(page.url()).searchParams.has('case'));
 await page.locator('#query').fill('zzzz-no-match-8472');await page.locator('#empty:not([hidden])').waitFor();
 await page.locator('#empty-reset').click();await page.locator('#results .card').first().waitFor();
 await page.goto(base+'?case=UC-313');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);
 const shortcut=page.locator('.reader-method-shortcut');
 assert.equal(await shortcut.count(),1);
 {
  const targetId=await shortcut.getAttribute('aria-controls');
  await shortcut.click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),targetId);
  assert.ok(await page.evaluate(()=>{const r=document.activeElement.getBoundingClientRect(),toolbar=document.querySelector('.detail-toolbar').getBoundingClientRect(),dialog=document.getElementById('detail').getBoundingClientRect();return r.top>=toolbar.bottom&&r.bottom<=dialog.bottom;}),'entire jump heading visible below toolbar within dialog');
 }
 await page.locator('.research-details').evaluate(n=>n.open=true);await page.locator('.related-cases').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('#detail').evaluate(n=>n.scrollWidth>n.clientWidth),false);
 assert.ok(await page.locator('.detail-toolbar-actions button').evaluateAll(ns=>ns.every(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth})));
 if(!process.env.OBSERVE){
  const idHeight=await page.locator('#detail-toolbar-id').evaluate(n=>n.getBoundingClientRect().height);
  await page.locator('#detail-toolbar-id').evaluate(n=>n.textContent='UC-very-long-identifier-'.repeat(8));
  assert.equal(await page.locator('#detail-toolbar-id').evaluate(n=>n.getBoundingClientRect().height),idHeight,'long ID stays on one line');
  assert.ok(await page.locator('.detail-toolbar-actions button').evaluateAll(ns=>{const rects=ns.map(n=>n.getBoundingClientRect());return rects.every((r,i)=>r.width>=44&&r.height>=44&&r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth&&(!i||rects[i-1].right<=r.left+1));}),'long ID preserves visible, non-overlapping 44px controls');
  assert.equal(await page.locator('#detail').evaluate(n=>n.scrollWidth>n.clientWidth),false);
  await page.locator('#detail-toolbar-id').evaluate((n,id)=>n.textContent=id,'UC-313');
 }
 await page.locator('#copy-case-link').focus();await page.keyboard.press('Shift+Tab');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'close-detail');assert.equal(await page.locator('#close-detail').evaluate(n=>n.matches(':focus-visible')),true);
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 reports.push({engine,width,controls,toolbarVisible,source,sourceStatus,axe:axe.violations.map(v=>v.id),errors});
 fs.writeFileSync(`qa-artifacts/${process.env.LABEL}-report.json`,JSON.stringify(reports,null,2));
 assert.deepEqual(errors,[]);assert.deepEqual(axe.violations,[]);
 } catch(error) {
  if(page){
   const state=await page.evaluate(()=>({url:location.href,dialogOpen:document.getElementById('detail')?.open,error:document.getElementById('error')?.textContent,partial:document.getElementById('partial-message')?.textContent,failed:typeof failedPaths==='undefined'?null:failedPaths,loaded:typeof entries==='undefined'?null:entries.length})).catch(()=>null);
   fs.writeFileSync(`qa-artifacts/${process.env.LABEL}-failure-${engine}-${width}.json`,JSON.stringify({message:error.message,state},null,2));
   await page.screenshot({path:`qa-artifacts/${process.env.LABEL}-failure-${engine}-${width}.png`}).catch(()=>{});
  }
  throw error;
 } finally { await browser.close(); }
 }
 fs.writeFileSync(`qa-artifacts/${process.env.LABEL}-report.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
})().catch(e=>{console.error(e);process.exitCode=1});
