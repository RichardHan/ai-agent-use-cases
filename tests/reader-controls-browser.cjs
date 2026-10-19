'use strict';
const {chromium,firefox,webkit}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});const reports=[];
 for(const [engine,width] of [['chromium',1440],['chromium',390],['chromium',320],['chromium',360],['firefox',390],['webkit',390]]){
 const browser=await ({chromium,firefox,webkit}[engine]).launch();
 try {
 const page=await browser.newPage({viewport:{width,height:width===1440?1000:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.CONTROLS_URL||'http://127.0.0.1:8100/ai-agent-use-cases/';
 await page.goto(base);await page.locator('#results .card').first().waitFor();
 await page.screenshot({path:`qa-artifacts/${process.env.LABEL}-home-${engine}-${width}.png`});
 await page.locator('[data-search-entry]').first().click();await page.locator('#query').fill('旅遊');
 await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');
 const trigger=page.locator('#results .card h3 button').first();await trigger.click();await page.locator('#detail[open]').waitFor();
 const url=page.url(),initialId=await page.locator('#detail-toolbar-id').innerText();await page.screenshot({path:`qa-artifacts/${process.env.LABEL}-reader-${engine}-${width}.png`});
 const controls=await page.locator('.detail-toolbar-actions button').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {id:n.id,width:r.width,height:r.height,font:getComputedStyle(n).fontSize}}));
 console.log('CONTROL_MEASUREMENTS '+JSON.stringify({engine,width,controls}));
 if(!process.env.OBSERVE)for(const c of controls){assert.ok(c.width>=44&&c.height>=44,'TOUCH_TARGET_SIZE '+JSON.stringify(c));assert.ok(parseFloat(c.font)>=14,JSON.stringify(c));}
 await page.locator('#nav-next-case').click();assert.notEqual(await page.locator('#detail-toolbar-id').innerText(),initialId);
 await page.locator('#nav-prev-case').click();assert.equal(await page.locator('#detail-toolbar-id').innerText(),initialId);
 await page.locator('.reader-nav').scrollIntoViewIfNeeded();
 const toolbarVisible=await page.locator('#close-detail').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight});assert.ok(toolbarVisible);
 await page.locator('.detail-source').click({trial:true});const source=await page.locator('.detail-source').getAttribute('href');
 const sourceStatus=width===1440?(await page.request.get(source)).status():null;if(width===1440)assert.equal(sourceStatus,200);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#detail').evaluate(n=>n.open),false);
 assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
 await page.goto(url);await page.locator('#detail[open]').waitFor();await page.reload();await page.locator('#detail[open]').waitFor();
 await page.locator('#close-detail').click();
 await page.locator('#query').fill('zzzz-no-match-8472');await page.locator('#empty:not([hidden])').waitFor();
 await page.locator('#empty-reset').click();await page.locator('#results .card').first().waitFor();
 await page.goto(base+'?case=UC-313');await page.locator('#detail[open]').waitFor();
 const shortcut=page.locator('.reader-method-shortcut');
 assert.equal(await shortcut.count(),1);
 {
  const targetId=await shortcut.getAttribute('aria-controls');
  await shortcut.click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),targetId);
  assert.ok(await page.evaluate(()=>document.activeElement.getBoundingClientRect().top>=document.querySelector('.detail-toolbar').getBoundingClientRect().bottom),'jump heading below toolbar');
 }
 await page.locator('.research-details').evaluate(n=>n.open=true);await page.locator('.related-cases').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('#detail').evaluate(n=>n.scrollWidth>n.clientWidth),false);
 assert.ok(await page.locator('.detail-toolbar-actions button').evaluateAll(ns=>ns.every(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth})));
 if(!process.env.OBSERVE){
  await page.locator('#detail-toolbar-id').evaluate(n=>n.textContent='UC-very-long-identifier-'.repeat(8));
  assert.equal(await page.locator('#detail').evaluate(n=>n.scrollWidth>n.clientWidth),false);
  await page.locator('#detail-toolbar-id').evaluate((n,id)=>n.textContent=id,'UC-313');
 }
 await page.locator('#copy-case-link').focus();await page.keyboard.press('Shift+Tab');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'close-detail');assert.equal(await page.locator('#close-detail').evaluate(n=>n.matches(':focus-visible')),true);
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 reports.push({engine,width,controls,toolbarVisible,source,sourceStatus,axe:axe.violations.map(v=>v.id),errors});
 assert.deepEqual(errors,[]);assert.deepEqual(axe.violations,[]);
 } finally { await browser.close(); }
 }
 fs.writeFileSync(`qa-artifacts/${process.env.LABEL}-report.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
})().catch(e=>{console.error(e);process.exitCode=1});
