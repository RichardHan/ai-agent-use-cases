'use strict';
const sourceRoute=require('./source-route.cjs');
const {chromium}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.RELATED_URL||'http://127.0.0.1:8088/ai-agent-use-cases/';
const live=process.env.RELATED_LIVE==='1';
const {skipIfSupersededPublishedUrl}=require('../scripts/published-check.cjs');
if(live&&skipIfSupersededPublishedUrl(origin)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
(async()=>{
 if(live){
  for(const path of ['assets/app.js','assets/reader.css']){
   let matched=false;
   for(let i=0;i<60;i++){
    const response=await fetch(origin+path+'?related-qa='+Date.now(),{cache:'no-store'});
    if(response.ok&&await response.text()===fs.readFileSync(path,'utf8')){matched=true;break;}
    await new Promise(r=>setTimeout(r,5000));
   }
   assert(matched,'Published asset matches commit: '+path);
  }
 }
 const browser=await chromium.launch();fs.mkdirSync('qa-artifacts',{recursive:true});const report=[];
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const audit=async label=>{
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   assert.deepEqual(result.violations,[],label+' axe violations');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page horizontal overflow');
   if(await page.locator('#detail').evaluate(n=>n.open))assert(await page.locator('#detail').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'dialog horizontal overflow');
   report.push({name,label,axeViolations:result.violations.length});
  };
  const checkRelated=async()=>{
   const actual=await page.evaluate(()=>({
    ids:[...document.querySelectorAll('.related-open')].map(n=>n.closest('li').querySelector('.related-meta').textContent.split(' · ')[0]),
    current:currentDetailItem.id,category:currentDetailItem.category,
    pool:currentFiltered.map(e=>({id:e.id,category:e.category,kind:e.kind}))
   }));
   assert(actual.ids.length<=3);assert(!actual.ids.includes(actual.current));
   for(const id of actual.ids)assert(actual.pool.some(e=>e.id===id&&e.kind==='case'&&e.category===actual.category));
   return actual.ids;
  };
  // Scenario 1: find a travel method, compare a same-topic method, return to the original results.
  const started=Date.now();
  const served=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/assets/app.js'));
  await page.goto(origin+'?q=旅遊&tool=Grok%20Bot',{waitUntil:'networkidle'});
  await page.locator('#results .card').first().waitFor();
  if(live)assert.equal(await (await served).text(),fs.readFileSync('assets/app.js','utf8'),'Browser receives deployed app asset');
  report.push({name,label:'load',elapsedMs:Date.now()-started,failed:await page.evaluate(()=>failedPaths.length)});
  assert.equal(await page.evaluate(()=>failedPaths.length),0);
  const resultIDs=await page.locator('#results .card').evaluateAll(es=>es.map(e=>e.dataset.caseId));
  await page.screenshot({path:`qa-artifacts/related-after-search-${name}.png`});
  await page.locator('#results .card .card-bottom button').first().click();
  await page.screenshot({path:`qa-artifacts/related-after-top-${name}.png`});
  const firstID=await page.locator('#detail-toolbar-id').innerText();
  const suggestions=await checkRelated();assert(suggestions.length>0);
  await page.locator('.related-cases').scrollIntoViewIfNeeded();await audit('travel-related');
  await page.screenshot({path:`qa-artifacts/related-after-detail-${name}.png`});
  await page.locator('.related-open').first().focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#detail-toolbar-id').innerText(),suggestions[0]);
  assert(await page.locator('#detail-title').evaluate(n=>n===document.activeElement));
  assert.equal(new URL(page.url()).searchParams.get('q'),'旅遊');
  await page.goBack();await page.waitForFunction(id=>document.getElementById('detail-toolbar-id').textContent===id,firstID);
  await page.locator('.related-open').first().click();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert.deepEqual(await page.locator('#results .card').evaluateAll(es=>es.map(e=>e.dataset.caseId)),resultIDs);
  assert(await page.locator('#results .card .card-bottom button').first().evaluate(n=>n===document.activeElement));
  // Live smoke uses two corpus loads per viewport; boundary repetitions stay on preview.
  if(live){
   await page.goto(origin+'?case=UC-005',{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
   assert.equal(await page.locator('#detail-toolbar-id').innerText(),'UC-005');
   assert.equal(await page.evaluate(()=>failedPaths.length),0);
   await checkRelated();await page.locator('.related-cases').scrollIntoViewIfNeeded();await audit('live-direct');
   await page.locator('.related-back').click();
   await page.locator('#query').fill('no-matching-case-123');assert(await page.locator('#empty').isVisible());
   await audit('live-empty');assert.deepEqual(errors,[]);await context.close();continue;
  }
  // Scenario 2: a shared long article, reload, source inspection, and a deliberately sparse search.
  await page.goto(origin+'?case=UC-005',{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
  await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
  await checkRelated();await page.locator('.related-cases').scrollIntoViewIfNeeded();await audit('long-direct');
  assert.match(await page.locator('#nav-next-case').getAttribute('aria-label'),/下一則案例：.+/);
  await page.locator('.research-details summary').click();
  assert(await page.locator('.research-details .markdown a[href^="https:"]').count());
  await page.goto(origin+'?q=UC-005&case=UC-005',{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
  assert.equal(await page.locator('.related-open').count(),0);assert(await page.locator('.related-empty').isVisible());
  await page.locator('.related-back').click();assert(!await page.locator('#detail').evaluate(n=>n.open));
  for(const q of ['no-matching-case-123','UC-005']){
   await page.goto(origin+'?q='+q+'&case=UC-001',{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
   assert(await page.locator('#nav-next-case').isDisabled());assert(await page.locator('#nav-prev-case').isDisabled());
   await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');
   assert.equal(await page.locator('#detail-toolbar-id').innerText(),'UC-001');
   assert.equal(await page.locator('.related-open').count(),0);
  }
  await page.locator('.related-cases').scrollIntoViewIfNeeded();await audit('no-related');
  await page.screenshot({path:`qa-artifacts/related-after-empty-${name}.png`});
  // Scenario 3: cross-search history must rebuild suggestions from the restored URL, not stale results.
  await page.goto(origin+'?q=旅遊&tool=Grok%20Bot',{waitUntil:'networkidle'});await page.locator('#results .card').first().waitFor();
  await page.locator('#results .card .card-bottom button').first().click();
  const historyID=await page.locator('#detail-toolbar-id').innerText();
  await page.locator('.related-open').first().click();await page.keyboard.press('Escape');
  if(!await page.locator('#tool').isVisible())await page.locator('#filter-summary').click();
  await page.locator('#tool').selectOption('');await page.locator('#query').fill('開發');
  await page.locator('#results .card .card-bottom button').first().click();
  await page.goBack();await page.waitForFunction(()=>!document.getElementById('detail').open);
  await page.goBack();await page.waitForFunction(id=>document.getElementById('detail').open&&document.getElementById('detail-toolbar-id').textContent===id,historyID);
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');assert((await checkRelated()).length);
  await page.locator('.related-back').click();
  assert(await page.locator('#results [data-case-id="'+historyID+'"] .card-bottom button').evaluate(n=>n===document.activeElement),'Cross-search history returns focus to original A opener');
  await page.locator('#query').fill('no-matching-case-123');assert(await page.locator('#empty').isVisible());
  await audit('empty-results');assert.deepEqual(errors,[]);
  // A delayed background retry must update suggestions without losing dialog focus.
  let recovered=false,release;
  const waiting=new Promise(resolve=>release=resolve);
  await page.route('**/catalog.json',r=>r.fulfill({json:{files:['cases/a.md','cases/b.md']}}));
  const fixture=id=>'# UC-'+id+'：測試用案例（合成資料）\n\n- 分類：測試主題\n- 情境：生活\n- 標籤：測試\n- 來源證據：自設未測\n\n## 方法\n\n僅供自動驗收。';
  await sourceRoute(page,'**/cases/a.md',r=>r.fulfill({body:fixture('991')}));
  await sourceRoute(page,'**/cases/b.md',async r=>{
   if(!recovered)return r.fulfill({status:503,body:'test unavailable'});
   await waiting;await r.fulfill({body:fixture('992')});
  });
  await page.goto(origin,{waitUntil:'networkidle'});await page.locator('#results .card').first().waitFor();
  recovered=true;
  const request=page.waitForRequest(r=>r.url().endsWith('/cases/b.md'));
  await page.locator('#retry-failed').click();await request;
  await page.locator('#results .card .card-bottom button').first().click();
  assert.equal(await page.locator('.related-open').count(),0);
  await page.locator('.related-back').focus();release();
  await page.waitForFunction(()=>document.querySelectorAll('.related-open').length===1);
  assert.equal(await page.locator('.related-open').innerText(),'測試用案例（合成資料）');
  assert(await page.locator('.related-back').evaluate(n=>n===document.activeElement),'Recovery preserves related control focus');
  await audit('recovered-related');
  await context.close();
 }
 await browser.close();fs.writeFileSync('qa-artifacts/related-'+(live?'live':'after')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
