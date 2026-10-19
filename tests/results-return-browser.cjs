'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.RETURN_URL||'http://127.0.0.1:8130/ai-agent-use-cases/';
const out=process.env.RETURN_OUTPUT||'qa-artifacts/results-return';
const observe=process.env.RETURN_OBSERVE==='1';
fs.mkdirSync(out,{recursive:true});
const report=[];const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
(async()=>{
 for(const [engine,width,height] of observe||process.env.RETURN_PUBLISHED==='1'?[[chromium,1440,1000],[chromium,390,844]]:[[chromium,1440,1000],[chromium,390,844],[chromium,320,740],[firefox,390,844],[webkit,390,844]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const row={engine:engine.name(),width};report.push(row);save();
  const ready=async()=>page.waitForFunction(()=>discoveryReady);
  const started=Date.now();await page.goto(base);await ready();row.readyMs=Date.now()-started;await page.locator('.hero-search-link').click();
  row.total=await page.locator('#results .card').count();
  row.firstResultFromSearch=await page.evaluate(()=>document.querySelector('#results .card').getBoundingClientRect().top-document.getElementById('query').getBoundingClientRect().top);
  await page.screenshot({path:`${out}/search-${engine.name()}-${width}.png`});
  const firstReturn=page.locator('#results [data-results-return]').first();
  await page.locator('#results .card').nth(5).evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
  await page.screenshot({path:`${out}/deep-${engine.name()}-${width}.png`});
  row.returnLinks=await page.locator('#results [data-results-return]').count();save();
  if(observe){await browser.close();continue;}
  assert(row.returnLinks>0,'Deep result browsing needs an in-flow route back to search and filters');
  if(width<=760)assert(row.firstResultFromSearch<240,'original mobile first-result budget is preserved');
  // Every result remains present and in its original order; links never masquerade as cards.
  const groups=await page.locator('#results').evaluate(e=>{let n=0;return [...e.children].flatMap(node=>node.classList.contains('card')?(n++,[]):[n]);});
  const expected=Array.from({length:Math.ceil(row.total/6)},(_,i)=>Math.min((i+1)*6,row.total));
  assert.deepEqual(groups,expected);assert.equal(await page.evaluate(()=>currentFiltered.length),row.total);
  assert.deepEqual(await page.locator('#results .card').evaluateAll(es=>es.map(e=>e.dataset.caseId)),await page.evaluate(()=>currentFiltered.map(e=>e.id)));
  await firstReturn.scrollIntoViewIfNeeded();await firstReturn.focus();
  const rect=await firstReturn.boundingBox();assert(rect.height>=44);assert(rect.x>=0&&rect.x+rect.width<=width);
  assert.equal(await firstReturn.getAttribute('href'),'#explore');
  assert.equal(await firstReturn.evaluate(e=>{const b=e.getBoundingClientRect();return e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));}),true);
  const before=await page.evaluate(()=>{history.replaceState({...history.state,returnMarker:'keep'},'');return {length:history.length,params:location.search};});
  for(const options of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1}]){
   assert.equal(await firstReturn.evaluate((link,options)=>{let prevented;link.addEventListener('click',e=>{prevented=e.defaultPrevented;e.preventDefault();},{once:true});link.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,button:0,...options}));return prevented;},options),false);
  }
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
  assert.deepEqual(await page.evaluate(()=>({length:history.length,params:location.search})),before);
  assert.equal(await page.evaluate(()=>history.state.returnMarker),'keep');
  const queryBox=await page.locator('#query').boundingBox();assert(queryBox.y>=0&&queryBox.y+queryBox.height<=height);
  const boundaries=await page.evaluate(()=>[0,1,6,7,12,15].map(total=>{
    const fixture=entries.slice(0,total),host=document.createElement('div');host.append(...resultCards(fixture,[]));
    return {total,cards:host.querySelectorAll('.card').length,links:[...host.querySelectorAll('[data-results-return]')].map(e=>Number(e.dataset.resultsReturn))};
  }));
  for(const boundary of boundaries){assert.equal(boundary.cards,boundary.total);assert.deepEqual(boundary.links,Array.from({length:Math.ceil(boundary.total/6)},(_,i)=>Math.min((i+1)*6,boundary.total)));}
  row.boundaries=boundaries;
  // 1. Refine an initially broad collection, read a later card, and return to that same card.
  row.inputRenderMs=await page.locator('#query').evaluate(e=>{const start=performance.now();e.value='旅遊';e.dispatchEvent(new Event('input',{bubbles:true}));return performance.now()-start;});await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#scenario').selectOption('生活');
  const travelCount=await page.locator('#results .card').count();assert(travelCount>6);
  const read=page.locator('#results .card .card-bottom button').nth(6),id=await page.locator('#results .card').nth(6).getAttribute('data-case-id');
  await read.click();await page.locator('#detail[open]').waitFor();assert(await page.locator('#results [data-results-return]').first().evaluate(e=>e.closest('body').querySelector('#detail').open));
  await page.goBack();await page.waitForFunction(id=>!document.getElementById('detail').open&&document.activeElement.closest('.card')?.dataset.caseId===id,id);
  assert.equal(await read.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=-1&&r.bottom<=innerHeight+1;}),true);
  const returnLink=page.locator('#results [data-results-return]').first();await returnLink.click();assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
  // 2. Zero matches and long text use existing recovery; no phantom navigation remains.
  await page.locator('#query').fill('不存在的任務'.repeat(40)+'<script>bad()</script>');await page.locator('#empty').waitFor({state:'visible'});
  assert.equal(await page.locator('#results [data-results-return]').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#edit-query').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
  await page.locator('#empty-reset').click();
  // 3. Shared detail + reload retains filters; search handoff still works after closing.
  await page.goto(base+'?q=旅遊&scenario=生活&case=UC-001#explore');await page.locator('#detail[open]').waitFor();await ready();
  await page.reload();await page.locator('#detail[open]').waitFor();await ready();await page.locator('#close-detail').click();
  await page.locator('#results [data-results-return]').last().click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');assert.equal(await page.locator('#scenario').inputValue(),'生活');
  await page.locator('#results [data-results-return]').first().scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/return-${engine.name()}-${width}.png`});
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.axe=audit.violations.map(v=>v.id);assert.deepEqual(row.axe,[]);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);row.journeys=3;row.travelCount=travelCount;save();await browser.close();
 }
 if(!observe){
  const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  for(const position of ['first','last']){
   await page.route('**/cases/001-*.md',route=>route.fulfill({status:503,body:'unavailable'}));
   await page.goto(base);await page.waitForFunction(()=>discoveryReady);assert.equal(await page.evaluate(()=>failedPaths.length),1);
   const before=await page.locator('#results .card').count(),links=page.locator('#results [data-results-return]'),link=position==='first'?links.first():links.last();
   await page.unroute('**/cases/001-*.md');
   let release;const gate=new Promise(resolve=>release=resolve);
   await page.route('**/cases/001-*.md',async route=>{await gate;await route.continue();});
   // Start a real retry, then continue browsing while its source is still in flight.
   await page.locator('#retry-failed').click();await page.waitForFunction(()=>recoveringSources);await link.focus();
   const expectedBefore=position==='first'?'6':String(before);assert.equal(await page.evaluate(()=>document.activeElement.dataset.resultsReturn),expectedBefore);
   release();await page.waitForFunction(()=>failedPaths.length===0&&!recoveringSources);await page.unroute('**/cases/001-*.md');
   assert.equal(await page.locator('#results .card').count(),before+1);assert.equal(await page.evaluate(()=>document.activeElement.dataset.resultsReturn),position==='first'?'6':String(before+1));
   const focused=await page.evaluate(()=>{const b=document.activeElement.getBoundingClientRect();return {top:b.top,bottom:b.bottom};});assert(focused.top>=0&&focused.bottom<=844);
   await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
  }
  await page.route('**/catalog.json',route=>route.fulfill({status:503,body:'unavailable'}));await page.reload();await page.locator('#error').waitFor({state:'visible'});assert.equal(await page.locator('#results [data-results-return]').count(),0);
  await page.unroute('**/catalog.json');await page.locator('#retry').click();await page.waitForFunction(()=>discoveryReady);assert((await page.locator('#results [data-results-return]').count())>0);
  report.push({states:'partial-load/focused-link-recovery/error/retry',passed:true});save();await browser.close();
 }
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{save();console.error(e);process.exit(1)});
