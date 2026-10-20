'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.TRUST_URL||'http://127.0.0.1:8141/ai-agent-use-cases/';
const observe=process.env.TRUST_OBSERVE==='1',live=process.env.TRUST_LIVE==='1';
const out=process.env.TRUST_OUTPUT||'qa-artifacts/trust';fs.mkdirSync(out,{recursive:true});
const report={origin,observe,checks:[]},save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
const canonical=fs.readFileSync('sources/qualification-audit-2026-10-16.md','utf8').split(/^## /m)[1];
const expected=canonical.match(/嚴格合格\s*\*\*(\d+)[／/]1,000，尚差\s*(\d+)/);
const expectedDate=canonical.split('\n')[0].match(/\d{4}-\d\d-\d\d(?: \d\d:\d\d)?/)[0];
async function ready(page){await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});assert.deepEqual(await page.evaluate(()=>failedPaths),[]);}
(async()=>{
 for(const [engine,launcher] of (observe||live?[['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]])){
  const browser=await launcher.launch();try{
  for(const [size,width,height] of (engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],...observe||live?[]:[['small',320,740]]]:[['mobile',390,844]])){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
   const row={engine,size,errors:[],audits:[]};report.checks.push(row);save();page.on('pageerror',e=>row.errors.push(e.message));
   await page.goto(origin);await ready(page);
   await page.locator('.stats').scrollIntoViewIfNeeded();
   row.observedCount=await page.locator('.stat-card-audit .stat-figure strong').innerText();row.expectedCount=expected[1];
   if(!observe){
    await page.waitForFunction(value=>document.getElementById('audit-count').textContent===value,expected[1]);
    row.batch=await page.locator('#audit-status').innerText();assert(row.batch.includes(expectedDate));assert.match(row.batch,/台灣時間.*不是全庫重新驗證日期/);
    const json=await page.request.get(origin+'audit-summary.json');assert(json.ok());const summary=await json.json();assert.equal(summary.latestBatch.trimEnd(),canonical.trimEnd(),'real Jekyll JSON contains precisely the current canonical section');
    assert.match(await page.locator('.stat-card-audit').innerText(),/未獨立重現，不代表成功率/);
    const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({state:'normal',violations:scan.violations});assert.equal(scan.violations.length,0);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.equal(await page.locator('.stat-card-audit .stat-link').getAttribute('href'),'https://github.com/RichardHan/ai-agent-use-cases/blob/main/sources/qualification-audit-2026-10-16.md');
   }
   await page.screenshot({path:out+'/'+(observe?'before':'after')+'-'+engine+'-'+size+'.png'});
   if(observe){row.reproduced=row.observedCount!==row.expectedCount;assert(row.reproduced,'baseline must reproduce stale audit count');save();await context.close();continue;}
   // A separate page proves summary failure does not block the existing corpus.
   if(!live){
    const failurePage=await context.newPage();let mode='http';
    await failurePage.route('**/audit-summary.json',async route=>{
     if(mode==='timeout'){await new Promise(r=>setTimeout(r,9000));await route.fulfill({status:200,body:'{}'}).catch(()=>{});return;}
     if(mode==='http')return route.fulfill({status:404,body:'missing'});
     if(mode==='json')return route.fulfill({status:200,body:'{broken'});
     const payload=mode==='valid'?{latestBatch:canonical}:mode==='arithmetic'?{latestBatch:canonical.replace('尚差'+expected[2],'尚差1')}:{latestBatch:'2026-10-20 20:00 核對\n目前沒有數字\n## 歷史批次\n嚴格合格 **335／1,000，尚差665**'};
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
    });
    const checkFailure=async label=>{
     await failurePage.goto(origin+'?q=旅遊&scenario=生活');await ready(failurePage);await failurePage.locator('#audit-retry').waitFor({state:'visible'});
     assert.equal(await failurePage.locator('#audit-count').innerText(),'—');assert.match(await failurePage.locator('#audit-status').innerText(),/暫時無法讀取/);
     assert(await failurePage.locator('#results .card').count()>0);assert.equal(await failurePage.locator('#query').inputValue(),'旅遊');
     row.failures??=[];row.failures.push(label);save();
    };
    await checkFailure('HTTP 404 with usable combined search');await failurePage.locator('#audit-retry').focus();mode='valid';await failurePage.keyboard.press('Enter');
    await failurePage.waitForFunction(value=>document.getElementById('audit-count').textContent===value,expected[1]);
    assert.equal(await failurePage.evaluate(()=>document.activeElement.id),'audit-retry');assert(await failurePage.locator('#audit-retry').isVisible());
    await failurePage.screenshot({path:out+'/retry-'+engine+'-'+size+'.png'});
    const scan=await new AxeBuilder({page:failurePage}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({state:'retry success',violations:scan.violations});assert.equal(scan.violations.length,0);
    if(engine==='chromium'&&size==='mobile'){
     for(const fault of ['json','arithmetic','history','timeout']){mode=fault;await checkFailure(fault);}
     await failurePage.locator('.stats').scrollIntoViewIfNeeded();await failurePage.screenshot({path:out+'/error-mobile.png'});
     const scan=await new AxeBuilder({page:failurePage}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({state:'summary unavailable',violations:scan.violations});assert.equal(scan.violations.length,0);
    }
    await failurePage.close();
   }
   // Check the accessible report link against real GitHub once.
   if(engine==='chromium'&&size==='desktop'){
    const popupPromise=page.waitForEvent('popup');await page.locator('.stat-card-audit .stat-link').focus();await page.keyboard.press('Enter');const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');row.reportURL=popup.url();assert(row.reportURL.includes('qualification-audit-2026-10-16.md'));await popup.close();
   }
   assert.deepEqual(row.errors,[]);row.complete=true;save();await context.close();
  }
  // JavaScript disabled still provides the complete report, without a stale count.
  if(engine==='chromium'&&!observe){
   const context=await browser.newContext({javaScriptEnabled:false}),page=await context.newPage();await page.goto(origin);assert.equal(await page.locator('#audit-count').innerText(),'—');assert(await page.locator('.stat-card-audit a').isVisible());assert(await page.locator('noscript').innerText());report.noScript=true;save();await context.close();
  }
  }finally{await browser.close();}
 }
 save();console.log(JSON.stringify(report,null,2));
})().catch(e=>{report.error=e.stack;save();console.error(e);process.exit(1)});
