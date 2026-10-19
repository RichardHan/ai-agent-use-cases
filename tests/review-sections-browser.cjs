'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.REVIEW_URL||'http://127.0.0.1:8100/ai-agent-use-cases/';
const observe=process.env.REVIEW_OBSERVE==='1';
const output=process.env.REVIEW_OUTPUT||'qa-artifacts/review-sections';
fs.mkdirSync(output,{recursive:true});
const reports=[];
const save=()=>fs.writeFileSync(`${output}/${observe?'before':'verification'}.json`,JSON.stringify(reports,null,2));
(async()=>{
 for(const [engine,launcher] of (observe?[['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]])){
 const browser=await launcher.launch();try{
 for(const [size,width,height] of engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
 page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(45000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const r={engine,size,audits:[]};reports.push(r);save();
 const ready=()=>page.waitForFunction(()=>discoveryReady,{},{timeout:60000});
 const shot=label=>page.screenshot({path:`${output}/${observe?'before':'after'}-${label}-${engine}-${size}.jpg`,type:'jpeg',quality:80});
 const audit=async label=>{const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();r.audits.push({label,violations:a.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))});save();assert.equal(a.violations.length,0,JSON.stringify(a.violations));};
 // 1. First visit -> problem search -> combined filter -> empty -> reading -> return.
 await page.goto(origin);await ready();r.total=await page.locator('#results-count').innerText();await shot('home');
 await page.locator('#query').fill('旅遊');await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');
 assert(await page.locator('#results .card').count()>0);await page.locator('#query').fill('review-no-results-98765');assert(await page.locator('#empty').isVisible());
 await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(e=>e===document.activeElement));await page.locator('#query').fill('旅遊');
 const read=page.locator('#results .card .card-bottom button').first();await read.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();await page.keyboard.press('Escape');assert(await read.evaluate(e=>e===document.activeElement));assert.equal(await page.locator('#scenario').inputValue(),'生活');
 // 2. Shared case -> later source version -> limitations, preserving original text and URL.
 await page.goto(origin+'?case=UC-024');await page.locator('#detail[open]').waitFor();await ready();await shot('detail');
 r.headings=await page.locator('.markdown h2,.markdown h3').allTextContents();r.primary=await page.locator('.reader-jump').allTextContents();r.researchLength=(await page.locator('.markdown').textContent()).length;
 await page.locator('.reader-nav').scrollIntoViewIfNeeded();await shot('nav');
 r.reviewCount=await page.locator('.reader-review-jump').count();save();
 if(!observe){
  assert(r.reviewCount>1);assert(!(await page.locator('.reader-review').evaluate(e=>e.open)));
  const summary=page.locator('.reader-review > summary');await summary.focus();await page.keyboard.press('Enter');assert(await page.locator('.reader-review').evaluate(e=>e.open));await shot('expanded');
  assert.match(await page.locator('.reader-review').innerText(),/不是獨立驗證/);
  const later=page.locator('.reader-review-jump').filter({hasText:'Grok Bot貨運版本'});assert.equal(await later.count(),1);
  const target=await later.getAttribute('aria-controls'),url=page.url();await later.focus();await page.keyboard.press('Enter');assert.equal(page.url(),url);assert.equal(await page.evaluate(()=>document.activeElement.id),target);
  const bounds=await page.evaluate(id=>({top:document.getElementById(id).getBoundingClientRect().top,toolbarBottom:document.querySelector('.detail-toolbar').getBoundingClientRect().bottom}),target);assert(bounds.top>=bounds.toolbarBottom);assert(bounds.top<height);
  assert.match(await page.locator('.markdown').innerText(),/金額錯誤、漏存文件/);await shot('version');await audit('later source version');
  const source=page.locator('#'+target+' ~ p a').filter({hasText:'Reddit'}).first();
  r.sourceHref=await source.getAttribute('href');assert.match(r.sourceHref,/^https:\/\/www.reddit.com\//);
  if(engine==='chromium'&&size==='desktop'){
   const popupPromise=page.waitForEvent('popup');await source.click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded').catch(()=>{});r.sourceOpened=popup.url();assert(r.sourceOpened.includes('reddit.com'));await popup.close();
  }
  await page.locator('#'+target+' + .reader-return').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-nav-title');
  const controls=await page.locator('.reader-review-jump').evaluateAll(es=>es.map(e=>({id:e.getAttribute('aria-controls'),height:e.getBoundingClientRect().height,exists:!!document.getElementById(e.getAttribute('aria-controls'))})));assert(controls.every(e=>e.exists&&e.height>=44));r.controls=controls;
  await page.reload();await page.locator('#detail[open]').waitFor();await ready();assert.equal(page.url(),url);await page.locator('#close-detail').click();assert.equal(new URL(page.url()).searchParams.has('case'),false);
 }
 // 3. Unlinked evidence gap, long research, and literal unsafe-looking heading rendering.
 await page.goto(origin+'?case=UC-338');await page.locator('#detail[open]').waitFor();await ready();
 if(!observe){
  await page.locator('.reader-review > summary').click();const gap=page.locator('.reader-review-jump').filter({hasText:'驗收與可重現性'});assert.equal(await gap.count(),1);await gap.click();assert.match(await page.locator('.markdown').innerText(),/沒有截圖、紀錄表、班表或薪資單比對結果/);await audit('unlinked evidence gap');
  assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth));
  // DOM is text-only, never inject raw titles into the index.
  await page.evaluate(()=>{const body=document.getElementById('detail-body');body.querySelector('.markdown').innerHTML='<h2>&lt;img src=x onerror=alert(1)&gt; 權限（未驗證）</h2><p>原始限制。</p>';CaseReader.enhance(body,{kind:'pending'});});
  assert.equal(await page.locator('.reader-review-jump img').count(),0);assert((await page.locator('.reader-review-jump').allTextContents()).some(s=>s.includes('<img src=x onerror=alert(1)>')));
 }
 assert.deepEqual(errors,[]);r.complete=true;save();await context.close();
 }
 }finally{await browser.close();}
 }
 console.log(JSON.stringify(reports,null,2));
})().catch(e=>{save();console.error(e);process.exitCode=1;});
