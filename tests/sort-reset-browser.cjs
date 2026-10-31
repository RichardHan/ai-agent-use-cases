'use strict';
const sourceRoute=require('./source-route.cjs');
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SORT_URL||'http://127.0.0.1:8124/ai-agent-use-cases/',out=process.env.SORT_OUTPUT||'qa-artifacts/sort-reset',observe=process.env.SORT_OBSERVE==='1';
const reports=[];fs.mkdirSync(out,{recursive:true});const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(reports,null,2));
(async()=>{
 for(const [engine,width,height] of process.env.SORT_LIVE==='1'||observe?[[chromium,1440,1000],[chromium,390,844],[chromium,320,740]]:[[chromium,1440,1000],[chromium,390,844],[chromium,320,740],[firefox,390,844],[webkit,390,844]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
 const row={engine:engine.name(),width,errors:[],audits:[]};reports.push(row);save();page.on('pageerror',e=>row.errors.push(e.message));
 const ready=()=>page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
 const state=()=>page.evaluate(()=>({query:$('query').value,facets:Object.fromEntries(['scenario','kind','tool','category','proof'].map(id=>[id,$(id).value])),ids:currentFiltered.map(e=>e.id).sort(),draw:$('drawn-case').textContent}));
 const resetSort=page.locator('#reset-sort');
 const audit=async label=>{const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({label,violations:a.violations.map(v=>v.id)});save();assert.deepEqual(a.violations,[]);};
 // Returning visitor enters from home and can see and undo sorting with the panel closed.
 await page.goto(base);await ready();assert.deepEqual(await page.evaluate(()=>failedPaths),[]);
 await page.locator('#recent-entry').click();await page.locator('#filter-options').evaluate(e=>e.open=false);
 await page.locator('#filter-summary').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${observe?'before':'after'}-${engine.name()}-${width}.png`});
 row.summary=await page.locator('#filter-summary').innerText();row.resetCount=await resetSort.count();save();
 if(observe){await browser.close();continue;}
 assert.match(row.summary,/未設定篩選.*頁首最近核對/s);assert(await resetSort.isVisible());
 // Firefox protocol coordinates can subtract to 43.99997 for a 44px box.
 // Measure the DOM rectangle directly and retain the exact 44px contract.
 row.resetSize=await resetSort.evaluate(node=>({height:node.getBoundingClientRect().height,minHeight:getComputedStyle(node).minHeight}));save();assert(row.resetSize.height>=44);
 assert.match(await page.locator('#search-order-note').innerText(),/不是發布日.*不代表新增或獨立驗證/);
 await resetSort.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/after-action-${engine.name()}-${width}.png`});await audit('reviewed');
 const before=await state();await resetSort.focus();await page.keyboard.press('Enter');assert.deepEqual(await state(),before);
 assert.equal(await page.locator('#sort').inputValue(),'');assert.equal(new URL(page.url()).searchParams.has('sort'),false);assert(await resetSort.isHidden());
 assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
 assert(await page.locator('#results-count').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
 assert(await page.locator('#search-order-note').isHidden());
 assert.deepEqual(await page.evaluate(()=>currentFiltered.map(e=>e.id)),await page.evaluate(()=>rankEntries(entries,[]).map(e=>e.id)));
 // A task query with all five facets retains exactly its matches; sharing, direct reload and Back retain sorting.
 await page.locator('#query').fill('旅遊');
 await require('./filter-controls.cjs').ensureFiltersVisible(page);
 const facet=await page.evaluate(()=>{const e=currentFiltered.find(e=>e.id==='UC-001');return {scenario:e.scenario,kind:e.kind,tool:e.tools[0],category:e.category,proof:e.proof};});
 for(const [id,value] of Object.entries(facet))await page.locator('#'+id).selectOption(value);
 await page.locator('#sort').selectOption('reviewed');await page.locator('#filter-options').evaluate(e=>e.open=false);
 assert.match(await page.locator('#filter-count').innerText(),/5 項篩選.*頁首最近核對/);
 const shared=await page.evaluate(()=>currentSearchLink());assert.equal(new URL(shared).searchParams.get('sort'),'reviewed');
 await page.goto(shared);await ready();await page.locator('#results .card-bottom button').first().click();const direct=page.url();
 await page.reload();await ready();await page.locator('#detail[open]').waitFor();assert.equal(page.url(),direct);
 await page.locator('.research-details').evaluate(e=>e.open=true);
 row.source=await page.locator('.detail-source').getAttribute('href');
 if(engine===chromium&&width===1440){const popupWait=page.waitForEvent('popup');await page.locator('.detail-source').click();const popup=await popupWait;await popup.waitForLoadState('domcontentloaded');row.sourceOpened=popup.url();await popup.close();row.sourceStatus=(await page.request.get(row.source)).status();}
 await page.locator('#close-detail').click();assert.equal(await page.locator('#sort').inputValue(),'reviewed');
 await page.locator('#results .card-bottom button').first().click();await page.goBack();assert(!(await page.locator('#detail').evaluate(e=>e.open)));
 await page.locator('#filter-options').evaluate(e=>e.open=false);const combined=await state();await resetSort.click();assert.deepEqual(await state(),combined);
 assert.equal(await page.locator('#sort').inputValue(),'');assert.equal(new URL(page.url()).searchParams.has('sort'),false);
 assert.deepEqual(await page.evaluate(()=>currentFiltered.map(e=>e.id)),await page.evaluate(()=>rankEntries(filterEntries(entries,tokenize($('query').value),Object.fromEntries(['scenario','kind','tool','category','proof'].map(id=>[id,$(id).value]))),tokenize($('query').value)).map(e=>e.id)));
 // Clearing facets is distinct from changing order, even with zero matches and long user text.
 await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#sort').selectOption('reviewed');await page.locator('#filter-options').evaluate(e=>e.open=false);
 await page.locator('#clear-facets').click();assert.equal(await page.locator('#sort').inputValue(),'reviewed');
 await page.locator('#query').fill('沒有結果987 '+ '很長的任務描述'.repeat(25));assert(await page.locator('#empty').isVisible());
 const emptyBefore=await state();await audit('empty-reviewed');await resetSort.click();assert.deepEqual(await state(),emptyBefore);assert(await page.locator('#empty').isVisible());
 await page.locator('#empty-reset').click();assert.equal(await page.locator('#sort').inputValue(),'');assert(await page.locator('#search-order-note').isHidden());
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(row.errors,[]);row.journeys=['home recent then restore default','query + five facets + shared reload + source + Back','clear facets keeps sort; empty results restore only sort'];save();await browser.close();
 }
 if(!observe&&process.env.SORT_LIVE!=='1'){
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844}});
 let release;const gate=new Promise(r=>release=r);await page.route('**/catalog.json',async r=>{await gate;await r.continue();});
 await page.goto(base+'?sort=reviewed',{waitUntil:'domcontentloaded'});assert(await page.locator('#reset-sort').isHidden());release();await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});assert(await page.locator('#reset-sort').isVisible());
 await sourceRoute(page,'**/cases/001-*',r=>r.fulfill({status:503,body:'unavailable'}));await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});assert(await page.locator('#partial-load').isVisible());
 await page.locator('#reset-sort').click();assert(await page.locator('#partial-load').isVisible());await page.unroute('**/cases/001-*');await page.locator('#retry-failed').click();await page.waitForFunction(()=>!recoveringSources);assert(await page.locator('#partial-load').isHidden());
 await page.route('**/catalog.json',r=>r.fulfill({status:503,body:'unavailable'}));await page.goto(base+'?sort=reviewed');await page.locator('#error').waitFor();assert(await page.locator('#reset-sort').isHidden());await page.unroute('**/catalog.json');await page.locator('#retry').click();await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});assert(await page.locator('#reset-sort').isVisible());
 reports.push({states:'loading/partial failure/retry/total failure/retry',complete:true});save();await browser.close();
 }
})().catch(e=>{console.error(e);save();process.exit(1)});
