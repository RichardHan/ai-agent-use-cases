'use strict';
const sourceRoute=require('./source-route.cjs');
const {ensureFiltersVisible}=require('./filter-controls.cjs');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.READER_URL||'http://127.0.0.1:8082/ai-agent-use-cases/';
const deployed=!!process.env.READER_DEPLOYED;
const {skipIfSupersededPublishedUrl}=require('../scripts/published-check.cjs');
if(deployed&&skipIfSupersededPublishedUrl(origin)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
const requestedEngine=process.env.READER_ENGINE||'';
if(requestedEngine&&!['chromium','firefox','webkit'].includes(requestedEngine))throw Error('Unknown READER_ENGINE: '+requestedEngine);
const audits=[],timings=[];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function deployedVersion(page){
 const paths=['assets/reader.js','assets/reader.css','assets/app.js','assets/style.css','assets/discovery.js','index.html'];
 const expected=paths.map(path=>fs.readFileSync(path,'utf8'));
 for(let attempt=0;attempt<151;attempt++){
  if(attempt>0&&attempt%6===0&&skipIfSupersededPublishedUrl(origin)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
  const responses=await Promise.all(paths.map(path=>page.request.get(origin+path,{headers:{'Cache-Control':'no-cache'},timeout:5000}).catch(()=>null)));
  const observed=await Promise.all(responses.map(response=>response?response.text():''));
  if(responses.every(Boolean)&&responses.every(response=>response.ok())&&observed.every((text,i)=>text===expected[i])){
   const {createHash}=require('node:crypto');
   fs.writeFileSync('qa-artifacts/reader-deployment.json',JSON.stringify({origin,verifiedAt:new Date().toISOString(),assets:paths.map((path,i)=>({path,sha256:createHash('sha256').update(observed[i]).digest('hex')}))},null,2));
   return;
  }
  await wait(10000);
 }
 if(skipIfSupersededPublishedUrl(origin)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
 throw Error('Published assets do not match this checkout within 25 minutes (151 attempts)');
}
async function visibleBelowToolbar(page,selector){
 const rect=await page.locator(selector).boundingBox();
 const toolbar=await page.locator('.detail-toolbar').boundingBox();
 const dialog=await page.locator('#detail').boundingBox();
 assert(rect.y>=toolbar.y+toolbar.height,'sticky toolbar must not cover target');
 assert(rect.y+rect.height<=dialog.y+dialog.height,'target must be visible inside the dialog');
}
async function ready(page,suffix=''){
 for(let attempt=0;attempt<(deployed?151:1);attempt++){
  if(deployed&&attempt>0&&attempt%6===0&&skipIfSupersededPublishedUrl(origin)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
  await page.goto(origin+suffix,{waitUntil:'networkidle'});
  await page.locator('#results .card').first().waitFor();
  if(await page.evaluate(()=>typeof CaseReader!=='undefined'))return;
  if(deployed)await wait(10000);
 }
 if(deployed&&skipIfSupersededPublishedUrl(origin)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
 throw Error('Published reader assets did not arrive within 25 minutes (151 attempts)');
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
 const position=page.locator('.reader-position');
 if(target.startsWith('reader-section-')&&await position.count()){
  const index=Number(target.slice('reader-section-'.length));
  const total=await page.locator('.research-details .markdown h2,.research-details .markdown h3').count();
  const title=await page.locator('#'+target).innerText();
  await page.waitForFunction(({index,total,title})=>{const meter=document.querySelector('.reader-progress-bar');return meter?.value===index+1&&meter.max===total&&document.querySelector('.reader-position-label')?.textContent.includes(title);},{index,total,title});
 }
 await visibleBelowToolbar(page,'#'+target);
 await page.keyboard.press('Tab');
 if(page.context().browser()?.browserType().name()==='webkit'&&process.platform==='darwin'&&!await page.evaluate(()=>document.activeElement.classList.contains('reader-return'))){
  await page.locator('.reader-return').first().focus();
 }
 assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('reader-return')),true);
 await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-nav-title');
 await visibleBelowToolbar(page,'#reader-nav-title');
 assert.deepEqual(await page.evaluate(()=>({url:location.href,length:history.length,scroll:scrollY})),before,'return preserves history and page behind dialog');
}
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['firefox',firefox],['webkit',webkit]].filter(([name])=>!requestedEngine||name===requestedEngine)){
  const browser=await type.launch();
  if(!deployed)await require('./mobile-search-browser.cjs')({browser,origin,prefix:engine+'-mobile-search',sizes:[['mobile',390,844]]});
  const sizes=engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]];
  if(deployed&&engine==='chromium'){
   const versionPage=await browser.newPage();await deployedVersion(versionPage);await versionPage.close();
  }
  if(deployed){
   await require('./arrival-live.cjs')({browser,origin,engine});
   await browser.close();continue;
  }
  await require('./arrival-browser.cjs')({browser,origin,prefix:(deployed?'live-':'')+engine+'-arrival',sizes});
  await require('./arrival-live.cjs')({browser,origin,engine,prefix:'preview-'+engine});
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
   await ensureFiltersVisible(page);
   await page.locator('#scenario').selectOption('生活');
   await ensureFiltersVisible(page);
   await page.locator('#tool').selectOption('Grok Bot');
   await ensureFiltersVisible(page);
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
   const earlySource=page.locator('.reader-source-shortcut');
   assert.equal(await earlySource.count(),1,'shared case offers a source-and-version route near its purpose');
   assert.equal(await earlySource.evaluate(el=>!!(el.compareDocumentPosition(document.querySelector('.detail-actions'))&Node.DOCUMENT_POSITION_FOLLOWING)),true,'source route precedes secondary actions');
   if(size!=='desktop'){
     const earlyMethod=page.locator('.reader-method-shortcut');
     assert.equal(await earlyMethod.count(),1,'long shared case has a direct original-method route');
     assert.equal(await earlyMethod.evaluate(el=>!!(el.compareDocumentPosition(document.querySelector('.detail-actions'))&Node.DOCUMENT_POSITION_FOLLOWING)),true,'original-method route precedes secondary share actions on mobile');
     await earlyMethod.focus();
     await page.keyboard.press('Shift+Tab');
     assert.equal(await page.evaluate(()=>document.activeElement.id),'close-detail','reverse Tab from the first method control returns to the toolbar close button');
   }
  const placement=await page.evaluate(()=>{
   const dialog=document.createElement('dialog');dialog.open=true;
   dialog.style.cssText='position:fixed;left:-1600px;top:0;width:320px;height:620px';
   const toolbar=document.createElement('header');toolbar.className='detail-toolbar';
   const toolbarLeft=document.createElement('div');toolbarLeft.className='detail-toolbar-left';toolbar.append(toolbarLeft);dialog.append(toolbar);
   const body=document.createElement('div');body.className='detail-body';dialog.append(body);
   const proof=document.createElement('p');proof.className='detail-proof-note';proof.textContent='作者自述，未獨立重現';
   const overview=document.createElement('section');overview.className='plain-overview';
   const purpose=document.createElement('section');purpose.textContent='實際用途';
   const targetUser=document.createElement('section');targetUser.className='detail-target-user';targetUser.textContent='適合對象';
   overview.append(purpose,targetUser);body.append(proof,overview);
   const research=document.createElement('details');research.className='research-details';
   const summary=document.createElement('summary');summary.textContent='完整研究';
   const markdown=document.createElement('div');markdown.className='markdown';
   for(let i=0;i<12;i++){
    const heading=document.createElement('h2');heading.textContent=i===0?'建議操作流程（本庫設計，未實測）':`來源段落 ${i+1}`;
    const paragraph=document.createElement('p');paragraph.textContent=`來源內容 ${i+1}`;
    markdown.append(heading,paragraph);
   }
   research.append(summary,markdown);body.append(research);document.body.append(dialog);
   window.CaseReader.enhance(body,{kind:'case',proof:'author-demo'});
   const evidence=body.querySelector('.reader-evidence');
   const original=overview.querySelector('.reader-original-open');
   const method=overview.querySelector('.reader-method-shortcut');
   const targetIndex=[...overview.children].indexOf(targetUser);
   const result={
    proofInEvidence:evidence.contains(proof)&&proof.parentElement===evidence,
    proofRemovedFromOriginalPosition:body.firstElementChild===overview,
    originalBeforeTarget:[...overview.children].indexOf(original)<targetIndex,
    methodBeforeTarget:[...overview.children].indexOf(method)<targetIndex
   };
   original.click();result.originalOpensResearch=research.open;
   research.open=false;method.click();const methodTarget=body.querySelector('#'+method.getAttribute('aria-controls'));result.methodOpensHeading=research.open&&methodTarget?.textContent==='建議操作流程（本庫設計，未實測）';
   result.initialPositionCount=toolbarLeft.querySelectorAll('.reader-position').length;
   const article=count=>{
    const details=document.createElement('details');details.className='research-details';
    details.append(document.createElement('summary'));
    const content=document.createElement('div');content.className='markdown';
    for(let i=0;i<count;i++){const heading=document.createElement('h2');heading.textContent=`替換段落 ${i+1}`;content.append(heading,document.createElement('p'));}
    details.append(content);return details;
   };
   const overviewFor=()=>{const node=document.createElement('section');node.className='plain-overview';return node;};
   body.replaceChildren(overviewFor(),article(12));window.CaseReader.enhance(body,{kind:'case',proof:'author-demo'});
   result.longReplacementCount=toolbarLeft.querySelectorAll('.reader-position').length;
   body.replaceChildren(overviewFor(),article(2));window.CaseReader.enhance(body,{kind:'case',proof:'author-demo'});
   result.shortClearsPosition=toolbarLeft.querySelectorAll('.reader-position').length===0&&!toolbarLeft.classList.contains('reader-has-position');
   body.replaceChildren(overviewFor(),article(12));window.CaseReader.enhance(body,{kind:'case',proof:'author-demo'});
   result.reopenedPositionCount=toolbarLeft.querySelectorAll('.reader-position').length;
   dialog.remove();return result;
  });
  assert.deepEqual(placement,{proofInEvidence:true,proofRemovedFromOriginalPosition:true,originalBeforeTarget:true,methodBeforeTarget:true,originalOpensResearch:true,methodOpensHeading:true,initialPositionCount:1,longReplacementCount:1,shortClearsPosition:true,reopenedPositionCount:1},'reader enhancements must preserve a single long-case position tracker across detail replacement');
   assert.equal(await page.locator('.research-details').evaluate(el=>el.open),false,'original research stays collapsed before the reader chooses it');
   const originalEntry=page.locator('.reader-original-open');
   assert.equal(await originalEntry.count(),1,'long cases have a stable route to the complete original');
   assert.match(await originalEntry.innerText(),/查看完整原始研究、來源與提示詞/);
   assert.equal(await originalEntry.evaluate(el=>!!el.closest('.plain-overview')),true,'the route is near the case purpose, not buried in the outline');
   await originalEntry.scrollIntoViewIfNeeded();
   await visibleBelowToolbar(page,'.reader-original-open');
   await originalEntry.focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('.research-details').evaluate(el=>el.open),true);
   assert.equal(await page.evaluate(()=>document.activeElement===document.querySelector('.research-details > summary')),true,'opening original research moves focus to its summary');
   await visibleBelowToolbar(page,'.research-details > summary');
   await page.keyboard.press('Tab');
   if(engine==='webkit'&&process.platform==='darwin'&&!await page.evaluate(()=>document.activeElement.classList.contains('reader-return'))){
     await page.locator('.research-details > summary + .reader-return').focus();
   }
   assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('reader-return')),true,'keyboard focus moves from the summary to a return control');
   await page.keyboard.press('Enter');
   assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-nav-title','the original has a direct keyboard-operable return to its reader navigation');
   await visibleBelowToolbar(page,'#reader-nav-title');
   await page.locator('.research-details > summary').focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('.research-details').evaluate(el=>el.open),false,'the original can be collapsed again without losing its reader route');
   await page.locator('#reader-nav-title').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('.detail-toolbar').evaluate(toolbar=>toolbar.scrollWidth<=toolbar.clientWidth),true,'toolbar fits narrow screens');
   assert.equal(await page.locator('.detail-toolbar-id').evaluate(id=>id.getBoundingClientRect().height<30),true,'case ID stays on one line');
   assert.equal(await page.locator('.detail-toolbar-actions button').evaluateAll(buttons=>buttons.every(button=>button.getBoundingClientRect().height>=26)),true,'toolbar controls retain usable target height');
   assert.match(await page.locator('.reader-nav-hint').innerText(),/不代表本庫獨立重現/);
   await page.locator('.reader-nav-hint').scrollIntoViewIfNeeded();
   await visibleBelowToolbar(page,'.reader-nav-hint');
   assert.match(await page.locator('.reader-evidence').innerText(),/日文作者實測報告/);
   assert.match(await page.locator('.reader-evidence').innerText(),/獨立重現：否/);
   if(engine==='chromium')await page.screenshot({path:`qa-artifacts/reader-after-UC-005-${size}.png`});
   await page.locator('.reader-jump').nth(1).hover();
   await audit(page,`${engine}-${size}-collapsed`);
   const originalTitles=await page.locator('.research-details .markdown h2,.research-details .markdown h3').allTextContents();
   await page.locator('.reader-outline summary').click();
   assert.deepEqual(await page.locator('.reader-outline-jump').allTextContents(),originalTitles);
   const buttons=page.locator('.reader-outline-jump');
   const sectionIndexes=[0,Math.floor(originalTitles.length/2),originalTitles.length-1];
   for(const index of sectionIndexes){
    await jump(page,buttons.nth(index));
    if(engine==='chromium'&&size==='desktop'&&index===Math.floor(originalTitles.length/2)){
     await buttons.nth(index).focus();await page.keyboard.press('Enter');
     await page.waitForFunction(value=>document.querySelector('.reader-progress-bar').value===value,index+1);
     const positionBeforeResize=await page.evaluate(()=>{const detail=document.querySelector('#detail');window.__blockedReaderScrollEvents=0;window.__blockReaderScroll=event=>{window.__blockedReaderScrollEvents++;event.stopImmediatePropagation();};detail.addEventListener('scroll',window.__blockReaderScroll,true);return {scroll:detail.scrollTop,value:document.querySelector('.reader-progress-bar').value};});
     assert.equal(positionBeforeResize.value,index+1,'reader starts at the selected section before resize');
     const expandedHeight=await page.evaluate(()=>Math.max(innerHeight*2,Math.ceil((document.querySelector('.research-details .markdown').getBoundingClientRect().bottom-document.querySelector('#detail').getBoundingClientRect().top)/.8)+200));
     await page.setViewportSize({width,height:expandedHeight});
     await page.waitForFunction(total=>document.querySelector('.reader-progress-bar').value===total,originalTitles.length);
     assert.equal(await page.locator('.reader-progress-bar').evaluate(el=>el.max),originalTitles.length,'resizing to reveal the full original updates the progress range');
     assert.equal(await page.evaluate(()=>document.activeElement.id),`reader-section-${index}`,'resize does not steal keyboard focus');
     assert.equal(page.url(),await page.evaluate(()=>location.href),'resize does not change the shared case URL');
     await page.evaluate(()=>{const detail=document.querySelector('#detail');detail.removeEventListener('scroll',window.__blockReaderScroll,true);delete window.__blockReaderScroll;delete window.__blockedReaderScrollEvents;});
     await page.setViewportSize({width,height});
    }
   }
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
   await page.locator('.detail-action-copy').click();
   await page.locator('.detail-action-manual-copy').waitFor({state:'visible'});
   await page.evaluate(()=>window.refreshRelated());
   assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('detail-action-manual-copy')),true,'related refresh preserves focus in the manual note-copy fallback');
   assert.match(await page.locator('.detail-action-manual-copy').inputValue(),/來源證據：/);

   // Journey 3: a recent failure report and a pending idea retain their limits.
   await ready(page,'?case=UC-313');await page.locator('.reader-nav').waitFor();
   assert.match(await page.locator('.reader-evidence').innerText(),/作者真實失敗自述/);
   await page.locator('.reader-jump').first().click();
   assert.match(await page.locator('.research-details').innerText(),/未證實實際重複寄送/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.getElementById('detail').scrollWidth<=document.getElementById('detail').clientWidth),true);
   if(engine==='chromium')await page.screenshot({path:`qa-artifacts/reader-result-UC-313-${size}.png`});
   await ready(page,'?case=P-003');
   await page.locator('.reader-evidence').waitFor();
   assert.equal(await page.locator('.reader-outline').count(),0,'no invented headings for a source without sections');
   assert.equal(await page.locator('.reader-jump').count(),0,'no invented quick sections');
   assert.equal(await page.locator('.reader-review-jump').count(),1,'the original pending source remains reachable');
   await page.locator('.reader-review > summary').click();
   await page.locator('.reader-review-jump').click();
   assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-source-meta');
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
   const resilient=await browser.newPage();
   await sourceRoute(resilient,'**/cases/001-travel-checkout.md',route=>route.fulfill({status:404,body:'Not found'}));
   await resilient.goto(origin,{waitUntil:'networkidle'});
   await resilient.locator('#results .card').first().waitFor();
   assert.equal(await resilient.locator('#error').isVisible(),false);
   assert.match(await resilient.locator('#results-count').innerText(),/1 個來源檔案未載入/);
   const available=await resilient.evaluate(()=>currentFiltered.length);
   assert(available>=300,'a failed source leaves the rest of the searchable corpus available');
   assert.match(await resilient.locator('#results-count').innerText(),new RegExp(`顯示 ${available} / ${available} 筆收錄`));
   console.log('PASS: resilient loader keeps catalog working when a single markdown case fails');
   await resilient.close();
   const copyFallback=await browser.newPage();
   await copyFallback.route('**/assets/copy.json',route=>route.fulfill({status:404,body:'Not found'}));
   await copyFallback.goto(origin,{waitUntil:'networkidle'});
   await copyFallback.locator('#results .card').first().waitFor();
   assert.equal(await copyFallback.locator('#error').isVisible(),false);
   console.log('PASS: missing copy.json degrades gracefully to markdown copy without crashing');
   await copyFallback.close();
  }
  if(engine!=='chromium')await require('./search-recovery-browser.cjs')({browser,origin,prefix:engine+'-search',sizes:[['mobile',390,844]]});
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
