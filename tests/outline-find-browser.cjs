'use strict';
const playwright=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.OUTLINE_URL||'http://127.0.0.1:8094/ai-agent-use-cases/';
const out=process.env.OUTLINE_OUTPUT||'qa-artifacts/outline-find',observe=process.env.OUTLINE_OBSERVE==='1';
const engine=process.env.OUTLINE_ENGINE||'chromium';
fs.mkdirSync(out,{recursive:true});const reports=[];
(async()=>{const browser=await playwright[engine].launch();try{for(const width of (engine==='chromium'?[1440,390,320]:[390])){
 const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'}),page=await context.newPage();
 const report={engine,width,errors:[],audits:[]};reports.push(report);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(base+'?case=UC-005');await page.locator('#detail[open]').waitFor({timeout:90000});
 await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
 const outline=page.locator('.reader-outline');await outline.locator('summary').click();
 report.sections=await outline.locator('li').count();
 const revealOutline=async()=>{await page.waitForTimeout(100);await outline.locator('summary').evaluate(e=>{const d=e.closest('dialog');d.scrollTop+=e.getBoundingClientRect().top-d.querySelector('.detail-toolbar').getBoundingClientRect().bottom-16;});await page.waitForTimeout(100);};
 await revealOutline();await page.screenshot({path:`${out}/outline-${width}.png`});
 if(observe){report.finderCount=await page.locator('#reader-outline-query').count();await page.close();continue;}
 const input=page.locator('#reader-outline-query'),status=page.locator('#reader-outline-status');
 const original=await page.locator('.research-details .markdown').textContent();
 const url=page.url();await input.fill('獨立審查');
 assert.equal(await outline.locator('li:visible').count(),1);assert.match(await status.innerText(),/找到 1/);
 const destination=await outline.locator('li:visible button').getAttribute('aria-controls');
 assert.equal(await outline.locator('li:visible').evaluate(e=>e.value),Number(destination.split('-').pop())+1);
 await revealOutline();await page.screenshot({path:`${out}/found-${width}.png`});
 // IME confirmation must not become navigation, including Safari's 229 path.
 await input.focus();
 for(const mode of ['state','229','flag']){
  const prevented=await input.evaluate((e,mode)=>{
   if(mode==='state')e.dispatchEvent(new CompositionEvent('compositionstart'));
   const event=new KeyboardEvent('keydown',{key:'Enter',keyCode:mode==='229'?229:13,isComposing:mode==='flag',bubbles:true,cancelable:true});
   e.dispatchEvent(event);
   if(mode==='state')e.dispatchEvent(new CompositionEvent('compositionend'));
   return event.defaultPrevented;
  },mode);
  assert.equal(prevented,false,'IME '+mode+' is not a navigation action');
  assert(await input.evaluate(e=>e===document.activeElement));
  assert.equal(await page.locator('.research-details').evaluate(e=>e.open),false);
 }
 await input.press('Enter');
 assert.match(await page.evaluate(()=>document.activeElement.textContent),/獨立審查/);
 const position=await page.evaluate(()=>({heading:document.activeElement.getBoundingClientRect().top,toolbar:document.querySelector('.detail-toolbar').getBoundingClientRect().bottom}));
 assert(position.heading>=position.toolbar-1);assert.equal(page.url(),url);
 assert.equal(await page.locator('.research-details .markdown').textContent(),original);
 await page.screenshot({path:`${out}/destination-${width}.png`});
 await page.keyboard.press('Tab');
 report.nativeTabToReturn=await page.evaluate(()=>document.activeElement.classList.contains('reader-return'));
 if(!report.nativeTabToReturn&&engine==='webkit'&&process.platform==='darwin'){
  // macOS WebKit's default keyboard preference omits buttons from Tab order.
  // Record that limitation, then verify Enter on the existing return control.
  await page.locator('#'+destination+' + .reader-return').focus();
 }else assert(report.nativeTabToReturn);
 await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-nav-title');
 await input.fill('可貼指令');
 report.repeatedMatches=await outline.locator('li:visible').count();assert(report.repeatedMatches>1);
 const titles=await outline.locator('li:visible').allTextContents();assert(titles.every(t=>/未測/.test(t)));
 await input.fill('沒有這段 <script>');assert.equal(await outline.locator('li:visible').count(),0);
 assert.match(await status.innerText(),/沒有符合/);assert.equal(await page.locator('.reader-outline script').count(),0);
 await page.screenshot({path:`${out}/empty-${width}.png`});
 await input.press('Enter');assert(await input.evaluate(e=>e===document.activeElement));
 await page.locator('.reader-outline-clear').click();assert.equal(await input.inputValue(),'');
 assert(await input.evaluate(e=>e===document.activeElement));assert.equal(await outline.locator('li:visible').count(),report.sections);
 await input.fill('不存在');await input.fill('');assert.equal(await outline.locator('li:visible').count(),report.sections);
 const audit=async state=>{const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations;report.audits.push({state,violations:violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))});assert.deepEqual(violations,[]);};
 await audit('long outline');
 assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 // Short case: keep the small original TOC, search/filter and return still work.
 await page.goto(base+'?q=旅遊&scenario=生活&case=UC-001');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);
 assert.equal(await page.locator('#reader-outline-query').count(),0);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
 await page.locator('#query').fill('no-outline-match-123');assert(await page.locator('#empty').isVisible());
 await page.locator('#empty-reset').click();assert(await page.locator('#results .card').count()>0);
 // Direct link/reload + sparse pending: no fabricated sections.
 await page.goto(base+'?case=UC-005');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);
 await page.reload();await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);
 await page.locator('.reader-outline summary').click();await page.locator('#reader-outline-query').fill('交接');assert(await page.locator('.reader-outline li:visible').count()>0);
 await audit('filtered outline');
 await page.waitForFunction(()=>discoveryReady);
 await page.evaluate(()=>showDetail(metadata('# P-999：待查\n\n尚無段落','sources/pending.md','pending'),null,false));
 assert.equal(await page.locator('.reader-outline').count(),0);assert.equal(await page.locator('#reader-outline-query').count(),0);
 assert.deepEqual(report.errors,[]);report.completed=true;await context.close();
}}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(reports,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
