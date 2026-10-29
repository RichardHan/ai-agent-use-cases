"use strict";
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8140/ai-agent-use-cases/';
const observe=process.env.OBSERVE==='1',out=process.env.QA_OUT||'qa-artifacts/targets';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const reports=[];const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(reports,null,2));
 for(const [engine,width] of (observe?[[chromium,1440],[chromium,390],[chromium,320]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
  const label=engine.name()+'-'+width,row={label,errors:[],measurements:[],audits:[]};reports.push(row);page.on('pageerror',e=>row.errors.push(e.message));
  const tab=engine.name()==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab';
  const backTab=engine.name()==='webkit'&&process.platform==='darwin'?'Alt+Shift+Tab':'Shift+Tab';
  const shot=name=>page.screenshot({path:`${out}/${name}-${label}.png`});
  const measure=async selector=>{const dimensions=await page.locator(selector).evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {text:n.textContent,width:r.width,height:r.height,font:parseFloat(s.fontSize)};}));row.measurements.push({selector,dimensions});save();return dimensions;};
  const check=dimensions=>{if(observe)return;for(const d of dimensions){assert(d.height>=44&&d.width>=44,`44px target: ${JSON.stringify(d)}`);assert(d.font>=14,`14px control text: ${JSON.stringify(d)}`);}};
  const audit=async name=>{const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);row.audits.push({name,violations});save();assert.deepEqual(violations,[]);};
  await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});row.entries=await page.evaluate(()=>entries.length);row.failed=await page.evaluate(()=>failedPaths);assert.deepEqual(row.failed,[]);
  // Stable real card for comparable screenshots, without adding or editing case data.
  await page.evaluate(()=>{const item=entries.find(e=>e.id==='UC-001');discoveryDeck=Discovery.createDeck([item]);drawNext();});
  await page.locator('#drawn-case').scrollIntoViewIfNeeded();await shot('inspiration');
  check(await measure('#drawn-case h3 button, #drawn-case .tag, #drawn-case .card-bottom button'));
  // 1. Search by a problem and combine a scenario, then use keyboard to read and return.
  await page.locator('#query').click();await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(n=>n.open=true);await page.locator('#scenario').selectOption('生活');await page.locator('#search-submit').click();
  row.tagStates=await page.locator('#results .card').first().evaluate(n=>({selected:getComputedStyle(n.querySelector('.tag-scenario')).backgroundColor,ordinary:getComputedStyle(n.querySelector('.tag-interactive')).backgroundColor}));assert.notEqual(row.tagStates.selected,row.tagStates.ordinary);row.filtered=await page.locator('#results-count').innerText();await page.locator('#results .card').first().scrollIntoViewIfNeeded();await shot('results');if(!observe){const tag=page.locator('#results .card .tag-interactive').first();row.hoverBefore=await tag.evaluate(n=>getComputedStyle(n).backgroundColor);await tag.hover();row.hoverAfter=await tag.evaluate(n=>getComputedStyle(n).backgroundColor);assert.notEqual(row.hoverBefore,row.hoverAfter);await page.mouse.move(0,0);}
  check(await measure('#results .card:first-child h3 button, #results .card:first-child .tag, #results .card:first-child .card-bottom button'));
  if(!observe){
   const read=page.locator('#results .card .card-bottom button').first();await read.focus();await page.keyboard.press(tab);await page.keyboard.press(backTab);row.focus=await read.evaluate(n=>({visible:n.matches(':focus-visible'),outline:getComputedStyle(n).outlineStyle,width:parseFloat(getComputedStyle(n).outlineWidth)}));assert(row.focus.visible&&row.focus.outline!=='none'&&row.focus.width>=2);await shot('keyboard-focus');await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();await shot('detail');const direct=page.url();
   await page.locator('.research-details').evaluate(n=>n.open=true);const source=page.locator('.markdown a[href^="https:"]').first();row.source=await source.getAttribute('href');
   if(label==='chromium-1440'){const pending=page.waitForEvent('popup');await source.click();const popup=await pending;await popup.waitForLoadState('domcontentloaded',{timeout:15000}).catch(()=>{});row.openedSource=popup.url();await popup.close();}
   await audit('detail');await page.keyboard.press('Escape');assert(await read.evaluate(n=>document.activeElement===n));
   // 2. Card tags refine the same result set with exact retained conditions and a visible focus.
   const tag=page.locator('#results .card .tag-interactive').first(),value=await tag.innerText();await tag.focus();await page.keyboard.press('Space');assert.equal(await page.locator('#query').inputValue(),value);assert.equal(await page.locator('#scenario').inputValue(),'生活');assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
   await page.keyboard.press(tab);assert.equal(await page.evaluate(()=>document.activeElement.id),'copy-search-link');await shot('refined');await audit('results');
   await page.goto(direct);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.locator('#detail[open]').waitFor();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.locator('#detail[open]').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
   for(const id of ['UC-341','P-003']){
    await page.evaluate(id=>{const item=entries.find(e=>e.id===id);if(!item)throw Error("Missing fixture "+id);document.getElementById('results').replaceChildren(card(item));},id);
    await page.locator('#results .card').scrollIntoViewIfNeeded();await shot('real-'+id);check(await measure('#results h3 button, #results .tag, #results .card-bottom button'));
   }
   // 3. An empty intersection explains recovery, then long labels wrap in both card placements.
   await page.locator('#query').fill('no-card-target-match-938451');await page.locator('#search-submit').click();assert(await page.locator('#empty').isVisible());await shot('empty');await page.locator('#edit-query').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');await page.locator('#empty-reset').click();assert(await page.locator('#results .card').count()>0);
   await page.evaluate(()=>{const item={...entries.find(e=>e.id==='UC-001'),title:'長標題與限制說明'.repeat(14),tags:['超長分類名稱'.repeat(16),'UnbrokenLabel'.repeat(20)],proof:'作者自述；未獨立重現；來源限制'.repeat(5)};for(const id of ['drawn-case','results'])document.getElementById(id).replaceChildren(card(item));});
   await page.locator('#results .tags').scrollIntoViewIfNeeded();await shot('long-labels');check(await measure('#results h3 button, #results .tag, #results .card-bottom button, #drawn-case .tag, #drawn-case .card-bottom button'));
   row.overflow=await page.evaluate(()=>({document:document.documentElement.scrollWidth>innerWidth+1,cards:[...document.querySelectorAll('.card')].map(n=>n.scrollWidth>n.clientWidth+1)}));assert.equal(row.overflow.document,false);assert(row.overflow.cards.every(v=>!v));
   await audit('long labels');assert.deepEqual(row.errors,[]);
  }
  row.navigation=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoadedMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd};});save();await context.close();await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
