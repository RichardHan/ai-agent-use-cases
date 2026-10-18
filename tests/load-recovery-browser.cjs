'use strict';
const {chromium,firefox,webkit}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin=process.env.LOAD_URL||'http://127.0.0.1:8086/ai-agent-use-cases/';
const report=[];
async function ready(page,url=''){await page.goto(origin+url);await page.waitForFunction(()=>document.querySelector('#results-count').textContent.includes('筆收錄'));}
async function done(page){await page.waitForFunction(()=>!recoveringSources);}
async function audit(page,label){
 const result=await new AxeBuilder({page}).analyze();
 report.push({label,axeViolations:result.violations});
 assert.equal(result.violations.length,0,JSON.stringify(result.violations));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow');
}
async function shot(page,name){
 await page.screenshot({path:'qa-artifacts/'+name+'.jpg',type:'jpeg',quality:70});
 console.log('VISUAL:'+name+':'+fs.readFileSync('qa-artifacts/'+name+'.jpg').toString('base64'));
}
async function fixture(page){
 const counts={};let blocked=new Set(['cases/b.md','sources/pending.md']);let delay=0;
 const docs={
  'cases/a.md':'# UC-991：整理旅遊清單\n\n- 情境：生活\n- 分類：旅遊\n- 核心目標：旅遊清單\n- 標籤：旅遊\n- 來源證據：作者自述\n\n## 方法\n\n只讀資料。\n\n## 來源\n\nhttps://example.org/',
  'cases/b.md':'# UC-992：整理工作郵件\n\n- 情境：工作\n- 分類：郵件\n- 核心目標：郵件\n- 標籤：郵件\n- 來源證據：作者自述\n\nNotion\n\n## 限制\n\n這是測試資料。',
  'sources/pending.md':'# 待查\n\n## P-991：待查甲\n\n- 狀態：待查\n\n## P-992：待查乙\n\n- 狀態：待查'
 };
 await page.route('**/catalog.json',r=>r.fulfill({json:{builtAt:'fixture',files:Object.keys(docs)}}));
 await page.route('**/assets/copy.json',r=>r.fulfill({json:{}}));
 for(const [path,body] of Object.entries(docs))await page.route('**/'+path,async r=>{
  counts[path]=(counts[path]||0)+1;
  const fail=blocked.has(path);
  if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  try{await r.fulfill(fail?{status:429,body:'Rate limited'}:{status:200,body});}catch{}
 });
 return {counts,unblock:path=>blocked.delete(path),delay:ms=>delay=ms};
}
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const engines=process.env.LOAD_ENGINES==='all'?{chromium,firefox,webkit}:{chromium};
 for(const [engine,type] of Object.entries(engines)){
  const browser=await type.launch();
  for(const [name,width,height] of engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]]){
   // Actual corpus: compare the same source failure and view as the baseline.
   const page=await browser.newPage({viewport:{width,height}});
   let blocked=true;let requests=0;
   await page.route('**/cases/001-travel-checkout.md',async route=>{requests++;if(blocked)await route.fulfill({status:429,body:'Rate limited'});else await route.continue();});
   await ready(page,'?q=UC-001#explore');
   assert.equal(await page.locator('#partial-load').isVisible(),true);
   assert.equal(await page.locator('#error').isVisible(),false);
   await page.locator('#search-title').scrollIntoViewIfNeeded();
   if(engine==='chromium')await shot(page,'after-partial-'+name);
   await audit(page,engine+'-'+name+'-partial');
   const loaded=await page.evaluate(()=>entries.length);
   await page.locator('#retry-failed').focus();await page.keyboard.press('Enter');await done(page);
   assert.equal(requests,2);
   assert.equal(await page.locator('#retry-failed').evaluate(n=>n===document.activeElement),true,'persistent failure keeps keyboard focus');
   blocked=false;
   const beforeRequests=await page.evaluate(()=>performance.getEntriesByType('resource').length);
   await page.keyboard.press('Enter');await done(page);
   const afterRequests=await page.evaluate(()=>performance.getEntriesByType('resource').length);
   assert.equal(await page.evaluate(()=>entries.length),loaded+1);
   assert.equal(await page.locator('#partial-load').isVisible(),false);
   assert.equal(await page.locator('#results-count').evaluate(n=>n===document.activeElement),true,'hidden recovery button returns focus to results');
   assert.equal(afterRequests-beforeRequests,1,'only missing Markdown requested');
   assert.equal(await page.locator('#query').inputValue(),'UC-001');
   await audit(page,engine+'-'+name+'-recovered');
   report.push({engine,name,loaded,recovered:loaded+1,retryRequests:afterRequests-beforeRequests});
   await page.close();

   // Journey 1: two sources fail, recovery is incremental, current filters win.
   const p=await browser.newPage({viewport:{width,height}});const f=await fixture(p);
   await ready(p,'?q=郵件&tool=Notion#explore');
   assert.equal(await p.locator('#tool').inputValue(),'Notion','unloaded facet from URL retained');
   assert.match(await p.locator('#empty h3').innerText(),/已載入內容/);
   f.unblock('cases/b.md');f.delay(350);
   await p.locator('#retry-failed').click();
   await p.evaluate(()=>retryFailedSources()); // Guard prevents duplicate requests.
   await p.locator('#query').fill('工作');
   await done(p);
   assert.equal(await p.locator('#query').evaluate(n=>n===document.activeElement),true);
   assert.equal(await p.locator('#query').inputValue(),'工作');
   assert.equal(await p.locator('#tool').inputValue(),'Notion');
   assert.equal(await p.locator('#results .card').count(),1);
   assert.deepEqual(f.counts,{'cases/a.md':1,'cases/b.md':2,'sources/pending.md':2});
   assert.match(await p.locator('#partial-message').innerText(),/1 個來源檔案/);
   f.unblock('sources/pending.md');
   await p.locator('#retry-failed').click();
   const target=p.locator('#results .card h3 button').first();await target.focus();
   await done(p);
   assert.equal(await p.locator('#results .card h3 button').first().evaluate(n=>n===document.activeElement),true,'rebuilt card focus retained');
   assert.equal(await p.evaluate(()=>entries.length),4,'one source yields two pending entries');
   assert.equal(await p.locator('#pending-count').innerText(),'2');
   assert.deepEqual(f.counts,{'cases/a.md':1,'cases/b.md':2,'sources/pending.md':3});
   await p.keyboard.press('Enter');await p.locator('#detail[open]').waitFor();await p.keyboard.press('Escape');
   assert.equal(await p.locator('#results .card h3 button').first().evaluate(n=>n===document.activeElement),true);
   await p.locator('#query').fill('完全不存在');
   assert.match(await p.locator('#empty h3').innerText(),/^目前沒有/);
   await audit(p,engine+'-'+name+'-empty');
   await p.close();

   // Journey 2: a shared missing case is recoverable without changing the URL.
   const direct=await browser.newPage({viewport:{width,height}});const d=await fixture(direct);
   await ready(direct,'?case=UC-992&q=工作');
   assert.match(await direct.locator('#partial-message').innerText(),/分享的案例/);
   d.unblock('cases/b.md');d.unblock('sources/pending.md');
   const directURL=direct.url();
   await direct.locator('#retry-failed').focus();await direct.keyboard.press('Enter');await done(direct);
   await direct.locator('#detail[open]').waitFor();assert.equal(direct.url(),directURL);
   assert.equal(await direct.locator('#detail-toolbar-id').innerText(),'UC-992');
   await direct.keyboard.press('Escape');assert.equal(await direct.locator('#query').inputValue(),'工作');
   await direct.reload();await direct.waitForFunction(()=>document.querySelector('#results-count').textContent.includes('筆收錄'));
   assert.equal(await direct.locator('#partial-load').isVisible(),false);
   await direct.close();

   // Journey 3: navigating/reading another case during recovery never reopens the old link.
   const reading=await browser.newPage({viewport:{width,height}});const g=await fixture(reading);
   await ready(reading,'?case=UC-992');g.unblock('cases/b.md');g.unblock('sources/pending.md');g.delay(350);
   await reading.locator('#retry-failed').click();
   await reading.locator('#results .card h3 button').first().click();
   const focused=await reading.evaluate(()=>document.activeElement.id);
   await done(reading);
   assert.equal(await reading.locator('#detail-toolbar-id').innerText(),'UC-991');
   assert.equal(await reading.evaluate(()=>document.activeElement.id),focused);
   assert.match(reading.url(),/case=UC-991/);
   await reading.keyboard.press('Escape');
   await audit(reading,engine+'-'+name+'-reading-return');
   await reading.close();
   console.log('PASS LOAD '+engine+' '+name+': partial/only-failed/zero-success/incremental/pending/filter/empty/focus/direct-link/refresh/reading-return');
  }
  await browser.close();
 }
 fs.writeFileSync('qa-artifacts/load-recovery.json',JSON.stringify(report,null,2));
 console.log('LOAD_REPORT '+JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
