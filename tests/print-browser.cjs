'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const base=process.env.PRINT_URL||'http://127.0.0.1:8108/ai-agent-use-cases/';
const observe=process.env.OBSERVE==='1',label=process.env.LABEL||(observe?'before':'after');
const normalize=s=>s.normalize('NFKC').replace(/[\s\u200b\uFEFF]/gu,'');
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});const reports=[];
 const save=()=>fs.writeFileSync(`qa-artifacts/${label}-report.json`,JSON.stringify(reports,null,2));
 for(const [engine,type] of observe?[['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]]){
 const browser=await type.launch();
 for(const [width,height] of engine==='chromium'?[[1440,1000],[390,844]]:[[390,844]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
 const report={engine,width,errors:[],checks:[]};reports.push(report);save();page.on('pageerror',e=>{report.errors.push(e.message);save();});
 await page.goto(base,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
 report.entries=await page.locator('#case-count').innerText();report.results=await page.locator('#results-count').innerText();save();
 if(process.env.VERIFY_ASSETS)for(const path of ['assets/app.js','assets/reader.js','assets/reader.css'])assert.equal(await(await page.request.get(base+path)).text(),fs.readFileSync(path,'utf8'),'published '+path);
 await page.screenshot({path:`qa-artifacts/${label}-home-${engine}-${width}.png`});
 await page.locator('#query').fill('旅遊');
 await require('./filter-controls.cjs').ensureFiltersVisible(page);
 await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');
 const read=page.locator('#results .card .card-bottom button').first();await read.click();
 await page.keyboard.press('Escape');assert(await read.evaluate(e=>e===document.activeElement));assert.equal(await page.locator('#query').inputValue(),'旅遊');
 await page.locator('#query').fill('no-match-398239');assert(await page.locator('#empty').isVisible());
 report.checks.push('travel / combined filters / empty / return focus');save();
 // Published baseline needs one representative long case; acceptance covers all three states.
 for(const id of !observe&&engine==='chromium'?['UC-005','UC-313','P-003']:['UC-005']){
 await page.goto(base+'?case='+id,{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
 await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
 const prefix=`qa-artifacts/${label}-${engine}-${width}-${id}`;
 await page.screenshot({path:prefix+'-screen.png'});
 if(id==='UC-005'){
  await page.locator('.research-details>summary').click();
  const link=page.locator('.research-details a[href^="https:"]').first();report.source=await link.getAttribute('href');
  const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;
  await popup.waitForLoadState('domcontentloaded',{timeout:20000}).catch(()=>{});report.sourceOpened=popup.url();await popup.close();
  await page.locator('.research-details>summary').click();save();
 }
 if(!observe){
  // Exercise the visible control without opening an OS print dialog on the runner.
  await page.evaluate(()=>{window.print=()=>{window.__printCalls=(window.__printCalls||0)+1;dispatchEvent(new Event('beforeprint'));dispatchEvent(new Event('afterprint'));};});
  const button=page.locator('#print-case');await button.focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.__printCalls),1);
  assert.equal(await page.locator('.research-details').evaluate(e=>e.open),false);
  assert(await button.evaluate(e=>e===document.activeElement));
 }
 const original=await page.locator('.research-details').evaluate(e=>{
  const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);const text=[];let node;
  while(node=walker.nextNode())if(node.textContent.trim()&&!node.parentElement.closest('button,summary'))text.push(node.textContent.trim());
  return {text,urls:[...e.querySelectorAll('a[href^="http"]')].map(a=>a.href)};
 });
 if(engine==='chromium'){
  // Remove the previous screen emulation so PDF uses native print media.
  await page.emulateMedia({media:null});
  const prior=await page.evaluate(()=>({scroll:document.querySelector('#detail').scrollTop,open:document.querySelector('.research-details').open,focus:document.activeElement.id}));
  await page.pdf({path:prefix+'.pdf',format:'A4',printBackground:true});
  const text=normalize(execFileSync('pdftotext',['-layout',prefix+'.pdf','-'],{encoding:'utf8'}));
  const missing=original.text.filter(s=>!text.includes(normalize(s)));
  const missingURLs=original.urls.filter(s=>!text.includes(normalize(s)));
  const pages=Number(execFileSync('pdfinfo',[prefix+'.pdf'],{encoding:'utf8'}).match(/Pages:\s*(\d+)/)[1]);
  report.checks.push({id,pages,textNodes:original.text.length,missing,missingURLs});save();
  for(const [number,suffix] of [[1,'first'],[pages,'last']])execFileSync('pdftoppm',['-f',String(number),'-singlefile','-scale-to','1400','-png',prefix+'.pdf',prefix+'-'+suffix]);
  if(!observe){
   assert.deepEqual(missing,[],'PDF retains every original text node');assert.deepEqual(missingURLs,[],'offline source URLs');
   assert(!text.includes(normalize('今天，想讓 AI')),'no homepage background');assert(!text.includes('回到閱讀導覽'),'no reading controls');
   for(const control of ['← 上一則','下一則 →','關閉 ✕'])assert(!text.includes(normalize(control)),'no toolbar '+control);
   assert(text.includes(normalize(id.startsWith('P-')?'待查線索：證據尚不足，不列成功或已完成案例。':'收錄不代表獨立重現或取得執行授權。')),'uncertainty survives PDF');
   assert.deepEqual(await page.evaluate(()=>({scroll:document.querySelector('#detail').scrollTop,open:document.querySelector('.research-details').open,focus:document.activeElement.id})),prior,'native PDF print restores disclosure, scroll and focus');
  }
 }
 if(!observe)await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
 await page.emulateMedia({media:'print'});
 await page.screenshot({path:prefix+'-print.png'});
 const state=await page.evaluate(()=>({dialog:{height:document.querySelector('#detail').clientHeight,scrollHeight:document.querySelector('#detail').scrollHeight,overflow:getComputedStyle(document.querySelector('#detail')).overflowY},researchHeight:document.querySelector('.research-details .markdown').getBoundingClientRect().height,lastBlockHeight:document.querySelector('.research-details .markdown').lastElementChild.getBoundingClientRect().height,mainVisible:getComputedStyle(document.querySelector('main')).display!=='none',printButton:!!document.querySelector('#print-case')}));
 report.checks.push({id,state});save();
 if(!observe){assert(state.printButton);assert(state.researchHeight>0);assert(state.lastBlockHeight>0,'last original block is rendered');assert(!state.mainVisible);assert(state.dialog.scrollHeight<=state.dialog.height+2,'no clipping');}
 await page.emulateMedia({media:'screen'});
 if(!observe)await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.checks.push({id,axe:axe.violations.map(v=>v.id)});save();assert.equal(axe.violations.length,0);
 if(!observe){
  // A second cycle with an already expanded original must preserve the reader's choice.
  await page.locator('.research-details>summary').click();
  const state=await page.evaluate(()=>{const d=document.querySelector('#detail');d.scrollTop=400;const before=d.scrollTop;dispatchEvent(new Event('beforeprint'));dispatchEvent(new Event('beforeprint'));dispatchEvent(new Event('afterprint'));return {before,after:d.scrollTop,open:document.querySelector('.research-details').open};});
  assert(state.open);assert.equal(state.before,state.after);
 }
 await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
 await page.keyboard.press('Escape');assert(!new URL(page.url()).searchParams.has('case'));
 }
 await page.emulateMedia({media:'print'});assert(await page.locator('main').isVisible(),'homepage prints normally without a dialog');await page.emulateMedia({media:'screen'});
 assert.deepEqual(report.errors,[]);await context.close();save();
 }
 await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
