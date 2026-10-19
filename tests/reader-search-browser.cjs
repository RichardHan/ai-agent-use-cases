'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.READER_SEARCH_URL||'http://127.0.0.1:8098/ai-agent-use-cases/';
const observe=process.env.READER_SEARCH_OBSERVE==='1';
const output=process.env.READER_SEARCH_OUTPUT||'qa-artifacts/reader-search';
const engines=process.env.READER_SEARCH_ENGINES==='all'?[['chromium',chromium],['firefox',firefox],['webkit',webkit]]:[['chromium',chromium]];
const report={origin,observe,checks:[]};
fs.mkdirSync(output,{recursive:true});
function save(){fs.writeFileSync(`${output}/${observe?'before':'verification'}.json`,JSON.stringify(report,null,2));}
(async()=>{
 for(const [engine,launcher] of engines){const browser=await launcher.launch();try{
 for(const [size,width,height] of (engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]])){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(45000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check={engine,size,audits:[]};report.checks.push(check);save();
 const audit=async state=>{const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();check.audits.push({state,violations:r.violations.map(v=>v.id)});save();assert.equal(r.violations.length,0,JSON.stringify(r.violations));};
 // Journey 1: synonym -> original negative constraint -> keyboard return.
 const initialStart=Date.now(),initialResponse=await page.goto(origin+'?q=薪水');
 check.initialDocument={status:initialResponse?.status(),url:page.url(),contentType:initialResponse?.headers()['content-type']};save();
 assert.equal(initialResponse?.status(),200,'expected actual application HTML');
 try{
  // The app permits up to 20s for its initial corpus; wait for that lifecycle
  // before asserting a particular result, retaining the exact result assertion.
  await page.waitForFunction(()=>typeof discoveryReady!=='undefined'&&discoveryReady,null,{timeout:30000});
 }catch(error){check.initialFailure=await page.evaluate(()=>({url:location.href,hasSearch:!!document.getElementById('copy-search-link'),results:document.getElementById('results-count')?.textContent,load:document.getElementById('load-status')?.textContent}));save();throw error;}
 check.initialReady={elapsedMs:Date.now()-initialStart,failedPaths:await page.evaluate(()=>failedPaths)};save();
 await page.locator('#results .card[data-case-id="UC-024"]').waitFor();
 const trigger=page.locator('#results .card[data-case-id="UC-024"] .card-bottom button');await trigger.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);
 check.query=await page.locator('#query').inputValue();check.toolbarTargets=await page.locator('.detail-toolbar-actions button').evaluateAll(es=>es.map(e=>({height:e.getBoundingClientRect().height,fontSize:getComputedStyle(e).fontSize})));assert(check.toolbarTargets.every(e=>e.height>=44&&parseFloat(e.fontSize)>=14));check.originalResearchLength=(await page.locator('.markdown').textContent()).length;
 await page.screenshot({path:`${output}/${observe?'before':'after'}-${engine}-${size}.jpg`,type:'jpeg',quality:80});
 check.shortcutCount=await page.locator('.reader-search-jump').count();save();
 if(observe){await context.close();continue;}
 assert(check.shortcutCount>0,'search should continue into the original source section');
 assert.match(await page.locator('.reader-search').innerText(),/薪水.*薪資/s);
 assert.match(await page.locator('.reader-search').innerText(),/限制或否定/);
 const jump=page.locator('.reader-search-jump').first();const target=await jump.getAttribute('aria-controls');
 assert.match(await jump.innerText(),/自設只讀驗收（未實跑）/);
 assert((await jump.boundingBox()).height>=44);
 const beforeURL=page.url();await jump.focus();await page.keyboard.press('Enter');assert.equal(page.url(),beforeURL);
 assert(await page.locator('.research-details').evaluate(e=>e.open));
 assert.equal(await page.evaluate(()=>document.activeElement.id),target);
 check.targetBounds=await page.evaluate(id=>{const r=document.getElementById(id).getBoundingClientRect(),t=document.querySelector('.detail-toolbar').getBoundingClientRect();return {top:r.top,bottom:r.bottom,toolbarBottom:t.bottom,viewport:innerHeight};},target);
 assert(check.targetBounds.top>=check.targetBounds.toolbarBottom-1);assert(check.targetBounds.bottom<height);
 assert.match(await page.locator('.markdown').innerText(),/不登入系統、改派車、算薪資/);
 await page.screenshot({path:`${output}/target-${engine}-${size}.jpg`,type:'jpeg',quality:80});
 await audit('original negative constraint');
 await page.keyboard.press('Tab');const tabReachedReturn=await page.evaluate(()=>document.activeElement?.classList.contains('reader-return'));
 if(engine==='webkit'&&process.platform==='darwin'&&!tabReachedReturn){check.keyboardLimitation='macOS WebKit Tab skipped buttons; explicit focus + Enter verified';await page.locator('#'+target+' + .reader-return').focus();}else assert(tabReachedReturn,'Tab reaches source return button');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-nav-title');
 await page.keyboard.press('Escape');assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);assert.equal(await page.locator('#query').inputValue(),'薪水');
 // Journey 2: combined filters, empty results, direct link reload, back.
 await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(e=>e.open=true);await page.locator('#scenario').selectOption('生活');assert(await page.locator('#results .card').count()>0);
 await page.locator('#query').fill('no-reader-match-987654');assert(await page.locator('#empty').isVisible());await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(e=>e===document.activeElement));await page.locator('#query').fill('旅遊');
 await page.locator('#results .card .card-bottom button').first().click();const direct=page.url();await page.waitForFunction(()=>discoveryReady);await page.reload();await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);assert.equal(page.url(),direct);await page.locator('#close-detail').click();assert.equal(await page.locator('#scenario').inputValue(),'生活');assert.equal(await page.locator('#query').inputValue(),'旅遊');
 await page.locator('#results .card .card-bottom button').first().click();await page.goBack();await page.waitForFunction(()=>!document.querySelector('#detail').open);
 // Journey 3: No original match has no false route; query+case direct link retains contextual route.
 await page.goto(origin+'?q=no-original-match-987654&case=UC-024');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);assert.equal(await page.locator('.reader-search').count(),0);
 await page.goto(origin+'?case=UC-024');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);assert.equal(await page.locator('.reader-search').count(),0);
 await page.goto(origin+'?q=薪水&case=UC-024');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);assert(await page.locator('.reader-search-jump').count()>0);await page.waitForFunction(()=>discoveryReady);await page.reload();await page.locator('.reader-search-jump').first().waitFor();
 await audit('search contextual route');
 assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 check.sourceHref=await page.locator('.detail-source').getAttribute('href');assert.match(check.sourceHref,/cases\/024-missing-invoice-check.md$/);
 await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();
 const link=page.locator('.markdown a').first();check.externalHref=await link.getAttribute('href');assert.match(check.externalHref,/^https:\/\//);
 // Open the real source only once to avoid burdening external hosts.
 if(engine==='chromium'&&size==='desktop'){
 const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');check.externalOpened=popup.url();check.externalStatus=(await popup.request.get(popup.url())).status();await popup.close();}
 // Switching cases rebuilds routes from the current source; returning restores the original.
 const originalID=await page.locator('#detail-toolbar-id').innerText();const neighbor=await page.locator('#nav-next-case').isEnabled()?'#nav-next-case':'#nav-prev-case';await page.locator(neighbor).click();assert.notEqual(await page.locator('#detail-toolbar-id').innerText(),originalID);await page.locator(neighbor==='#nav-next-case'?'#nav-prev-case':'#nav-next-case').click();assert.equal(await page.locator('#detail-toolbar-id').innerText(),originalID);assert.match(await page.locator('.reader-search').innerText(),/薪水.*薪資/s);
 // Literal unsafe-looking and long source headings remain safe, with exact index routing.
 await page.evaluate(()=>{const item={...currentDetailItem,markdown:'# 測試\n## 同名\n第一段\n## 同名\nＡＰＩ <img src=x onerror=alert(1)>\n## '+('很長的來源限制'.repeat(60))+'\n其他'};document.getElementById('query').value='api';showDetail(item,null,false);});
 assert.equal(await page.locator('.reader-search img').count(),0);await page.locator('.reader-search-jump').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-section-1');assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 await page.evaluate(()=>{const item={...currentDetailItem,markdown:'# 測試\n## '+('很長的來源限制'.repeat(60))+'\nlong-source-key'};document.getElementById('query').value='long-source-key';showDetail(item,null,false);});assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.locator('.reader-search-jump').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-section-0');
 await page.evaluate(()=>{const item={...currentDetailItem,markdown:'# 測試\n- 特殊資料：頁首特有詞\n\n## 來源\n[公開來源](https://example.org/payroll)'};document.getElementById('query').value='頁首特有詞';showDetail(item,null,false);});
 await page.locator('.reader-search-jump').click();assert.equal(await page.evaluate(()=>document.activeElement.tagName),'SUMMARY');
 await page.evaluate(()=>{document.getElementById('query').value='payroll';showDetail(currentDetailItem,null,false);});await page.locator('.reader-search-jump').click();assert.match(await page.locator(':focus').innerText(),/來源/);
 await page.evaluate(()=>{const item={...currentDetailItem,title:'only-display-term',markdown:'# 測試\n沒有章節也沒有關鍵字'};document.getElementById('query').value='only-display-term';showDetail(item,null,false);});assert.equal(await page.locator('.reader-search').count(),0);
 await page.evaluate(()=>{document.getElementById('query').value='頁首資料';showDetail(currentDetailItem,null,false);});assert.equal(await page.locator('.reader-search').count(),0);
 await page.evaluate(()=>{const item={...currentDetailItem,markdown:'# 測試\n沒有章節的特有詞'};document.getElementById('query').value='特有詞';showDetail(item,null,false);});await page.locator('.reader-search-jump').click();assert.equal(await page.evaluate(()=>document.activeElement.tagName),'SUMMARY');
 await page.evaluate(()=>{const item={...currentDetailItem,markdown:'# 測試\n## 限制\n- 跨列\n- 命中'};document.getElementById('query').value='跨列命中';showDetail(item,null,false);});assert.equal(await page.locator('.reader-search').count(),0);
 assert.deepEqual(errors,[]);check.pageErrors=errors;check.complete=true;save();await context.close();
 }
 }finally{await browser.close();}}
 save();console.log(JSON.stringify(report,null,2));
})().catch(e=>{report.error=e.stack;save();console.error(e);process.exit(1);});
