'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'http://127.0.0.1:8141/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/after',observe=process.env.POSITION_OBSERVE==='1';
fs.mkdirSync(out,{recursive:true});const report=[];
async function ready(page,suffix=''){await page.goto(base+suffix);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});}
async function position(page){
 const expected=await page.evaluate(()=>{const ids=[...document.querySelectorAll('#results .card')].map(x=>x.dataset.caseId),i=ids.indexOf(document.getElementById('detail-toolbar-id').textContent),loading=!document.getElementById('loading-progress').hidden,partial=!document.getElementById('partial-load').hidden;return loading?'其他案例載入中':i<0?(partial?'不在已載入結果中':'不在目前結果中'):`${partial?'已載入結果':'目前結果'} ${i+1}／${ids.length}`;});
 assert.equal(await page.locator('#detail-result-context').innerText(),expected);
 assert(await page.locator('#detail-result-context').isVisible());return expected;
}
async function measure(page){return page.evaluate(()=>{
 const toolbar=document.querySelector('.detail-toolbar').getBoundingClientRect(),purpose=[...document.querySelectorAll('#detail-body h2')].find(x=>x.textContent==='可以幫你做什麼');
 return {toolbarHeight:toolbar.height,purposeTop:purpose?.getBoundingClientRect().top,overflow:document.documentElement.scrollWidth>innerWidth,
 context:document.getElementById('detail-result-context')?.textContent||null,buttons:[...document.querySelectorAll('.detail-toolbar-actions button')].map(x=>({height:x.getBoundingClientRect().height,width:x.getBoundingClientRect().width}))};
 });}
(async()=>{
 const configs=observe?[[chromium,1440],[chromium,390],[chromium,320]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]];
 for(const [engine,width] of configs){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:width<500?844:1000},reducedMotion:'reduce'}),page=await context.newPage();
  const row={engine:engine.name(),width,errors:[],audits:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
  await ready(page,'?kind=evidence#explore');
  const evidenceIds=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId));assert(evidenceIds.length>=3);
  const trigger=page.locator('#results .card[data-case-id="'+evidenceIds[0]+'"] .card-bottom button');
  await trigger.click();await page.locator('#detail[open]').waitFor();
  row.measure=await measure(page);await page.screenshot({path:out+'/detail-'+engine.name()+'-'+width+'.png'});
  if(observe){await context.close();await browser.close();continue;}
  row.start=await position(page);assert.equal(row.start,'目前結果 1／'+evidenceIds.length);
  assert(!row.measure.overflow);assert(row.measure.buttons.every(b=>b.height>=44&&b.width>=44));
  assert(row.measure.toolbarHeight<=(width<500?100:78),'keep existing two-row/one-row toolbar');
  for(const id of ['nav-prev-case','nav-next-case'])assert.equal(await page.locator('#'+id).getAttribute('aria-describedby'),'detail-result-context');
  row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(x=>x.id));
  await page.locator('#nav-next-case').focus();await page.keyboard.press('Enter');await position(page);
  assert.equal(await position(page),'目前結果 2／'+evidenceIds.length);
  await page.keyboard.press('Escape');await page.locator('#results .card[data-case-id="'+evidenceIds.at(-1)+'"] .card-bottom button').click();
  assert.equal(await position(page),'目前結果 '+evidenceIds.length+'／'+evidenceIds.length);assert(await page.locator('#nav-next-case').isDisabled());
  await page.locator('#nav-prev-case').click();assert.equal(await position(page),'目前結果 '+(evidenceIds.length-1)+'／'+evidenceIds.length);
  await page.goBack();await position(page);await page.keyboard.press('Escape');assert(await page.locator('#results .card[data-case-id="'+evidenceIds.at(-1)+'"] .card-bottom button').evaluate(e=>e===document.activeElement));
  // Search, combination filters, reviewed order, direct link and refresh.
  await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(e=>e.open=true);
  await page.locator('#kind').selectOption('');await page.locator('#scenario').selectOption('生活');await page.locator('#sort').selectOption('reviewed');
  const ordered=await page.evaluate(()=>currentFiltered.map(x=>x.id));assert(ordered.length>2);row.travelCount=ordered.length;
  await page.locator('#results .card[data-case-id="'+ordered[1]+'"] .card-bottom button').click();assert.match(await position(page),new RegExp('2／'+ordered.length+'$'));
  await page.locator('#nav-next-case').click();assert.equal(await page.locator('#detail-toolbar-id').innerText(),ordered[2]);await position(page);
  const shared=page.url();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.locator('#detail[open]').waitFor();await position(page);assert.equal(page.url(),shared);
  await page.keyboard.press('Escape');await page.locator('#query').fill('nothing-matches-position-qa');await page.locator('#empty').waitFor({state:'visible'});
  await page.locator('#edit-query').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
  row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(x=>x.id));
  await ready(page,'?q=nothing-matches-position-qa&case=UC-006');await page.locator('#detail[open]').waitFor();
  assert.equal(await position(page),'不在目前結果中');assert(await page.locator('#nav-prev-case').isDisabled());assert(await page.locator('#nav-next-case').isDisabled());
  await page.locator('.research-details summary').click();await page.locator('.markdown h2').last().scrollIntoViewIfNeeded();await position(page);
  assert(await page.locator('.markdown a[href^="https:"]').count());
  row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(x=>x.id));
  assert(row.audits.every(a=>a.length===0));assert.deepEqual(row.errors,[]);console.log('PASS POSITION '+engine.name()+' '+width);
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await context.close();await browser.close();
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
 if(!observe&&process.env.POSITION_LIFECYCLE!=='0'){
  const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));let release;const gate=new Promise(r=>release=r);
  await page.route('**/cases/*.md',async route=>{if(!route.request().url().includes('/008-'))await gate;await route.continue();});
  await page.goto(base+'?kind=evidence&case=UC-008');await page.locator('#detail[open]').waitFor();assert.equal(await position(page),'其他案例載入中');
  await page.locator('#detail-title').focus();const title=await page.locator('#detail-title').innerText();
  await page.evaluate(()=>window.positionTitle=document.getElementById('detail-title'));release();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
  await position(page);assert(await page.evaluate(()=>window.positionTitle===document.getElementById('detail-title')));assert.equal(await page.locator('#detail-title').innerText(),title);assert.equal(await page.evaluate(()=>document.activeElement.id),'detail-title');
  await page.screenshot({path:out+'/loaded-mobile.png'});await context.close();
  const partial=await browser.newContext({viewport:{width:390,height:844}}),p=await partial.newPage();
  p.on('pageerror',e=>errors.push(e.message));await p.route('**/cases/001-*.md',route=>route.abort());await ready(p,'?kind=evidence&case=UC-008');await p.locator('#detail[open]').waitFor();assert.match(await position(p),/^已載入結果 /);
  await p.screenshot({path:out+'/partial-mobile.png'});await p.keyboard.press('Escape');
  await p.unroute('**/cases/001-*.md');await p.locator('#retry-failed').click();await p.waitForFunction(()=>!recoveringSources&&failedPaths.length===0,null,{timeout:120000});
  await p.locator('#results .card[data-case-id="UC-008"] .card-bottom button').click();assert.match(await position(p),/^目前結果 /);
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/lifecycle.json',JSON.stringify({loading:true,backgroundDOMPreserved:true,focusPreserved:true,partial:true,retry:true,errors},null,2));
  await partial.close();await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
