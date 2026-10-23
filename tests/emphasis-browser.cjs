'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/',observe=process.env.QA_OBSERVE==='1',out=process.env.QA_OUT||'qa-artifacts/before';fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];
for(const [engine,width] of (observe?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const browser=await engine.launch(),page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),row={label:engine.name()+'-'+width,errors:[]};rows.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 try{
 await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});row.corpus=await page.evaluate(()=>({total:entries.length,failed:[...failedPaths]}));assert.deepEqual(row.corpus.failed,[]);await page.screenshot({path:`${out}/home-${row.label}.png`});
 await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(n=>n.open=true);await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');await page.locator('#search-submit').click();row.results=await page.locator('#results-count').innerText();
 const trigger=page.locator('#results .card[data-case-id="UC-001"] .card-bottom button');await trigger.click();await page.locator('#detail[open]').waitFor();await page.keyboard.press('Escape');assert(await trigger.evaluate(n=>n===document.activeElement));assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
 await page.goto(base+'?case=UC-313');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);await page.locator('.research-details summary').click();
 const paragraph=page.locator('.research-details .markdown p').filter({hasText:'作者比對接收與完成紀錄'});await paragraph.scrollIntoViewIfNeeded();row.emphasis=await paragraph.evaluate(n=>({text:n.textContent,strong:[...n.querySelectorAll('strong')].map(s=>s.textContent)}));await page.screenshot({path:`${out}/limitation-${row.label}.png`});
 const link=page.locator('.research-details a[href^="http"]').first();row.source=await link.getAttribute('href');assert((await link.getAttribute('rel')).includes('noopener'));
 if(width===1440){const pending=page.waitForEvent('popup');await link.click();const popup=await pending;await popup.waitForLoadState('domcontentloaded').catch(()=>{});row.sourceOpened=popup.url();await popup.close();}
 await page.reload();await page.locator('#detail[open]').waitFor();assert.equal(await page.locator('#detail-toolbar-id').innerText(),'UC-313');
 if(!observe){assert.deepEqual(row.emphasis.strong,['未證實實際重複寄送，也未重新核對外部服務狀態']);assert(!row.emphasis.text.includes('**'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.locator('#detail').evaluate(n=>n.scrollWidth<=n.clientWidth+1));row.violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));assert.deepEqual(row.violations,[]);}
 if(!observe){
 // A reader searches for the exact evidence caveat, reads its full context, and returns.
 await page.goto(base+'?q='+encodeURIComponent('未證實實際重複寄送')+'&case=UC-313');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);
 await page.locator('.reader-search-locate').first().focus();await page.keyboard.press('Enter');
 row.searchTarget=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent,strong:[...document.activeElement.querySelectorAll('strong')].map(n=>n.textContent)}));assert(row.searchTarget.text.includes('未證實實際重複寄送'));assert.deepEqual(row.searchTarget.strong,['未證實實際重複寄送，也未重新核對外部服務狀態']);
 await page.screenshot({path:`${out}/search-${row.label}.png`});
 await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),'未證實實際重複寄送');
 await page.goto(base+'?case=UC-089');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady);await page.locator('.research-details summary').click();
 row.approvalBoundary=await page.locator('.research-details strong').allTextContents();assert(row.approvalBoundary.includes('未經核准不得移動、刪除、退訂或取消任何東西'));
 }
 await page.keyboard.press('Escape');await page.locator('#query').fill('zzzz_no_match_731');await page.locator('#empty').waitFor({state:'visible'});await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(n=>n===document.activeElement));row.emptyRecovery=true;assert.deepEqual(row.errors,[]);
 }catch(e){row.failure=e.stack;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));await browser.close();}
}
})().catch(e=>{console.error(e);process.exit(1)});
