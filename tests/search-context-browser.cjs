'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const {ensureFiltersVisible}=require('./filter-controls.cjs');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.MATCH_URL||'http://127.0.0.1:8084/ai-agent-use-cases/';
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const reports=[];
 for(const [engine,launch,views] of [['chromium',chromium,[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]],['firefox',firefox,[['mobile',390,844]]],['webkit',webkit,[['mobile',390,844]]]]){
  const browser=await launch.launch();
  for(const [name,width,height] of views){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin,{waitUntil:'networkidle'});
   await page.locator('#results .card').first().waitFor();
   assert.equal(await page.locator('.search-context').count(),0,'no extra block without a query');
   const report={engine,viewport:name,queries:[],audits:[]};
   // Journey 1: use everyday wording, inspect why a result matched, read and return.
   for(const q of ['薪水','收件匣','會議記錄']){
    const start=Date.now();await page.locator('#query').fill(q);
    report.queries.push(await page.evaluate(q=>({q,total:currentFiltered.length,explained:document.querySelectorAll('#results .search-context').length,ids:currentFiltered.map(e=>e.id)}),q));
    report.queries.at(-1).fillAndRenderMs=Date.now()-start;
    assert.equal(report.queries.at(-1).explained,report.queries.at(-1).total);
    assert.equal(await page.locator('#drawn-case .search-context').count(),0);
   }
   await page.locator('#query').fill('薪水');
   const first=page.locator('#results .card[data-case-id="UC-024"]');
   assert.match(await first.locator('.search-context').innerText(),/薪水.*薪資/);
   assert.match(await first.locator('.search-context-excerpt').innerText(),/不登入系統、改派車、算薪資/);
   assert.match(await first.locator('.search-context-label').innerText(),/原文/);
   await page.locator('#results-count').evaluate(e=>e.scrollIntoView({block:'start'}));
   await page.screenshot({path:'qa-artifacts/match-after-'+engine+'-'+name+'.jpg',type:'jpeg',quality:65});
   if(engine==='chromium'&&name!=='small-mobile')console.log('MATCH_IMAGE_after_'+name+'='+fs.readFileSync('qa-artifacts/match-after-'+engine+'-'+name+'.jpg').toString('base64'));
   const read=first.locator('.card-bottom button');
   await read.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();
   assert.equal(new URL(page.url()).searchParams.get('case'),'UC-024');
   await page.locator('.research-details summary').click();
   assert.match(await page.locator('.markdown').innerText(),/不登入系統、改派車、算薪資/);
   if(engine==='chromium'&&name==='desktop'){
    const href=await page.locator('.detail-source').getAttribute('href');
    const source=await context.newPage();
    try{
     const response=await source.goto(href,{waitUntil:'domcontentloaded'});
     const status=response?.status()||0;
     report.originalSource={href,status};
     assert(response?.ok()||status===429,'remote source must be reachable or rate-limited');
    }finally{
     await source.close();
    }
   }
   await page.keyboard.press('Escape');assert.equal(await read.evaluate(e=>e===document.activeElement),true);
   assert.equal(await page.locator('#query').inputValue(),'薪水');
   const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   report.audits.push({state:'synonym excerpt',violations:audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});
   assert.equal(audit.violations.length,0,JSON.stringify(report.audits));
   // Journey 2: intersect facets, recover from empty results, and retain terms.
   await page.locator('#query').fill('收件匣');await ensureFiltersVisible(page);
   await page.locator('#tool').selectOption('Grok Bot');await page.locator('#scenario').selectOption('工作');
   assert((await page.locator('#results .card').count())>0);
   await page.locator('#query').fill('unmatched-context-12345');assert(await page.locator('#empty').isVisible());
   assert.equal(await page.locator('#results .search-context').count(),0);
   await page.locator('#edit-query').click();assert.equal(await page.locator('#query').evaluate(e=>e===document.activeElement),true);
   await page.locator('#query').fill('收件匣');
   assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
   const ids=await page.locator('#results .card').evaluateAll(es=>es.map(e=>e.dataset.caseId));
   await page.locator('#results .card h3 button').first().click();
   const direct=page.url();await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
   assert.equal(page.url(),direct);await page.locator('#close-detail').click();
   assert.deepEqual(await page.locator('#results .card').evaluateAll(es=>es.map(e=>e.dataset.caseId)),ids);
   await page.locator('#results .card h3 button').first().click();await page.goBack();
   assert.equal(await page.locator('#detail').evaluate(e=>e.open),false);
   assert.equal(await page.locator('#query').inputValue(),'收件匣');
   // Journey 3: dispersed terms and untrusted/long original text remain readable text.
   await ensureFiltersVisible(page);await page.locator('#reset').click();
   await page.locator('#query').fill('旅遊 收件匣 權限');
   assert((await page.locator('#results .card').count())>0);
   assert(await page.locator('#results .search-context-more').first().isVisible());
   assert.equal(await page.locator('#results .card').first().locator('.search-context-match').count(),2);
   await page.evaluate(()=>{
    const item=metadata('# UC-999：測試\n- 情境：工作\n## 限制\n'+ '前'.repeat(200)+'不要把ＡＰＩ當成果。<img src=x onerror="globalThis.contextInjected=1">'+'尾'.repeat(200),'cases/fixture.md','case');
    document.getElementById('results').replaceChildren(card(item,['api']));
   });
   assert.equal(await page.locator('#results img').count(),0);assert.equal(await page.evaluate(()=>globalThis.contextInjected),undefined);
   assert.match(await page.locator('.search-context-excerpt').innerText(),/不要把ＡＰＩ當成果/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:'qa-artifacts/match-long-'+engine+'-'+name+'.jpg',type:'jpeg',quality:65});
   const audit2=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   report.audits.push({state:'long source text',violations:audit2.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});
   assert.equal(audit2.violations.length,0,JSON.stringify(report.audits));
   await page.locator('#query').fill('');assert.equal(await page.locator('.search-context').count(),0);
   assert.deepEqual(errors,[]);reports.push(report);
   console.log('MATCH_PASS='+JSON.stringify(report));
   await context.close();
  }
  await browser.close();
 }
 fs.writeFileSync('qa-artifacts/match-verification.json',JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
