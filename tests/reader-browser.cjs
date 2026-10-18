'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.READER_URL||'http://127.0.0.1:8082/ai-agent-use-cases/';
const deployed=!!process.env.READER_DEPLOYED;
const audits=[],timings=[];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function deployedVersion(page){
 const paths=['assets/reader.js','assets/reader.css','assets/app.js','assets/style.css','assets/discovery.js','index.html'];
 const expected=paths.map(path=>fs.readFileSync(path,'utf8'));
 for(let attempt=0;attempt<30;attempt++){
  const responses=await Promise.all(paths.map(path=>page.request.get(origin+path,{headers:{'Cache-Control':'no-cache'}})));
  const observed=await Promise.all(responses.map(response=>response.text()));
  if(responses.every(response=>response.ok())&&observed.every((text,i)=>text===expected[i])){
   const {createHash}=require('node:crypto');
   fs.writeFileSync('qa-artifacts/reader-deployment.json',JSON.stringify({origin,verifiedAt:new Date().toISOString(),assets:paths.map((path,i)=>({path,sha256:createHash('sha256').update(observed[i]).digest('hex')}))},null,2));
   return;
  }
  await wait(10000);
 }
 throw Error('Published assets do not match this checkout');
}
async function visibleBelowToolbar(page,selector){
 const rect=await page.locator(selector).boundingBox();
 const toolbar=await page.locator('.detail-toolbar').boundingBox();
 const dialog=await page.locator('#detail').boundingBox();
 assert(rect.y>=toolbar.y+toolbar.height,'sticky toolbar must not cover target');
 assert(rect.y+rect.height<=dialog.y+dialog.height,'target must be visible inside the dialog');
}
async function ready(page,suffix=''){
 for(let attempt=0;attempt<(deployed?30:1);attempt++){
  await page.goto(origin+suffix,{waitUntil:'networkidle'});
  await page.locator('#results .card').first().waitFor();
  if(await page.evaluate(()=>typeof CaseReader!=='undefined'))return;
  if(deployed)await wait(10000);
 }
 throw Error('Published reader assets did not arrive');
}
async function audit(page,label){
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 audits.push({label,violations:result.violations});
 fs.writeFileSync('qa-artifacts/reader-accessibility.json',JSON.stringify(audits,null,2));
 assert.equal(result.violations.length,0,JSON.stringify(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))));
}
async function jump(page,button){
 const target=await button.getAttribute('aria-controls');
 const before=await page.evaluate(()=>({url:location.href,length:history.length,scroll:scrollY}));
 await button.focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('.research-details').evaluate(el=>el.open),true);
 assert.equal(await page.evaluate(id=>document.activeElement.id===id,target),true);
 await visibleBelowToolbar(page,'#'+target);
 assert.deepEqual(await page.evaluate(()=>({url:location.href,length:history.length,scroll:scrollY})),before,'jump preserves history and page behind dialog');
 await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('reader-return')),true);
 await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-nav-title');
 await visibleBelowToolbar(page,'#reader-nav-title');
 assert.deepEqual(await page.evaluate(()=>({url:location.href,length:history.length,scroll:scrollY})),before,'return preserves history and page behind dialog');
}
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['firefox',firefox],['webkit',webkit]]){
  const browser=await type.launch();
  const sizes=engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]];
  for(const [size,width,height] of sizes){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   if(deployed&&engine==='chromium'&&size==='desktop')await deployedVersion(page);
   await ready(page);
   timings.push(await page.evaluate(({engine,size})=>{
    const navigation=performance.getEntriesByType('navigation')[0];
    const assets=performance.getEntriesByType('resource').filter(r=>/assets\/reader\.(js|css)/.test(r.name));
    return {engine,size,domContentLoadedMs:Math.round(navigation.domContentLoadedEventEnd),loadMs:Math.round(navigation.loadEventEnd),readerAssets:assets.map(r=>({path:new URL(r.name).pathname,encodedBytes:r.encodedBodySize,durationMs:Math.round(r.duration)}))};
   },{engine,size}));
   fs.writeFileSync('qa-artifacts/reader-timings.json',JSON.stringify(timings,null,2));
   // Journey 1: search a practical need, combine filters, read and return.
   await page.locator('#query').fill('旅遊');
   await page.locator('#scenario').selectOption('生活');
   await page.locator('#tool').selectOption('Grok Bot');
   await page.locator('#category').selectOption('旅遊／消費研究');
   const count=await page.locator('#results .card').count();assert(count>0);
   const read=page.locator('#results .card .card-bottom button').first();
   const caseID=await page.locator('#results .card').first().getAttribute('data-case-id');
   await read.click();await page.locator('.reader-nav').waitFor();
   const listScroll=await page.evaluate(()=>scrollY);
   await jump(page,page.locator('.reader-jump').first());
   await page.keyboard.press('Escape');
   assert.equal(await read.evaluate(el=>el===document.activeElement),true);
   assert.equal(await page.locator('#query').inputValue(),'旅遊');
   assert.equal(await page.locator('#results .card').count(),count);
   assert.equal(await page.evaluate(()=>scrollY),listScroll);
   await read.click();await page.goBack();
   assert.equal(await page.locator('#detail').evaluate(el=>el.open),false);
   assert.equal(await page.evaluate(()=>document.activeElement.closest('.card')?.dataset.caseId),caseID);
   assert.equal(await page.evaluate(()=>scrollY),listScroll);
   await page.locator('#query').fill('no-matching-case-123');
   assert.equal(await page.locator('#empty').isVisible(),true);
   await page.locator('#empty-reset').click();
   // Journey 2: a shared long article, sources, refresh and keyboard outline.
   await ready(page,'?q=PR&case=UC-005');
   await page.locator('.reader-nav').waitFor();
   assert.equal(await page.locator('.detail-toolbar').evaluate(toolbar=>toolbar.scrollWidth<=toolbar.clientWidth),true,'toolbar fits narrow screens');
   assert.equal(await page.locator('.detail-toolbar-id').evaluate(id=>id.getBoundingClientRect().height<30),true,'case ID stays on one line');
   assert.match(await page.locator('.reader-evidence').innerText(),/日文作者實測報告/);
   assert.match(await page.locator('.reader-evidence').innerText(),/獨立重現：否/);
   if(engine==='chromium')await page.screenshot({path:`qa-artifacts/reader-after-UC-005-${size}.png`});
   await audit(page,`${engine}-${size}-collapsed`);
   const originalTitles=await page.locator('.research-details .markdown h2,.research-details .markdown h3').allTextContents();
   await page.locator('.reader-outline summary').click();
   assert.deepEqual(await page.locator('.reader-outline-jump').allTextContents(),originalTitles);
   const buttons=page.locator('.reader-outline-jump');
   for(const index of [0,Math.floor(originalTitles.length/2),originalTitles.length-1])await jump(page,buttons.nth(index));
   const sourceJump=page.locator('.reader-jump').filter({hasText:'來源與版本'});
   if(await sourceJump.count())await sourceJump.click();
   const popupPromise=page.waitForEvent('popup');
   await page.locator('.research-details .markdown a').first().click();
   const popup=await popupPromise;
   await popup.waitForLoadState('domcontentloaded').catch(()=>{});
   assert.match(popup.url(),/^https:\/\/zenn.dev\//);await popup.close();
   await audit(page,`${engine}-${size}-expanded`);
   await page.reload({waitUntil:'networkidle'});await page.locator('.reader-nav').waitFor();
   assert.equal(new URL(page.url()).searchParams.get('case'),'UC-005');
   assert.equal(await page.locator('.reader-nav').count(),1);
   await page.locator('.reader-jump').first().click();
   const oldID=await page.locator('#detail-toolbar-id').innerText();
   await page.keyboard.press('ArrowRight');
   assert.notEqual(await page.locator('#detail-toolbar-id').innerText(),oldID);
   assert.equal(await page.evaluate(()=>document.activeElement.id),'detail-title','new case must receive keyboard focus');
   assert.equal(await page.locator('.reader-nav').count(),1);
   // Editing a manual share URL must not trigger next/previous case navigation.
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Denied');}}}));
   await page.locator('#copy-case-link').click();await page.locator('.manual-share-link').waitFor();
   const editingID=await page.locator('#detail-toolbar-id').innerText();
   await page.keyboard.press('ArrowRight');
   assert.equal(await page.locator('#detail-toolbar-id').innerText(),editingID);
   // Journey 3: a recent failure report and a pending idea retain their limits.
   await ready(page,'?case=UC-313');await page.locator('.reader-nav').waitFor();
   assert.match(await page.locator('.reader-evidence').innerText(),/作者真實失敗自述/);
   await page.locator('.reader-jump').first().click();
   assert.match(await page.locator('.research-details').innerText(),/未證實實際重複寄送/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.getElementById('detail').scrollWidth<=document.getElementById('detail').clientWidth),true);
   if(engine==='chromium')await page.screenshot({path:`qa-artifacts/reader-result-UC-313-${size}.png`});
   await ready(page,'?case=P-003');
   await page.locator('.reader-evidence').waitFor();
   assert.equal(await page.locator('.reader-nav').count(),0,'no invented outline for a source without sections');
   assert.match(await page.locator('.reader-evidence').innerText(),/待查線索/);
   await audit(page,`${engine}-${size}-pending`);
   assert.deepEqual(errors,[]);
   console.log(`PASS ${engine} ${size}: search/filter/empty/back/focus, original outline, sticky offset, sources, direct-link/refresh, pending; axe=0`);
   await context.close();
  }
  if(engine==='chromium'&&!deployed){
   const page=await browser.newPage();
   await ready(page,'?case=UC-005');
   const report=await page.evaluate(()=>{
    let count=0,sections=0,proofs=0;
    for(const item of entries){
     showDetail(item,null,false);
     const body=document.getElementById('detail-body'),md=body.querySelector('.research-details .markdown');
     const headings=[...md.querySelectorAll('h2,h3')];
     const links=[...body.querySelectorAll('.reader-outline-jump')];
     if(headings.length!==links.length)throw Error('Outline mismatch '+item.id);
     if(new Set(headings.map(h=>h.id)).size!==headings.length)throw Error('Duplicate heading id '+item.id);
     for(let i=0;i<headings.length;i++)if(headings[i].textContent!==links[i].textContent)throw Error('Changed heading '+item.id);
     for(const anchor of body.querySelectorAll('.reader-evidence a'))if(!/^https?:/.test(anchor.href)||anchor.rel!=='noopener noreferrer')throw Error('Unsafe source '+item.id);
     count++;sections+=headings.length;proofs+=body.querySelectorAll('.reader-evidence li').length;
    }
    return {entries:count,sections,proofRows:proofs};
   });
   fs.writeFileSync('qa-artifacts/reader-corpus.json',JSON.stringify(report,null,2));console.log('PASS CORPUS '+JSON.stringify(report));
   // No headings, duplicate headings, malicious-looking text and missing metadata.
   await page.evaluate(()=>showDetail(metadata('# UC-999：測試\n\n## 重複 <img src=x onerror=alert(1)>\n\n## 重複 <img src=x onerror=alert(1)>\n\n[bad](javascript:alert)\n\n## 權限\n\n測試','cases/999-test.md','case'),null,false));
   assert.equal(await page.locator('.reader-nav img,.reader-evidence img,.research-details img').count(),0);
   assert.match(await page.locator('.reader-evidence').innerText(),/未列統一證據欄位/);
   assert.equal(await page.locator('.reader-outline-jump').count(),3);
   await page.route('**/catalog.json',route=>route.fulfill({status:503,body:'unavailable'}));
   await page.goto(origin,{waitUntil:'networkidle'});
   assert.equal(await page.locator('#error').isVisible(),true);
   await page.unroute('**/catalog.json');await page.locator('#retry').click();await page.locator('#results .card').first().waitFor();
   console.log('PASS: corpus, missing evidence, duplicate/unsafe text, network failure and retry');
   const fallback=await browser.newPage();
   await fallback.route('**/assets/reader.js',route=>route.abort());
   await fallback.goto(origin+'?case=UC-005',{waitUntil:'networkidle'});
   await fallback.locator('#detail[open]').waitFor();
   assert.equal(await fallback.locator('.reader-nav').count(),0);
   await fallback.locator('.research-details summary').click();
   assert((await fallback.locator('.research-details .markdown h2').count())>0);
   assert.equal(await fallback.locator('#error').isVisible(),false);
   console.log('PASS: a missing optional reader script preserves original detail reading');
   await fallback.close();
  }
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
