'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'http://127.0.0.1:8163/ai-agent-use-cases/',out=process.env.QA_OUT||'qa-artifacts/after';fs.mkdirSync(out,{recursive:true});
const ready=page=>page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
const save=(rows)=>fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));
(async()=>{const report=[];
for(const [engine,width] of [[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
 const label=engine.name()+'-'+width,row={label,errors:[],audits:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 try{
 // 1. First visitor: problem search + combined filters, read and return to the same card.
 await page.goto(base);await ready(page);row.corpus=await page.evaluate(()=>({entries:entries.length,missing:failedPaths}));assert.deepEqual(row.corpus.missing,[]);
 await page.locator('.hero-search-link').click();await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(n=>n.open=true);await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');await page.locator('#search-submit').click();row.results=await page.locator('#results-count').innerText();
 const trigger=page.locator('#results .card[data-case-id="UC-001"] .card-bottom button');await trigger.click();await page.locator('#detail[open]').waitFor();await page.keyboard.press('Escape');assert(await trigger.evaluate(n=>n===document.activeElement));assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
 // 2. Shared comparison: retain all literal cells and source caveats; keyboard scrolling cannot change case.
 await page.goto(base+'?case=UC-400');await page.locator('#detail[open]').waitFor();await ready(page);await page.locator('.research-details summary').click();
 const wrap=page.locator('.markdown-table').first(),table=wrap.locator('table');assert.equal(await table.locator('thead th[scope="col"]').count(),4);assert.equal(await table.locator('tbody tr').count(),6);
 const original=fs.readFileSync('cases/400-x-api-read-only-creator-bots-cost-estimate-vs-bill.md','utf8').split('\n').filter(l=>l.startsWith('|')&&!/^\| ---/.test(l)).map(l=>l.slice(1,-1).split('|').map(c=>c.trim()));
 const actual=await table.locator('tr').evaluateAll(rows=>rows.map(r=>[...r.cells].map(c=>c.textContent)));assert.deepEqual(actual,original);row.cells=actual;
 await wrap.evaluate(n=>{const d=document.querySelector('#detail');d.scrollTop+=n.getBoundingClientRect().top-document.querySelector('.detail-toolbar').getBoundingClientRect().bottom-18;});await page.keyboard.press('Tab');await wrap.focus();await wrap.evaluate(n=>{const d=document.querySelector('#detail');d.scrollTop+=n.getBoundingClientRect().top-document.querySelector('.detail-toolbar').getBoundingClientRect().bottom-18;});await page.screenshot({path:`${out}/table-${label}.png`});
 row.overflow=await wrap.evaluate(n=>n.scrollWidth>n.clientWidth);if(row.overflow){const left=await wrap.evaluate(n=>n.scrollLeft);await page.keyboard.press('ArrowRight');await page.waitForFunction(before=>document.querySelector('.markdown-table').scrollLeft>before,left);row.keyboardScroll=await wrap.evaluate(n=>n.scrollLeft);assert.equal(await page.locator('#detail-toolbar-id').innerText(),'UC-400');await page.keyboard.press('ArrowLeft');}
 await page.keyboard.press('Tab');assert(await page.evaluate(()=>!document.activeElement.closest('.markdown-table')),'Tab leaves the table region');row.tabExit=true;
 assert(await page.locator('#detail').evaluate(n=>n.scrollWidth<=n.clientWidth+1));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
 // Source opens safely; record browser response independently of any evidence verification.
 const link=page.locator('.research-details a[href^="https://x.com/"]').first();row.source=await link.getAttribute('href');assert(await link.getAttribute('rel').then(v=>v.includes('noopener')));
 if(width===1440){const pending=page.waitForEvent('popup');await link.click();const popup=await pending;await popup.waitForLoadState('domcontentloaded').catch(()=>{});row.sourceOpened=popup.url();await popup.close();}
 if(engine===chromium&&width===1440){await page.pdf({path:`${out}/uc400.pdf`,format:'A4',printBackground:true});row.pdf=true;}
 // 3. A reader finds a right-side cost cell, refreshes a deep link, then recovers from no results.
 await page.goto(base+'?q=6.50&case=UC-400');await page.locator('#detail[open]').waitFor();await ready(page);await page.locator('.reader-search-locate').first().focus();await page.keyboard.press('Enter');
 row.searchTarget=await page.evaluate(()=>{const n=document.activeElement,r=n.getBoundingClientRect(),w=n.closest('.markdown-table'),v=w?.getBoundingClientRect();return {tag:n.tagName,text:n.textContent,left:r.left,right:r.right,viewportLeft:v?.left,viewportRight:v?.right,scrollLeft:w?.scrollLeft};});
 assert.equal(row.searchTarget.tag,'TD');assert.equal(row.searchTarget.text,'約6.50美元');assert(row.searchTarget.left>=row.searchTarget.viewportLeft-1);assert(row.searchTarget.right<=row.searchTarget.viewportRight+1);
 await page.screenshot({path:`${out}/cost-search-${label}.png`});
 if(engine===chromium&&width===390){
  const state=()=>page.evaluate(()=>({left:document.querySelector('.markdown-table').scrollLeft,top:document.querySelector('#detail').scrollTop,focus:document.activeElement.id}));
  row.printBefore=await state();await page.pdf({path:`${out}/uc400-mobile.pdf`,format:'A4',printBackground:true});row.printAfterPDF=await state();
  await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});await page.locator('.markdown-table').evaluate(n=>n.getBoundingClientRect());await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));row.printAfterMedia=await state();
  assert.deepEqual(row.printAfterPDF,row.printBefore,'PDF retains horizontal reading position');assert.deepEqual(row.printAfterMedia,row.printBefore,'native print media retains horizontal reading position');
 }
 await page.reload();await page.locator('#detail[open]').waitFor();await ready(page);assert.equal(await page.locator('#query').inputValue(),'6.50');assert.equal(await page.locator('.markdown-table tbody tr').count(),6);
 await page.keyboard.press('Escape');await page.locator('#query').fill('no-table-results-qa');await page.locator('#empty').waitFor({state:'visible'});await page.locator('#edit-query').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
 row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
 // Controlled long-cell layout only; it never modifies repository source data.
 await page.goto(base+'?case=UC-400');await page.locator('#detail[open]').waitFor();await ready(page);await page.locator('.research-details summary').click();await page.locator('.markdown-table td').first().evaluate(n=>n.textContent+='未經獨立查核的長文字'.repeat(80));assert(await page.locator('#detail').evaluate(n=>n.scrollWidth<=n.clientWidth+1));row.longCell=true;
 row.timing=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoadedMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd};});
 assert(row.audits.every(v=>v.length===0),JSON.stringify(row.audits));assert.deepEqual(row.errors,[]);row.passed=true;console.log('PASS TABLE '+label);save(report);
 }catch(e){row.failure=e.stack;save(report);await page.screenshot({path:`${out}/failure-${label}.png`}).catch(()=>{});throw e;}finally{await browser.close();}
}
})().catch(e=>{console.error(e);process.exitCode=1});
