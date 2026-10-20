'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {AxeBuilder}=require('@axe-core/playwright');
module.exports=async function mobileSearch({browser,origin,prefix='mobile-search',sizes=[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]}){
 const report=[];
 for(const [name,width,height] of sizes){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const started=Date.now();
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.locator('#results .card').first().waitFor();
  const row={viewport:name,readyMs:Date.now()-started};
  const disclosure=page.locator('#filter-options');
  assert.equal(await disclosure.count(),1,'Search must offer an optional filter panel');
  assert.equal(await disclosure.evaluate(n=>n.open),width>760);
  await page.evaluate(()=>document.getElementById('explore').scrollIntoView({block:'start'}));
  const shot=await page.screenshot({type:'jpeg',quality:75});
  fs.mkdirSync('qa-artifacts',{recursive:true});
  fs.writeFileSync('qa-artifacts/'+prefix+'-'+name+'.jpg',shot);
  console.log('VISUAL:'+prefix+'-'+name+':'+shot.toString('base64'));
  Object.assign(row,await page.evaluate(()=>{
   const box=id=>document.getElementById(id).getBoundingClientRect();
   return {searchFromHeading:Math.round(box('query').top-box('explore').top),firstResultFromSearch:Math.round(document.querySelector('#results .card').getBoundingClientRect().top-box('query').top)};
  }));
  if(width<=760){
   assert(row.searchFromHeading<160,'Search comes directly after the section heading');
   assert(row.firstResultFromSearch<240,'First result follows search without scrolling past unused controls');
   await page.locator('#query').focus();await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.id),'search-submit');
   await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.id),'filter-summary');
   await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.closest('#filter-options')===null),true,'Closed controls are skipped by Tab');
   await page.locator('#filter-summary').focus();
   await page.keyboard.press('Enter');
   assert.equal(await disclosure.evaluate(n=>n.open),true);
  }
  if(width<=760){
   const expanded=await page.screenshot({type:'jpeg',quality:75});
   fs.writeFileSync('qa-artifacts/'+prefix+'-expanded-'+name+'.jpg',expanded);
   console.log('VISUAL:'+prefix+'-expanded-'+name+':'+expanded.toString('base64'));
  }
  // Journey 1: a concrete task plus tool/evidence filters, then read and return.
  await page.locator('#query').fill('旅遊');
  await page.locator('#scenario').selectOption('生活');
  await page.locator('#tool').selectOption('Grok Bot');
  await page.locator('#category').selectOption('旅遊／消費研究');
  await page.locator('#proof').selectOption('作者報告／示範');
  assert.match(await page.locator('#filter-count').innerText(),/4/);
  const matches=await page.locator('#results .card').count();assert(matches>0);
  const filterURL=page.url();
  await page.locator('#filter-summary').focus();await page.keyboard.press('Space');
  assert.equal(await disclosure.evaluate(n=>n.open),false);
  assert.equal(page.url(),filterURL);
  assert.equal(await page.locator('#active-filters [data-remove-filter]').count(),5);
  await page.locator('#query').fill('旅遊');
  assert.equal(await disclosure.evaluate(n=>n.open),false,'Rendering does not reopen the panel');
  const trigger=page.locator('#results .card .card-bottom button').first();
  await trigger.click();const direct=page.url();
  await page.locator('#detail[open]').waitFor();
  await page.goBack();
  assert.equal(await trigger.evaluate(n=>document.activeElement===n),true);
  assert.equal(await disclosure.evaluate(n=>n.open),false);
  await page.goto(direct,{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
  await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
  await page.locator('#close-detail').click();
  assert.equal(page.url(),filterURL);
  assert.equal(await page.locator('#results .card').count(),matches);
  assert.match(await page.locator('#filter-count').innerText(),/4/);
  if(await disclosure.evaluate(n=>n.open))await page.locator('#filter-summary').click();
  await page.locator('#active-filters [data-remove-filter="tool"]').click();
  assert.match(await page.locator('#filter-count').innerText(),/3/);
  assert.equal(await disclosure.evaluate(n=>n.open),false);
  // Journey 2: no results can be recovered while filters stay closed.
  await page.locator('#filter-summary').click();
  await page.locator('#scenario').selectOption('開發');
  await page.locator('#filter-summary').click();
  assert.equal(await page.locator('#empty').isVisible(),true);
  await page.locator('#empty-suggestions [data-remove-filter="scenario"]').click();
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert.equal(await disclosure.evaluate(n=>n.open),false);
  assert((await page.locator('#results .card').count())>0);
  await page.locator('#clear-facets').click();
  assert.match(await page.locator('#filter-count').innerText(),/未設定/);
  // Journey 3: common tasks, pending content, long input, and keyboard reset.
  await page.locator('#filter-summary').click();
  await page.locator('#reset').click();
  await page.locator('.chip[data-query="收件匣"]').click();
  assert.equal(await page.locator('#query').inputValue(),'收件匣');
  assert((await page.locator('#results .card').count())>0);
  await page.locator('#reset').click();
  await page.locator('#kind').selectOption('pending');
  assert((await page.locator('#results .card').count())>0);
  assert.match(await page.locator('#filter-count').innerText(),/1/);
  assert.equal(await page.locator('.chip[data-query="收件匣"]').evaluate(n=>getComputedStyle(n).transitionDuration),'0s','Reduced motion must not animate chip state colors');
  const openAudit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.deepEqual(openAudit.violations,[]);
  await page.locator('#filter-summary').click();
  await page.locator('#query').fill('長搜尋詞'.repeat(60)+' <script>alert(1)</script>');
  assert.equal(await page.locator('#empty').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#empty-reset').click();
  assert.equal(await disclosure.evaluate(n=>n.open),false);
  const closedAudit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.deepEqual(closedAudit.violations,[]);
  // Resizing preserves the user's disclosure choice and focused control.
  await page.locator('#filter-summary').click();
  await page.locator('#tool').focus();
  await page.setViewportSize({width:width>760?390:1440,height});
  assert.equal(await disclosure.evaluate(n=>n.open),true);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'tool');
  await page.locator('#filter-summary').click();
  await page.setViewportSize({width,height});
  assert.equal(await disclosure.evaluate(n=>n.open),false);
  assert.deepEqual(errors,[]);
  row.axeScans=2;row.axeViolations=0;row.passed=true;report.push(row);
  await context.close();
 }
 if(prefix==='mobile-search'){
  for(const width of [760,761]){
   const page=await browser.newPage({viewport:{width,height:1000}});
   await page.goto(origin,{waitUntil:'networkidle'});
   await page.locator('#results .card').first().waitFor();
   assert.equal(await page.locator('#filter-options').evaluate(n=>n.open),width>760);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.close();
  }
  console.log('PASS MOBILE SEARCH: 760/761px initial disclosure boundary');
 }
 fs.writeFileSync('qa-artifacts/'+prefix+'.json',JSON.stringify(report,null,2));
 console.log('MOBILE_SEARCH_RESULTS '+prefix+' '+JSON.stringify(report));
};
