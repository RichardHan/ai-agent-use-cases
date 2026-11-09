'use strict';
// Closing a case must hand the browser's Back button back to the reader.
// Before this test the close rewrote the detail entry into the list URL, so the
// first Back press after closing did nothing at all: the address bar and the
// screen stayed on the same results list, and only a second Back left the page.
const {chromium}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.DETAIL_HISTORY_URL||'http://127.0.0.1:8141/ai-agent-use-cases/';
const out=process.env.DETAIL_HISTORY_OUTPUT||'qa-artifacts/detail-close-history';
fs.mkdirSync(out,{recursive:true});
const report=[];const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
(async()=>{
 for(const [width,height] of [[1440,900],[390,844]]){
  const browser=await chromium.launch(),context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const row={width,height};report.push(row);save();
  const ready=()=>page.waitForFunction(()=>discoveryReady);
  const state=()=>page.evaluate(()=>({url:location.href,search:location.search,open:document.getElementById('detail')?.open??null,length:history.length,count:(document.getElementById('results-count')?.textContent||'').trim(),focus:document.activeElement?.id||document.activeElement?.closest('.card')?.dataset.caseId||document.activeElement?.tagName,scrollY:Math.round(scrollY)}));
  const openFirst=async()=>{
   const card=page.locator('#results .card').first();
   const id=await card.getAttribute('data-case-id');
   await card.locator('h3 button').click();
   await page.locator('#detail[open]').waitFor();
   return id;
  };

  // 1. A search, a case, the close button, then the first Back press.
  await page.goto(base);await ready();
  await page.goto(base+'?q=%E6%9C%83%E8%AD%B0#explore');await ready();
  const listed=await state();assert(listed.count.startsWith('顯示 '));
  const id=await openFirst();
  const opened=await state();
  assert.equal(opened.open,true);assert.match(opened.search,/case=/);assert.equal(opened.length,listed.length+1);
  await page.screenshot({path:`${out}/opened-${width}.png`});
  await page.locator('#close-detail').click();
  await page.waitForFunction(()=>!document.getElementById('detail').open);
  const closed=await state();
  row.closedUrl=closed.search;row.closedFocus=closed.focus;row.closedHistory=closed.length;
  assert.equal(closed.search.includes('case='),false,'closing removes the case parameter');
  assert.equal(closed.length,listed.length+1,'closing does not add a history step');
  assert.equal(closed.focus,id,'closing returns focus to the card that opened the case');
  assert.equal(closed.count,listed.count,'closing keeps the same result set');
  await page.screenshot({path:`${out}/closed-${width}.png`});
  await page.goBack();
  // The bug: this Back press consumed the entry the close had just rewritten, so
  // the page stayed on the same 26 results instead of leaving them.
  await page.waitForFunction(()=>!location.search.includes('q='),null,{timeout:5000}).catch(()=>{});
  const afterBack=await state();
  row.backUrl=afterBack.search;row.backHash=afterBack.url.includes('#explore');
  assert.equal(afterBack.search.includes('q='),false,'the first Back after closing leaves the searched results');
  assert.equal(afterBack.open,false);

  // 2. Escape must hand Back back in the same way.
  await page.goto(base+'?q=%E6%9C%83%E8%AD%B0#explore');await ready();
  await openFirst();
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.getElementById('detail').open);
  await page.goBack();
  await page.waitForFunction(()=>!location.search.includes('q='),null,{timeout:5000}).catch(()=>{});
  row.escapeBackUrl=(await state()).search;
  assert.equal((await state()).search.includes('q='),false,'the first Back after Escape leaves the searched results');

  // 3. Reading several cases in the dialog, then closing: the reading trail is
  // kept, so the first Back reopens the case read before it — never a no-op.
  await page.goto(base+'?q=%E6%9C%83%E8%AD%B0#explore');await ready();
  const first=await openFirst();
  await page.locator('#nav-next-case').click();
  await page.waitForFunction(previous=>document.getElementById('detail-toolbar-id')?.textContent.trim()!==previous,first);
  const second=await page.evaluate(()=>document.getElementById('detail-toolbar-id').textContent.trim());
  const stepped=await state();assert.equal(stepped.length,listed.length+2,'each case read in the dialog is its own history stop');
  await page.locator('#close-detail').click();
  await page.waitForFunction(()=>!document.getElementById('detail').open);
  row.steppedClosedUrl=(await state()).search;
  await page.goBack();
  await page.waitForFunction(previously=>document.getElementById('detail').open&&document.getElementById('detail-toolbar-id').textContent.trim()===previously,first,{timeout:5000});
  row.steppedBackId=first;
  assert.equal((await state()).search.includes('q='),true,'the first Back reopens the case read before, keeping the search');
  await page.goBack();
  await page.waitForFunction(()=>!document.getElementById('detail').open,null,{timeout:5000});
  const afterStepped=await state();
  assert.equal(afterStepped.search.includes('q='),true);
  assert.notEqual(afterStepped.focus,'BODY','leaving the reopened case still leaves an operable focus');
  row.steppedBackUrl=afterStepped.search;

  // 4. A shared deep link in a fresh tab must not navigate away when it is closed:
  // there is no in-page stop behind it, so closing keeps the page.
  const sharedContext=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const sharedPage=await sharedContext.newPage();
  await sharedPage.goto(base+'?case=UC-001');await sharedPage.locator('#detail[open]').waitFor();
  await sharedPage.waitForFunction(()=>discoveryReady);
  const shared=await sharedPage.evaluate(()=>({url:location.href,length:history.length,open:document.getElementById('detail').open}));
  assert.equal(shared.open,true);
  await sharedPage.locator('#close-detail').click();
  await sharedPage.waitForFunction(()=>!document.getElementById('detail').open);
  const sharedClosed=await sharedPage.evaluate(()=>({url:location.href,length:history.length}));
  row.sharedClosedUrl=sharedClosed.url;
  assert.equal(sharedClosed.url,shared.url.replace(/[?&]case=[^&]*/,'').replace(/\?$/,''),'closing a shared link stays on the page');
  assert.equal(sharedClosed.length,shared.length,'closing a shared link adds no history step');
  await sharedPage.goBack();
  await sharedPage.waitForFunction(expected=>location.href!==expected,sharedClosed.url,{timeout:5000}).catch(()=>{});
  row.sharedBackUrl=await sharedPage.evaluate(()=>location.href);
  assert.notEqual(row.sharedBackUrl,sharedClosed.url,'after closing a shared link one Back returns the page before it');
  await sharedContext.close();

  // 5. Widening the result batch after a close is a real destination, not an echo:
  // Back must restore the narrower batch instead of being skipped.
  await page.goto(base);await ready();
  await page.locator('#search-submit').click();
  await page.waitForFunction(()=>history.state?.resultBatch?.count===24);
  await openFirst();
  await page.locator('#close-detail').click();
  await page.waitForFunction(()=>!document.getElementById('detail').open);
  assert.equal(await page.locator('#results .card').count(),24);
  await page.locator('#load-more-results').click();
  await page.waitForFunction(()=>history.state?.resultBatch?.count===48);
  assert.equal(await page.locator('#results .card').count(),48);
  await page.goBack();
  await page.waitForFunction(()=>history.state?.resultBatch?.count===24,null,{timeout:5000}).catch(()=>{});
  const narrowed=await state();
  row.batchBackCards=await page.locator('#results .card').count();
  assert.equal(await page.evaluate(()=>history.state?.resultBatch?.count??null),24,'Back after widening a batch restores the narrower batch');
  assert.equal(row.batchBackCards,24,'Back after widening a batch shows the narrower batch of cards');
  assert.equal(narrowed.open,false,'the case stays closed on that Back');
  assert.equal(narrowed.search,'','Back stays on the same unfiltered list URL');

  // 5. Nothing else may regress.
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  row.axe=audit.violations.map(v=>v.id);assert.deepEqual(row.axe,[]);
  assert.deepEqual(errors,[]);row.journeys=5;save();await browser.close();
 }
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{save();console.error(e);process.exit(1)});
