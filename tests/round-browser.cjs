'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.ROUND_URL||'http://127.0.0.1:8100/ai-agent-use-cases/';
const observe=process.env.ROUND_OBSERVE==='1';
const output=process.env.ROUND_OUTPUT||'qa-artifacts/round';
const report={base,observe,checks:[]};fs.mkdirSync(output,{recursive:true});
const save=()=>fs.writeFileSync(output+'/verification.json',JSON.stringify(report,null,2));
async function audit(page,check,state){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();check.audits.push({state,violations:result.violations.map(v=>v.id)});save();assert.equal(result.violations.length,0,JSON.stringify(result.violations));}
async function hold(page,path){let release;const gate=new Promise(resolve=>release=resolve);await page.route('**/'+path,async route=>{await gate;await route.continue();});return release;}
(async()=>{
 for(const [engine,launcher] of (process.env.ROUND_ENGINES==='all'?[['chromium',chromium],['firefox',firefox],['webkit',webkit]]:[['chromium',chromium]])){
 const browser=await launcher.launch();try{
 for(const [size,width,height] of (engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]])){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const check={engine,size,audits:[]};report.checks.push(check);save();
  // Real catalog: a recently added shared source must not wait for any unrelated source.
  const release=await hold(page,'cases/001-travel-checkout.md');
  const requested=[];page.on('request',r=>{if(/\/(cases|evidence)\//.test(r.url()))requested.push(r.url());});
  const start=Date.now();
  // Resolve the catalog filename from the checked-out source instead of guessing a slug.
  const targetPath='cases/'+fs.readdirSync('cases').find(f=>f.startsWith('359-'));
  const sourceReady=page.waitForResponse(r=>r.url().endsWith('/'+targetPath)).then(async r=>{await r.finished();return Date.now()-start;});
  await page.goto(base+'?case=UC-359');check.sourceReadyMs=await sourceReady;
  if(observe){await page.waitForTimeout(600);check.earlyOpen=await page.locator('#detail').evaluate(e=>e.open);await page.screenshot({path:`${output}/before-${engine}-${size}.png`});release();await page.locator('#detail[open]').waitFor();check.openAfterReleaseMs=Date.now()-start;save();await context.close();continue;}
  await page.locator('#detail[open]').waitFor();check.detailOpenMs=Date.now()-start;
  assert.equal(await page.evaluate(()=>discoveryReady),false,'the unrelated source must still be waiting');
  assert.equal(await page.locator('#detail-toolbar-id').innerText(),'UC-359');
  assert.equal(requested[0].endsWith('/'+targetPath),true,'shared source gets the first worker');
  assert.match(await page.locator('.detail-load-status').innerText(),/這篇已可閱讀.*仍在載入/);
  assert.match(await page.locator('.related-empty').innerText(),/仍在載入/);
  assert(await page.locator('#nav-next-case').isDisabled());
  assert.match(await page.locator('#nav-next-case').getAttribute('aria-label'),/載入/);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'detail-title');
  assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.screenshot({path:`${output}/after-${engine}-${size}.png`});
  await audit(page,check,'early case');
  // Complete the corpus while reading an original section. The original DOM and focus survive.
  await page.locator('.reader-jump').first().focus();await page.keyboard.press('Enter');
  const reading=await page.evaluate(()=>{window.savedMarkdown=document.querySelector('.research-details .markdown');window.savedFocus=document.activeElement;return {scroll:document.getElementById('detail').scrollTop,focus:document.activeElement.id,url:location.href};});
  release();await page.waitForFunction(()=>discoveryReady);
  assert.equal(await page.evaluate(()=>window.savedMarkdown===document.querySelector('.research-details .markdown')),true);
  assert.equal(await page.evaluate(()=>window.savedFocus===document.activeElement),true);
  assert.equal(page.url(),reading.url);
  check.readingScrollDelta=await page.locator('#detail').evaluate((e,previous)=>Math.abs(e.scrollTop-previous),reading.scroll);
  assert(check.readingScrollDelta<=2,'background completion must preserve the reading position');
  assert.match(await page.locator('.detail-load-status').innerText(),/已載入/);
  await page.screenshot({path:`${output}/reading-${engine}-${size}.png`});
  await audit(page,check,'complete original section');
  // Native close/return and refresh preserve query + combined facets, including an empty result.
  await page.keyboard.press('Escape');assert.equal(await page.locator('#detail').evaluate(e=>e.open),false);
  await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(e=>e.open=true);await page.locator('#scenario').selectOption('生活');
  await page.locator('#query').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/results-${engine}-${size}.png`});
  assert(await page.locator('#results .card').count()>0);
  const trigger=page.locator('#results .card .card-bottom button').first();await trigger.focus();await page.keyboard.press('Enter');
  const direct=page.url();await page.goBack();await page.waitForFunction(()=>!document.querySelector('#detail').open);assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
  await page.goto(direct);await page.locator('#detail[open]').waitFor();await page.reload();await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);
  await page.locator('#close-detail').click();assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
  await page.locator('#query').fill('no-round-match-987654');assert(await page.locator('#empty').isVisible());await page.locator('#edit-query').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
  // A reader who closes early stays in search after the background loader completes.
  const closePage=await context.newPage();const releaseClose=await hold(closePage,'cases/001-travel-checkout.md');
  await closePage.goto(base+'?q=PR&scenario=開發&case=UC-005');await closePage.locator('#detail[open]').waitFor();
  await closePage.keyboard.press('Escape');await closePage.locator('#query').fill('旅遊');await closePage.locator('#filter-options').evaluate(e=>e.open=true);await closePage.locator('#scenario').selectOption('生活');
  await closePage.locator('#query').focus();releaseClose();await closePage.waitForFunction(()=>discoveryReady);
  assert.equal(await closePage.locator('#detail').evaluate(e=>e.open),false);assert.equal(new URL(closePage.url()).searchParams.has('case'),false);
  assert.equal(await closePage.locator('#query').inputValue(),'旅遊');assert.equal(await closePage.locator('#scenario').inputValue(),'生活');assert.equal(await closePage.evaluate(()=>document.activeElement.id),'query');await closePage.close();
  // Target failure retains the original partial-load/retry path; no missing-case invention.
  const failed=await context.newPage();let fail=true;const failedTarget='cases/005-cloud-pr-review.md';
  await failed.route('**/'+failedTarget,route=>fail?route.fulfill({status:503,body:'Unavailable'}):route.continue());
  await failed.goto(base+'?case=UC-005');await failed.locator('#partial-load:not([hidden])').waitFor();assert.equal(await failed.locator('#detail').evaluate(e=>e.open),false);assert.equal(await failed.locator('#missing-case').isVisible(),false);
  fail=false;await failed.locator('#retry-failed').click();await failed.locator('#detail[open]').waitFor();assert.equal(await failed.locator('#detail-toolbar-id').innerText(),'UC-005');await failed.close();
  // Pending aliases use the same original source without invented successful results.
  const pending=await context.newPage();const releasePending=await hold(pending,'cases/001-travel-checkout.md');
  await pending.goto(base+'?case=P003');await pending.locator('#detail[open]').waitFor();assert.equal(await pending.locator('#detail-toolbar-id').innerText(),'P-003');assert.match(await pending.locator('.reader-evidence').innerText(),/待查/);releasePending();await pending.waitForFunction(()=>discoveryReady);await pending.close();
  // Open an actual external source once; its availability is not evidence of case accuracy.
  if(engine==='chromium'&&size==='desktop'){
   await page.goto(base+'?case=UC-005');await page.locator('#detail[open]').waitFor();await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();
   const link=page.locator('.markdown a[href^="https://zenn.dev/"]').first();const popupReady=page.waitForEvent('popup');check.sourceHref=await link.getAttribute('href');await link.click();const popup=await popupReady;await popup.waitForLoadState('domcontentloaded').catch(()=>{});check.openedSource=popup.url();await popup.close();
  }
  assert.deepEqual(errors,[]);check.pageErrors=errors;check.complete=true;save();await context.close();
 }
 }finally{await browser.close();}}
 save();console.log(JSON.stringify(report,null,2));
})().catch(e=>{report.error=e.stack;save();console.error(e);process.exit(1);});
