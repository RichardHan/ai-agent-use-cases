'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8170/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/context',observe=process.env.QA_OBSERVE==='1';fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];
for(const [engine,width] of (observe?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();const label=engine.name()+'-'+width,row={label,states:[],errors:[]};rows.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 const caseTitle=async()=>assert.equal(await page.title(),await page.locator('#detail-toolbar-id').innerText()+' · '+await page.locator('#detail-title').innerText()+'｜AI 用法實驗室');
 const state=async name=>{if(!observe&&['detail','empty'].includes(name)){const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();(row.stateAudits||=[]).push({name,violations:scan.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))});assert.equal(scan.violations.length,0);}row.states.push({name,title:await page.title(),url:page.url(),heading:await page.locator('#detail').evaluate(n=>n.open)?await page.locator('#detail-title').innerText():await page.locator('#results-count').innerText()});await page.screenshot({path:`${out}/${name}-${label}.png`});fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));};
 try{
 await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.evaluate(()=>failedPaths.length),0);row.total=await page.evaluate(()=>entries.length);if(!observe)assert.equal(await page.title(),'AI 用法實驗室 · 案例庫');await state('home');
 await page.locator('.hero-search-link').click();await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(n=>n.open=true);await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');if(!observe)assert.equal(await page.title(),'搜尋「旅遊」 · 生活 · Grok Bot｜AI 用法實驗室');await state('search');
 const read=page.locator('#results .card .card-bottom button').first();await read.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();row.case=await page.locator('#detail-toolbar-id').innerText();if(!observe)await caseTitle();await state('detail');
 await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();if(!observe)await caseTitle();await state('source');const source=page.locator('.markdown a[href^="https:"]').first();row.source=await source.getAttribute('href');
 if(width===1440){const popupEvent=page.waitForEvent('popup');await source.click();const popup=await popupEvent;await popup.waitForLoadState('domcontentloaded',{timeout:15000}).catch(()=>{});row.openedSource=popup.url();await popup.close();}
 await page.keyboard.press('Escape');assert(await read.evaluate(n=>n===document.activeElement));if(!observe)assert.equal(await page.title(),'搜尋「旅遊」 · 生活 · Grok Bot｜AI 用法實驗室');await state('returned');
 await page.locator('#query').fill('no-page-context-qa-result');await page.locator('#empty').waitFor({state:'visible'});if(!observe)assert((await page.title()).startsWith('沒有符合結果 · 搜尋「no-page-context-qa-result」'));await state('empty');await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(n=>n===document.activeElement));
 if(!observe){
 // Scenario 2: bookmarks, history traversal and every close action retain context.
 await page.locator('#empty-reset').click();assert.equal(await page.title(),'AI 用法實驗室 · 案例庫');
 await page.locator('#guide-options [data-scenario="工作"]').click();assert.equal(await page.title(),'篩選案例 · 工作｜AI 用法實驗室');
 await page.locator('#draw-case').click();assert.equal(await page.title(),'篩選案例 · 工作｜AI 用法實驗室');
 await page.goto(base+'?q=旅遊&scenario=生活&tool=Grok+Bot&case=UC-001');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);await caseTitle();
 await page.locator('#nav-next-case').click();await caseTitle();row.nextCase=await page.locator('#detail-toolbar-id').innerText();assert.notEqual(row.nextCase,'UC-001');
 await page.goBack();await page.waitForFunction(()=>document.querySelector('#detail-toolbar-id').textContent==='UC-001');await caseTitle();
 await page.goForward();await page.waitForFunction(id=>document.querySelector('#detail-toolbar-id').textContent===id,row.nextCase);await caseTitle();
 await page.locator('#nav-prev-case').click();await caseTitle();assert.equal(await page.locator('#detail-toolbar-id').innerText(),'UC-001');
 await page.reload();await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);await caseTitle();
 await state('bookmark');await page.locator('#close-detail').click();assert.equal(await page.title(),'搜尋「旅遊」 · 生活 · Grok Bot｜AI 用法實驗室');
 await page.locator('#results .card .card-bottom button').first().click();await caseTitle();await page.goBack();await page.waitForFunction(()=>!document.querySelector('#detail').open);assert.equal(await page.title(),'搜尋「旅遊」 · 生活 · Grok Bot｜AI 用法實驗室');
 await page.goForward();await page.locator('#detail[open]').waitFor();await caseTitle();
 await page.mouse.click(2,2);await page.waitForFunction(()=>!document.querySelector('#detail').open);assert.equal(await page.title(),'搜尋「旅遊」 · 生活 · Grok Bot｜AI 用法實驗室');
 // A missing shared case is not a successful detail; dismissal restores search.
 await page.goto(base+'?case=UC-999999&q=旅遊');await page.locator('#missing-case').waitFor({state:'visible'});assert.equal(await page.title(),'找不到分享案例 · 搜尋「旅遊」｜AI 用法實驗室');await state('missing');
 await page.locator('#dismiss-missing-case').click();assert.equal(await page.title(),'搜尋「旅遊」｜AI 用法實驗室');
 // A literal long input cannot create markup and still keeps a useful title.
 await page.locator('#query').fill('<script>👩🏽‍💻</script>'+ '旅'.repeat(150));assert((await page.title()).includes('…'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#empty-reset').click();assert.equal(await page.title(),'AI 用法實驗室 · 案例庫');
 row.historyAndBookmarks=true;
 }
 row.violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));assert.deepEqual(row.violations,[]);assert.deepEqual(row.errors,[]);console.log('PASS '+label);
 }catch(e){row.failure=e.stack;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));await browser.close();}
}
if(!observe){
 const browser=await chromium.launch(),lifecycle=[];
 for(const mode of ['loading-early','error','partial']){
  const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();const row={mode};lifecycle.push(row);let releaseCatalog,releaseSources;
  const catalogGate=new Promise(r=>releaseCatalog=r),sourceGate=new Promise(r=>releaseSources=r);
  try{
  if(mode==='loading-early'){
   await page.route('**/catalog.json',async route=>{await catalogGate;await route.continue();});
   await page.route('**/*.md',async route=>{if(/\/(cases|evidence)\//.test(new URL(route.request().url()).pathname)&&!route.request().url().includes('/001-travel-checkout.md'))await sourceGate;await route.continue();});
  }
  if(mode==='error')await page.route('**/catalog.json',route=>route.abort());
  if(mode==='partial')await page.route('**/cases/001-travel-checkout.md',route=>route.abort());
  await page.goto(base+'?q=旅遊&case=UC-001');
  if(mode==='loading-early'){
   await page.waitForFunction(()=>document.title.startsWith('載入中'));row.loadingTitle=await page.title();assert.equal(row.loadingTitle,'載入中 · 搜尋「旅遊」｜AI 用法實驗室');
   releaseCatalog();await page.locator('#detail[open]').waitFor();row.earlyTitle=await page.title();assert(row.earlyTitle.startsWith('UC-001 · '));releaseSources();
  }
  if(mode==='error'){
   await page.locator('#error').waitFor({state:'visible'});row.errorTitle=await page.title();assert.equal(row.errorTitle,'載入失敗 · 搜尋「旅遊」｜AI 用法實驗室');await page.unroute('**/catalog.json');await page.locator('#retry').click();
  }
  if(mode==='partial'){
   await page.waitForFunction(()=>discoveryReady);row.partialTitle=await page.title();assert.equal(row.partialTitle,'已載入內容 · 搜尋「旅遊」｜AI 用法實驗室');assert(await page.locator('#partial-load').isVisible());await page.unroute('**/cases/001-travel-checkout.md');await page.locator('#retry-failed').click();await page.waitForFunction(()=>!recoveringSources&&failedPaths.length===0);
  }
  await page.waitForFunction(()=>discoveryReady);await page.locator('#detail[open]').waitFor();assert.equal(await page.title(),'UC-001 · '+await page.locator('#detail-title').innerText()+'｜AI 用法實驗室');row.finalTitle=await page.title();
  await page.keyboard.press('Escape');assert.equal(await page.title(),'搜尋「旅遊」｜AI 用法實驗室');row.passed=true;
  }catch(e){row.failure=e.stack;throw e;}finally{releaseCatalog();releaseSources();fs.writeFileSync(out+'/lifecycle.json',JSON.stringify(lifecycle,null,2));await context.close();}
 }
 await browser.close();
}
})().catch(e=>{console.error(e);process.exit(1)});
