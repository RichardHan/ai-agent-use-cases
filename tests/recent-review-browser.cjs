'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {ensureFiltersVisible}=require('./filter-controls.cjs');
const origin=process.env.RECENT_URL||'http://127.0.0.1:8131/ai-agent-use-cases/';
const output=process.env.RECENT_OUTPUT||'qa-artifacts/recent';
const baseline=process.env.RECENT_BASELINE==='1',live=process.env.RECENT_LIVE==='1';
const reports=[];
const root=require('node:path').resolve(__dirname,'..');
const sourceFiles=new Map(['cases','evidence'].flatMap(dir=>fs.readdirSync(root+'/'+dir,{recursive:true}).filter(file=>file.endsWith('.md')).map(file=>[dir+'/'+file,fs.readFileSync(root+'/'+dir+'/'+file,'utf8')])));
const pending=fs.readFileSync(root+'/sources/pending.md','utf8').split(/(?=^##\s+P-)/m).filter(part=>/^##\s+P-/.test(part));
async function verifyCorpus(page){
 const actual=await page.evaluate(()=>entries.map(e=>({id:e.id,path:e.path,markdown:e.markdown})));
 assert.equal(actual.length,sourceFiles.size+pending.length,'the served corpus includes every current entry');
 assert.deepEqual([...new Set(actual.map(e=>e.path))].sort(),[...sourceFiles.keys(),'sources/pending.md'].sort());
 assert.deepEqual(actual.filter(e=>e.path==='sources/pending.md').map(e=>e.id).sort(),pending.map(part=>part.match(/^##\s+(P-\d+)/)?.[1]).sort(),'all pending IDs occur exactly as recorded, including multiplicity');
 for(const entry of actual){
  const expected=entry.path==='sources/pending.md'?pending.find(part=>part.match(/^##\s+(P-\d+)/)?.[1]===entry.id):sourceFiles.get(entry.path);
  assert.equal(entry.markdown,expected,'served source matches checkout: '+entry.id);
 }
}
async function ready(page,suffix=''){
 await page.goto(origin+suffix);await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
 assert.deepEqual(await page.evaluate(()=>failedPaths),[],'all sources loaded');
 if(!baseline)await verifyCorpus(page);
}
async function audit(page,report,label){
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 report.audits.push({label,violations:scan.violations});assert.equal(scan.violations.length,0);
}
async function order(page){
 let actual=await page.locator('#results .card').evaluateAll(cards=>cards.map(c=>c.dataset.caseId));
 const matchingIDs=await page.evaluate(()=>filterEntries(entries,tokenize($('query').value),Object.fromEntries(['kind','tool','category','proof','scenario'].map(id=>[id,$(id).value]))).map(e=>e.id).sort());
 const expected=await page.evaluate(()=>orderEntries(filterEntries(entries,tokenize($('query').value),Object.fromEntries(['kind','tool','category','proof','scenario'].map(id=>[id,$(id).value]))),tokenize($('query').value),'reviewed').map(e=>e.id));
 // Results mount in batches. Exercise the reader's load-more action before
 // checking the complete corpus, and verify ordering at every batch boundary.
 const more=page.locator('#load-more-results');
 assert.deepEqual(actual,expected.slice(0,actual.length),'the visible batch follows reviewed order');
 while(await more.isVisible()){
  const previousCount=actual.length;
  await more.click();
  actual=await page.locator('#results .card').evaluateAll(cards=>cards.map(c=>c.dataset.caseId));
  assert(actual.length>previousCount,'load more appends results');
  assert.deepEqual(actual,expected.slice(0,actual.length),'each appended batch preserves reviewed order');
 }
 assert.deepEqual([...actual].sort(),matchingIDs,'sorting preserves every matching ID exactly once');
 assert.deepEqual(actual,expected);
 // Independently check dates descend, including unknown dates at the end.
 const dates=await page.locator('#results .review-date').evaluateAll(nodes=>nodes.map(n=>n.querySelector('time')?.dateTime||''));
 assert.deepEqual(dates,[...dates].sort().reverse());
}
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 for(const [name,type] of (live||baseline? [['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]])){
  const browser=await type.launch();
  try{
   const sizes=name==='chromium'?[['desktop',1440,1000],['mobile',390,844],...live||baseline?[]:[['small',320,740]]]:[['mobile',390,844]];
   for(const [size,width,height] of sizes){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',permissions:(name==='chromium'?['clipboard-read','clipboard-write']:[])});
    const page=await context.newPage(),report={engine:name,size,audits:[],errors:[]};reports.push(report);
    page.on('pageerror',e=>report.errors.push(e.message));
    try{
     await ready(page);
     report.entries=await page.evaluate(()=>entries.length);
     if(!baseline)report.corpusMatchesCheckout=true;
     await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
     await page.screenshot({path:`${output}/${name}-${size}-home.png`});
     if(baseline){
      await page.evaluate(()=>$('explore').scrollIntoView({block:'start',behavior:'instant'}));
      await page.screenshot({path:`${output}/${name}-${size}-results.png`});
      report.hasSort=await page.locator('#sort').count()===1;
      continue;
     }
     // 1. Returning reader finds recent reviews from home, without refetching.
     const timeOrigin=await page.evaluate(()=>performance.timeOrigin);
     await page.locator('#recent-entry').focus();await page.keyboard.press('Enter');
     assert.equal(await page.locator('#sort').inputValue(),'reviewed');
     assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
     assert.equal(await page.evaluate(()=>performance.timeOrigin),timeOrigin,'home entry keeps the same document');
     assert.equal(await page.evaluate(()=>location.href),new URL('?sort=reviewed#explore',origin).href);
     await order(page);assert.match(await page.locator('#search-order-note').innerText(),/正文補充不計/);
     await page.evaluate(()=>$('explore').scrollIntoView({block:'start',behavior:'instant'}));
     await page.screenshot({path:`${output}/${name}-${size}-recent.png`});await audit(page,report,'recent results');
     const firstID=await page.locator('#results .card').first().getAttribute('data-case-id');
     const read=page.locator('#results .card .card-bottom button').first();await read.click();
     await page.locator('#detail[open]').waitFor();assert.match(await page.locator('.detail-header-meta').innerText(),/頁首核對/);
     await page.screenshot({path:`${output}/${name}-${size}-detail.png`});await audit(page,report,'recent detail');
     await page.locator('#copy-case-link').click();
     if(name==='chromium'){const link=new URL(await page.evaluate(()=>navigator.clipboard.readText()));assert.equal(link.searchParams.get('sort'),'reviewed');assert.equal(link.searchParams.get('case'),firstID);}
     await page.goBack();await page.waitForFunction(()=>!$('detail').open);
     assert.equal(await page.evaluate(()=>document.activeElement.closest('.card')?.dataset.caseId),firstID);
     assert.equal(await page.locator('#sort').inputValue(),'reviewed');await order(page);
     // Article navigation adds history entries. Test its order separately from
     // the single-open native Back journey, then use the explicit close action.
     await read.click();
     const secondID=await page.locator('#results .card').nth(1).getAttribute('data-case-id');
     await page.locator('#nav-next-case').click();assert.equal(await page.locator('#detail-toolbar-id').innerText(),secondID);
     await page.locator('#nav-prev-case').click();assert.equal(await page.locator('#detail-toolbar-id').innerText(),firstID);
     await page.keyboard.press('Escape');
     assert.equal(await page.evaluate(()=>document.activeElement.closest('.card')?.dataset.caseId),firstID);
     // The select keeps focus; changing order does not redraw the discovery card.
     await ensureFiltersVisible(page);const drawn=await page.locator('#drawn-case').innerText();
     await page.locator('#sort').selectOption('');assert.equal(await page.locator('#drawn-case').innerText(),drawn);
     await page.locator('#sort').focus();await page.locator('#sort').selectOption('reviewed');
     assert.equal(await page.evaluate(()=>document.activeElement.id),'sort');assert.equal(await page.locator('#drawn-case').innerText(),drawn);
     // 2. A task query retains the same matches and facets under recent sorting.
     await page.locator('#query').fill('旅遊');await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');
     const ids=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId).sort());assert(ids.length>0);
     await page.locator('#sort').selectOption('');assert.deepEqual(await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId).sort()),ids);
     await page.locator('#sort').selectOption('reviewed');await order(page);
     assert.match(await page.locator('#filter-count').innerText(),/2 項/);
     const shared=await page.evaluate(()=>currentSearchLink());assert.equal(new URL(shared).searchParams.get('sort'),'reviewed');
     await page.locator('#copy-search-link').click();
     if(name==='chromium')assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),shared);
     await ready(page,new URL(shared).search+new URL(shared).hash);await order(page);
     assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
     await page.locator('#clear-facets').click();
     assert.equal(await page.locator('#sort').inputValue(),'reviewed');assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#tool').inputValue(),'');
     // The global home entry equals its real href even after a filtered search.
     await page.locator('#recent-entry').click();assert.equal(await page.locator('#query').inputValue(),'');assert.equal(await page.locator('#tool').inputValue(),'');
     assert.equal(await page.evaluate(()=>location.href),new URL('?sort=reviewed#explore',origin).href);
     // 3. Unknown dates, no matches and reset never imply verification or new cases.
     await page.locator('#query').fill('UC-239');assert.match(await page.locator('#results .card[data-case-id="UC-239"] .review-date').innerText(),/未提供/);
     await page.locator('#results .card[data-case-id="UC-239"] .card-bottom button').click();assert.match(await page.locator('.detail-header-meta').innerText(),/頁首未提供/);await page.keyboard.press('Escape');
     await page.locator('#query').fill('no-such-case-98182');assert(await page.locator('#empty').isVisible());assert.equal(await page.locator('#sort').inputValue(),'reviewed');
     await page.locator('#empty-reset').click();assert.equal(await page.locator('#sort').inputValue(),'');
     await page.goto(origin+'?sort=reviewed&case=UC-313');await page.locator('#detail[open]').waitFor({timeout:90000});
     await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
     await page.reload();await page.locator('#detail[open]').waitFor({timeout:90000});await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
     await verifyCorpus(page);
     assert.equal(await page.locator('#sort').inputValue(),'reviewed');
     assert.match(await page.locator('.reader-report-content').innerText(),/未證實實際重複寄送/);
     assert.equal(await page.locator('.reader-report-content a').first().getAttribute('href'),'https://github.com/openai/codex/issues/52208');
     await page.keyboard.press('Escape');await order(page);
     report.dateCoverage=await page.evaluate(()=>({known:entries.filter(e=>e.reviewedDate).length,unknown:entries.filter(e=>!e.reviewedDate).map(e=>e.id)}));
     assert.equal(await page.locator('#results .review-date time').count(),report.dateCoverage.known);
     assert.equal(await page.locator('#results .review-date').count(),report.dateCoverage.known+report.dateCoverage.unknown.length);
     report.journeys=['home recent + keyboard + native Back','task + facets + share + reload','unknown date + empty + reset + direct case'];
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     assert.deepEqual(report.errors,[]);
    }finally{await context.close();fs.writeFileSync(output+'/report.json',JSON.stringify(reports,null,2));}
   }
  }finally{await browser.close();}
 }
 if(baseline)assert(reports.every(r=>r.hasSort),'baseline reproduces missing recent-review control');
})().catch(e=>{console.error(e);process.exitCode=1;});
