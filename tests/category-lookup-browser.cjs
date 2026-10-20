'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.LOOKUP_URL||'http://127.0.0.1:8160/ai-agent-use-cases/';
const out=process.env.LOOKUP_OUTPUT||'qa-artifacts/lookup';fs.mkdirSync(out,{recursive:true});const report=[];
(async()=>{for(const [engine,width] of [[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'}),page=await context.newPage();
 const row={engine:engine.name(),width,errors:[],audits:[]};report.push(row);
 try{
 page.on('pageerror',e=>row.errors.push(e.message));
 await page.goto(base+'?q=旅遊&scenario=生活');await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
 assert.deepEqual(await page.evaluate(()=>failedPaths),[]);row.entries=await page.evaluate(()=>entries.length);
 await page.locator('#filter-options').evaluate(e=>e.open=true);assert.equal(await page.locator('#category-finder').evaluate(e=>e.open),false);
 await page.locator('#category-finder>summary').focus();await page.keyboard.press('Enter');
 const input=page.locator('#category-query');await input.fill('旅遊');
 const before=await page.evaluate(()=>({url:location.href,length:history.length,ids:currentFiltered.map(e=>e.id)}));
 await page.keyboard.press('Enter');
 assert.deepEqual(await page.evaluate(()=>({url:location.href,length:history.length,ids:currentFiltered.map(e=>e.id)})),before);
 row.finder=await page.locator('#category-find-status').innerText();
 assert(await page.locator('.category-match').count()>0);
 const choice=page.locator('.category-match').filter({has:page.locator('span').getByText('旅遊／消費研究',{exact:true})});
 await choice.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#category').inputValue(),'旅遊／消費研究');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'category');assert.equal(await page.locator('#query').inputValue(),'旅遊');
 assert.equal(await page.locator('#scenario').inputValue(),'生活');
 // Find by multiple name words, without using full-text case synonyms.
 await input.fill('旅遊 消費');assert.equal(await page.locator('.category-match').count(),1);
 await page.locator('#category-finder').scrollIntoViewIfNeeded();
 await page.screenshot({path:`${out}/finder-${engine.name()}-${width}.png`});
 for(const button of await page.locator('.category-match').all())assert((await button.boundingBox()).height>=44);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id));assert.deepEqual(row.audits.at(-1),[]);
 // Read the selected result and return, preserving both search state and local finder text.
 const trigger=page.locator('#results .card-bottom button').first();await trigger.click();await page.locator('#detail[open]').waitFor();
 await page.locator('.research-details').evaluate(e=>e.open=true);row.source=await page.locator('.research-details .markdown a').first().getAttribute('href');assert.match(row.source,/^https?:/);
 await page.screenshot({path:`${out}/detail-${engine.name()}-${width}.png`});await page.goBack();
 await page.waitForFunction(()=>!document.querySelector('#detail').open);assert.equal(await input.inputValue(),'旅遊 消費');
 assert.equal(await page.locator('#category').inputValue(),'旅遊／消費研究');
 assert.equal(await page.evaluate(()=>document.activeElement.closest('.card')?.dataset.caseId),await trigger.locator('..').locator('..').getAttribute('data-case-id'));
 // Full zero-result intersection still offers real category names with zero counts.
 await page.locator('#query').fill('no-case-lookup-924');await input.fill('旅遊');
 assert(await page.locator('#empty').isVisible());assert(await page.locator('.category-match').count()>0);
 assert((await page.locator('.category-match-count').allTextContents()).every(text=>text==='0 筆'));
 await page.locator('.category-match').first().click();assert(await page.locator('#empty').isVisible());
 await input.fill('不存在的分類987');assert.equal(await page.locator('.category-match').count(),0);assert.match(await page.locator('#category-find-status').innerText(),/沒有名稱符合/);
 await page.locator('#clear-category-query').click();assert.equal(await input.inputValue(),'');assert.equal(await page.evaluate(()=>document.activeElement.id),'category-query');
 await page.locator('#empty-reset').click();await input.fill('研究');row.broadStatus=await page.locator('#category-find-status').innerText();assert.match(row.broadStatus,/先列 8 個/);assert.equal(await page.locator('.category-match').count(),8);
 row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id));assert.deepEqual(row.audits.at(-1),[]);
 // Direct link and refresh retain the actual selected category, with helper initially closed.
 await page.goto(base+'?q=旅遊&scenario=生活&category='+encodeURIComponent('旅遊／消費研究')+'&case=UC-001');await page.locator('#detail[open]').waitFor({timeout:90000});
 await page.reload();await page.locator('#detail[open]').waitFor({timeout:90000});await page.locator('#close-detail').click();assert.equal(await page.locator('#category').inputValue(),'旅遊／消費研究');
 assert.equal(await page.locator('#category-finder').evaluate(e=>e.open),false);
 // Catalog loading: local input survives and is never reported as a real zero.
 await context.route('**/catalog.json',route=>route.fulfill({status:503,body:'unavailable'}));await page.goto(base);await page.locator('#error:not([hidden])').waitFor();
 await page.locator('#filter-options').evaluate(e=>e.open=true);await page.locator('#category-finder').evaluate(e=>e.open=true);await input.fill('旅遊');assert.match(await page.locator('#category-find-status').innerText(),/正在讀取分類/);
 await context.unroute('**/catalog.json');await page.locator('#retry').click();await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});assert.equal(await input.inputValue(),'旅遊');assert(await page.locator('.category-match').count()>0);
 assert.deepEqual(row.errors,[]);row.complete=true;
 }catch(e){row.failure=e.stack;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
