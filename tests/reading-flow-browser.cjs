'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.READING_URL||'http://127.0.0.1:8086/ai-agent-use-cases/';
const observe=!!process.env.READING_OBSERVE,live=!!process.env.READING_LIVE;
const prefix=observe?'before':live?'live':'after';
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const reports=[];
 const save=()=>fs.writeFileSync(`qa-artifacts/reading-${prefix}.json`,JSON.stringify(reports,null,2));
 const engines=observe||live?[['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]];
 for(const [engine,launch] of engines){
 const browser=await launch.launch();
 const views=engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]];
 for(const [size,width,height] of views){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.locator('#results .card').first().waitFor({timeout:60000});
  if(live)for(const file of ['assets/app.js','assets/reader.js','assets/reader.css'])assert.equal(await (await page.request.get(origin+file)).text(),fs.readFileSync(file,'utf8'),'published '+file);
  const report={engine,size,checks:[],audits:[]};reports.push(report);save();
  await page.screenshot({path:`qa-artifacts/reading-${prefix}-home-${engine}-${size}.png`});
  const audit=async state=>{
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   report.audits.push({state,violations:result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});save();
   assert.equal(result.violations.length,0,JSON.stringify(report.audits));
  };
  const open=async id=>{
   if(await page.locator('#detail').evaluate(e=>e.open))await page.keyboard.press('Escape');
   await require('./filter-controls.cjs').ensureFiltersVisible(page);
   await page.locator('#reset').click();await page.locator('#query').fill(id);
   await page.locator(`#results [data-case-id="${id}"] .card-bottom button`).click();
   await page.locator('#detail[open]').waitFor();
  };
  // 1. Find a travel method, intersect filters, recover from empty, return with keyboard focus.
  await page.locator('#query').fill('旅遊');
  await require('./filter-controls.cjs').ensureFiltersVisible(page);
  await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');
  assert((await page.locator('#results .card').count())>0);
  const read=page.locator('#results .card .card-bottom button').first();
  await read.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();
  await page.keyboard.press('Escape');assert(await read.evaluate(e=>e===document.activeElement));
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  await page.locator('#query').fill('no-matching-case-123');assert(await page.locator('#empty').isVisible());
  await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(e=>e===document.activeElement));
  report.checks.push('travel / combined filters / empty / keyboard return');
  // 2. Read a failure report without losing its uncertainty or unexecuted proposal.
  for(const id of ['UC-001','UC-313','UC-340','UC-338','UC-005']){
   await open(id);
   const measurements=await page.evaluate(()=>({purposeTop:Math.round(document.querySelector('.plain-overview').getBoundingClientRect().top),purposeBottom:Math.round(document.querySelector('.plain-overview').getBoundingClientRect().bottom),viewport:innerHeight,dialogTop:document.getElementById('detail').getBoundingClientRect().top,order:[...document.getElementById('detail-body').children].map(e=>e.className||e.tagName)}));
   report.checks.push({id,...measurements});save();
   await page.screenshot({path:`qa-artifacts/reading-${prefix}-${id}-${engine}-${size}.png`});
   if(observe)continue;
   assert(measurements.purposeTop<height,'purpose begins within first viewport');
   assert(await page.locator('.reader-guidance').evaluate(e=>!e.open));
   assert(await page.locator('.reader-report').evaluate(e=>!!(e.compareDocumentPosition(document.querySelector('.reader-guidance'))&Node.DOCUMENT_POSITION_FOLLOWING)));
   if(id==='UC-313'){
    const text=await page.locator('.reader-report-content').innerText();
    assert.match(text,/未證實實際重複寄送/);assert.match(text,/明示未執行/);
    assert.equal(await page.locator('.reader-report-content a').first().getAttribute('href'),'https://github.com/openai/codex/issues/52208');
    await page.locator('.reader-report-content').scrollIntoViewIfNeeded();
    await page.screenshot({path:`qa-artifacts/reading-${prefix}-report-${engine}-${size}.png`});
    await audit('failure report');
    if(engine==='chromium'&&size==='desktop'){
     const popupPromise=page.waitForEvent('popup');await page.locator('.reader-report-content a').first().click();
     const popup=await popupPromise;const response=await popup.waitForLoadState('domcontentloaded').then(()=>popup.url());
     report.externalSource={url:response};assert.equal(new URL(response).pathname,'/openai/codex/issues/52208');await popup.close();
    }
   }
   if(id==='UC-338')assert.match(await page.locator('.reader-report-content').innerText(),/沒有截圖、紀錄表、班表或薪資單比對結果/);
   const jump=page.locator('.reader-report-open').first(),target=await jump.getAttribute('aria-controls');
   const url=page.url();await jump.focus();await page.keyboard.press('Enter');
   assert(await page.locator('.research-details').evaluate(e=>e.open));assert.equal(page.url(),url);
   assert(await page.locator('#'+target).evaluate(e=>e===document.activeElement));
   await page.keyboard.press('Tab');assert(await page.locator('.reader-return').first().isVisible());
  }
  if(!observe){
   // 3. Share/reload a long case, inspect source versions, then compare a pending idea.
   const direct=page.url();await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor({timeout:60000});assert.equal(page.url(),direct);
   await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();
   assert(await page.locator('.research-details').evaluate(e=>e.open));
   await audit('long source versions');
   await open('P-003');assert.equal(await page.locator('.reader-report-content').count(),0);
   assert.match(await page.locator('.reader-evidence').innerText(),/待查/);
   await audit('pending idea');
   if(!live&&engine==='chromium'&&size==='desktop'){
    report.corpus=await page.evaluate(()=>{
     let promoted=0,skipped=0;
     for(const item of entries){
      showDetail(item,null,false);
      const preview=document.querySelector('.reader-report-content');
      if(!preview){skipped++;continue;}
      const title=document.querySelector('.reader-report').dataset.sectionTitle;
      const heading=[...document.querySelectorAll('.research-details .markdown>h2')].find(e=>e.textContent===title);
      const original=[];for(let n=heading.nextElementSibling;n&&n.tagName!=='H2';n=n.nextElementSibling)if(!n.classList.contains('reader-return'))original.push(n);
      const normalized=node=>node.textContent.replace(/↑ 回到閱讀導覽/g,'');
      if(preview.children.length!==original.length||[...preview.children].some((n,i)=>normalized(n)!==normalized(original[i])))throw Error('Incomplete section '+item.id);
      if(preview.querySelector('[id]'))throw Error('Duplicate ID '+item.id);
      for(const link of preview.querySelectorAll('a'))if(!/^https?:/.test(link.href)||link.rel!=='noopener noreferrer')throw Error('Unsafe link '+item.id);
      promoted++;
     }
     return {entries:entries.length,promoted,skipped};
    });
    await page.evaluate(()=>showDetail(metadata('# UC-999：長文字測試\n- 情境：工作\n## 作者實作與結果\n'+ '長'.repeat(3300)+'\n## 本庫建議流程\n未測','cases/fixture.md','case'),null,false));
    assert.equal(await page.locator('.reader-report-content').count(),0);
    await page.locator('.reader-report-open').click();assert(await page.locator('.research-details').evaluate(e=>e.open));
    await page.evaluate(()=>showDetail(metadata('# UC-999：安全文字測試\n- 情境：工作\n## 作者實作與結果\n<img src=x onerror="globalThis.injected=1"> [不安全](javascript:alert(1))\n## 限制\n未測','cases/fixture.md','case'),null,false));
    assert.equal(await page.locator('.reader-report img,.reader-report a').count(),0);assert.equal(await page.evaluate(()=>globalThis.injected),undefined);
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   assert.deepEqual(errors,[]);
   report.timing=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoadedMs:Math.round(n.domContentLoadedEventEnd),loadMs:Math.round(n.loadEventEnd)};});
  }
  save();await context.close();
 }
 await browser.close();
 }
 console.log(JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
