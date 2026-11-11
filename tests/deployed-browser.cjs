'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {waitForLiveRevision}=require('../scripts/published-revision.cjs');
const origin='https://richardhan.github.io/ai-agent-use-cases/';
// The walk is gated on one question: is the live build this push's build?
//
// Step 15 (tests/published-version.cjs) already compared this push's published bytes
// against the live site and reported the verdict; it owns byte equality. Waiting for
// the same equality here as well made a replaced build impossible to pass: run
// 42820349847 polled the whole window (13:09:40 -> 14:09:40, exactly 3600s) and failed
// on a healthy site whose build the next merge had replaced two minutes earlier.
// A live build that is a newer descendant of this push is superseded: its walk belongs
// to that commit's own main run, the same way this repository's other live checks treat
// a replaced build. A live build that is neither this push nor its descendant still
// fails — the wait is bounded by scripts/published-revision.cjs, so it fails in
// minutes with the revision that was observed, not an hour later with no explanation.
function reportGate(verdict){
 if(verdict.mode==='superseded'){
  console.log('PUBLISHED_LIVE_BUILD_SUPERSEDED '+(verdict.liveRevision||'unknown revision')+' (step 15 verified that build against its own revision)');
  return;
 }
 console.log('PUBLISHED_LIVE_BUILD_CURRENT '+(verdict.liveRevision||'')+' (walking the live site)');
}
if(require.main===module)(async()=>{
 // Without a verdict from step 15 (a manual dispatch, or an older caller) the gate
 // derives one itself from the live revision; either way it is bounded: 120s, 5s apart.
 const verdict=await waitForLiveRevision({
  base:origin,sha:process.env.GITHUB_SHA,
  mode:process.env.PUBLICATION_MODE||'',liveRevision:process.env.PUBLICATION_LIVE_REVISION||''
 });
 reportGate(verdict);
 // A replaced build is verified by the publication gate, not by this browser walk.
 // Walking it would also assert a layout this checkout never built, so stop cleanly.
 if(verdict.mode==='superseded')return;
 const browser=await chromium.launch();
 try{
 {
  const desktop=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await desktop.newPage();
  try{
   const response=await page.goto(origin+'?deploy-check='+Date.now(),{waitUntil:'networkidle',timeout:30000});
   assert(response.ok(),'Pages response '+response.status());
   await page.locator('#drawn-case .card').waitFor({timeout:10000});
   await page.locator('#guide-options [data-scenario="省錢"]').click();
   assert.equal(await page.locator('#scenario').inputValue(),'省錢');
   await page.locator('#active-filters [data-remove-filter="scenario"]').waitFor({timeout:1000});
   assert.match(await page.locator('#active-filters [data-remove-filter="scenario"]').innerText(),/省錢/);
   await page.locator('#drawn-case .card-bottom button').click();
   await page.locator('#detail[open]').waitFor();
   await page.locator('#close-detail').click();
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:'qa-artifacts/live-desktop.png'});
   console.log('PASS LIVE: Pages HTTPS, real generated catalog, scenario discovery and detail');
  }finally{await desktop.close();}
 }
  const mobile=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await mobile.newPage();
 await page.goto(origin+'?scenario=生活&case=UC-001',{waitUntil:'networkidle'});
 await page.locator('#detail[open]').waitFor();
 await page.reload({waitUntil:'networkidle'});
 await page.locator('#detail[open]').waitFor();
 assert.match(await page.locator('#detail-title').innerText(),/交通和住宿/);
 await page.locator('#close-detail').click();
 await page.locator('#guide-options [data-scenario="創作"]').click();
 await page.screenshot({path:'qa-artifacts/live-mobile.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 console.log('PASS LIVE: mobile direct link, refresh, close, scenario selection and no horizontal overflow');
 await require('./mobile-search-browser.cjs')({browser,origin,prefix:'live-mobile-search',sizes:[['desktop',1440,1000],['mobile',390,844]]});
 await require('./search-recovery-browser.cjs')({browser,origin,prefix:'live-search',sizes:[['desktop',1440,1000],['mobile',390,844]]});
 await mobile.close();
 await require('./initial-index-fallback-browser.cjs')({browser,origin});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
