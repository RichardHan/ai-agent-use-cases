'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8134/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/after';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const report=[];
 for(const [engine,width] of [[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
  const label=engine.name()+'-'+width,row={label,tasks:[],errors:[],network:[]};report.push(row);console.log('START '+label);
  page.on('pageerror',e=>row.errors.push(e.message));context.on('response',r=>{if(r.status()>=400)row.network.push({url:r.url().split('?')[0],status:r.status()});});
  const ready=async suffix=>{await page.goto(base+(suffix||''));await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.evaluate(()=>failedPaths.length),0,'Main journeys require the full corpus');};
  const panel=async()=>{if(!await page.locator('#filter-options').evaluate(n=>n.open))await page.locator('#filter-summary').click();};
  const settled=async()=>{await page.waitForFunction(()=>document.activeElement.id==='results-count');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
  const audit=async()=>{const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(r.violations.map(v=>v.id),[]);return r.violations.length;};
  const shot=async name=>page.screenshot({path:`${out}/${name}-${label}.png`});
  await ready();row.total=await page.evaluate(()=>entries.length);await shot('home');await panel();await page.locator('#task-shortcuts-hint').scrollIntoViewIfNeeded();await shot('task-hint');
  // Journey 1: one explicit task action leads to visible results, and can be undone.
  for(const q of ['每日','收件匣','比價','排程']){
   await panel();const task=page.locator(`.chip[data-query="${q}"]`);await task.focus();await page.keyboard.press(q==='比價'?'Space':'Enter');await settled();
   assert.equal(await page.locator('#query').inputValue(),q);assert.equal(await task.getAttribute('aria-pressed'),'true');
   const state=await page.evaluate(()=>({count:currentFiltered.length,focus:document.activeElement.id,top:document.getElementById('results-count').getBoundingClientRect().top,card:document.querySelector('#results .card h3').getBoundingClientRect().toJSON(),panel:document.getElementById('filter-options').open}));
   assert(state.count>0);assert(state.top>=-1&&state.top<150);assert(state.card.top>=0&&state.card.top<900);assert(state.panel);row.tasks.push({q,...state});await shot('task-'+q);
   await task.click();await settled();assert.equal(await page.locator('#query').inputValue(),'');assert.equal(await task.getAttribute('aria-pressed'),'false');
  }
  row.resultAxe=await audit();console.log('TASKS '+label);
  // Journey 2: preserve combined conditions through a task, reading, source, back and refresh.
  await panel();await page.locator('#scenario').selectOption('工作');await page.locator('#tool').selectOption('Grok Bot');await page.locator('#sort').selectOption('reviewed');
  await page.locator('.chip[data-query="收件匣"]').click();await settled();
  for(const [id,value] of Object.entries({scenario:'工作',tool:'Grok Bot',sort:'reviewed'}))assert.equal(await page.locator('#'+id).inputValue(),value);
  const filtered=await page.evaluate(()=>currentFiltered.map(x=>x.id)),url=page.url();assert(filtered.length>0);assert.equal(new URL(url).searchParams.get('q'),'收件匣');
  const trigger=page.locator('#results .card .card-bottom button').first();const id=await trigger.evaluate(n=>n.closest('.card').dataset.caseId);await trigger.click();await page.locator('#detail[open]').waitFor();const direct=page.url();await shot('detail');
  await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();const source=page.locator('.markdown a[href^="https:"]').first();row.source=(await source.getAttribute('href')).split('?')[0];
  if(engine===chromium&&width===1440){const pending=page.waitForEvent('popup');await source.click();const popup=await pending;await popup.waitForLoadState('domcontentloaded',{timeout:15000}).catch(()=>{row.sourceTimedOut=true;});row.openedSource=popup.url().split('?')[0];await popup.close();}
  await page.keyboard.press('Escape');assert(await page.locator(`#results .card[data-case-id="${id}"] .card-bottom button`).evaluate(n=>n===document.activeElement));
  assert.deepEqual(await page.evaluate(()=>currentFiltered.map(x=>x.id)),filtered);
  await ready(direct.slice(base.length));await page.locator('#detail[open]').waitFor();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.locator('#detail[open]').waitFor();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#query').inputValue(),'收件匣');assert.equal(await page.locator('#sort').inputValue(),'reviewed');
  console.log('READING '+label);
  // Journey 3: a contradictory pair of evidence filters stays empty and offers recovery.
  await panel();await page.locator('#kind').selectOption('pending');await page.locator('#proof').selectOption('官方自報');await page.locator('.chip[data-query="比價"]').click();await settled();
  assert.equal(await page.locator('#empty').isVisible(),true);assert.equal(await page.locator('#kind').inputValue(),'pending');assert.equal(await page.locator('#proof').inputValue(),'官方自報');await shot('empty');row.emptyAxe=await audit();
  await page.locator('#edit-query').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');await page.locator('#empty-reset').click();assert(await page.locator('#results .card').count()>0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(row.errors,[]);
  console.log('PASS '+label);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await context.close();await browser.close();
 }
 // Loading/error/partial states use the real reader. No delayed task focus is queued.
 const browser=await chromium.launch();const lifecycle=[];
 for(const mode of ['loading','error','partial']){console.log('LIFECYCLE '+mode);
  const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();let release;const gate=new Promise(r=>release=r);
  if(mode==='loading')await page.route('**/catalog.json',async route=>{await gate;await route.continue();});
  if(mode==='error')await page.route('**/catalog.json',route=>route.abort());
  if(mode==='partial')await page.route('**/cases/001-travel-checkout.md',route=>route.abort());
  await page.goto(base);if(mode==='error')await page.locator('#error').waitFor({state:'visible'});if(mode==='partial')await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
  await page.locator('#filter-options').evaluate(n=>n.open=true);const chip=page.locator('.chip[data-query="每日"]');await chip.click();
  if(mode==='partial'){await page.waitForFunction(()=>document.activeElement.id==='results-count');assert(await page.locator('#partial-load').isVisible());}
  else assert(await chip.evaluate(n=>n===document.activeElement));
  if(mode==='loading'){release();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert(await chip.evaluate(n=>n===document.activeElement));}
  if(mode==='error'){await page.unroute('**/catalog.json');await page.locator('#retry').click();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});}
  if(mode==='partial'){await page.unroute('**/cases/001-travel-checkout.md');await page.locator('#retry-failed').click();await page.waitForFunction(()=>!recoveringSources&&failedPaths.length===0,null,{timeout:120000});}
  assert.equal(await page.locator('#query').inputValue(),'每日');assert.equal(await chip.getAttribute('aria-pressed'),'true');lifecycle.push({mode,passed:true});await context.close();
 }
 fs.writeFileSync(out+'/lifecycle.json',JSON.stringify(lifecycle,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
