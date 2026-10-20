'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const observe=process.env.SUBMIT_OBSERVE==='1';
const base=process.env.SUBMIT_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.SUBMIT_OUTPUT||'qa-artifacts/submit';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const reports=[];
 for(const [name,engine] of (observe?[['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]])){
 const browser=await engine.launch();
 for(const [size,width,height] of (name==='chromium'?[['desktop',1440,1000],['mobile',390,844],['narrow',320,740]]:[['mobile',390,844]])){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle'});await page.locator('#results .card').first().waitFor({timeout:60000});
 await page.screenshot({path:`${out}/${name}-${size}-home.jpg`});
 await page.locator('[data-search-entry]').first().click();await page.locator('#query').fill('旅遊');
 if(!await page.locator('#filter-options').evaluate(e=>e.open))await page.locator('#filter-summary').click();
 await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');
 await page.locator('#query').focus();await page.keyboard.press('Enter');await page.waitForTimeout(250);
 const state=await page.evaluate(()=>({focus:document.activeElement.id,query:document.querySelector('#query').value,results:document.querySelectorAll('#results .card').length,top:document.querySelector('#results-count').getBoundingClientRect().top,height:innerHeight,hash:location.hash,submitButtons:document.querySelectorAll('#filters button[type=submit]').length}));
 await page.screenshot({path:`${out}/${name}-${size}-submit.jpg`});
 const report={name,size,state,errors};reports.push(report);fs.writeFileSync(`${out}/report.json`,JSON.stringify(reports,null,2));
 if(!observe){
 assert.equal(state.focus,'results-count');assert(state.top>=0&&state.top<height-30);assert.equal(state.hash,'#explore');assert.equal(state.submitButtons,1);assert(state.results>0);
 const first=page.locator('#results .card .card-bottom button').first();await first.click();await page.locator('#detail[open]').waitFor();
 const link=page.locator('#detail a[target="_blank"]').first();assert(await link.count());const href=await link.getAttribute('href');assert(/^https?:/.test(href));report.sourceURL=href;report.sourceHTTP=(await page.request.get(href)).status();
 await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
 const detailURL=await first.evaluate(el=>{el.click();return location.href;});await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();assert.equal(page.url(),detailURL);await page.keyboard.press('Escape');
 await page.locator('#query').fill('zzzz-no-such-usecase');await page.locator('#search-submit').click();assert(await page.locator('#empty').isVisible());assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
 await page.locator('#empty-reset').click();await page.locator('#query').fill('旅遊');await page.locator('#query').press('Enter');
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.violations=audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));assert.deepEqual(report.violations,[]);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 }
 if(observe){
 const first=page.locator('#results .card .card-bottom button').first();await first.click();await page.locator('#detail[open]').waitFor();
 const source=page.locator('#detail a[target="_blank"]').first();report.sourceURL=await source.getAttribute('href');report.sourceHTTP=(await page.request.get(report.sourceURL)).status();
 const shared=page.url();await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();assert.equal(page.url(),shared);await page.keyboard.press('Escape');
 await page.locator('#query').fill('zzzz-no-such-usecase');assert(await page.locator('#empty').isVisible());await page.locator('#empty-reset').click();
 report.baselineWalk=['home','search + scenario + tool','detail','source HTTP','direct link reload','return','empty recovery'];
 }
 if(!observe){
 await page.locator('#query').focus();
 await page.locator('#query').dispatchEvent('compositionstart');
 await page.locator('#filters').evaluate(e=>e.requestSubmit());assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
 await page.locator('#query').dispatchEvent('compositionend');await page.locator('#query').press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
 await page.locator('#filter-summary').click();if(await page.locator('#filter-options').evaluate(e=>e.open))await page.locator('#filter-summary').click();
 assert(await page.locator('#search-submit').isVisible());await page.locator('#search-submit').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${name}-${size}-action.jpg`});await page.locator('#search-submit').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
 await page.locator('#filter-summary').click();
 const facet=await page.evaluate(()=>({kind:currentFiltered[0].kind,category:currentFiltered[0].category,proof:currentFiltered[0].proof,tool:currentFiltered[0].tools[0],scenario:currentFiltered[0].scenario}));
 for(const [id,value] of Object.entries(facet))await page.locator('#'+id).selectOption(value);
 await page.locator('#sort').selectOption('reviewed');
 const before=await page.evaluate(()=>{history.replaceState({submitQA:true},'',location.href);return {url:location.href,length:history.length,ids:[...document.querySelectorAll('#results .card')].map(e=>e.dataset.caseId)};});
 await page.locator('#query').press('Enter');
 const after=await page.evaluate(()=>({url:location.href,length:history.length,ids:[...document.querySelectorAll('#results .card')].map(e=>e.dataset.caseId),state:history.state}));
 assert.equal(after.url,before.url);assert.equal(after.length,before.length);assert.deepEqual(after.ids,before.ids);assert(after.state.submitQA);report.combinedFacetsAndSort='preserved query, all five facets, reviewed sort, result order, URL and history state/length';
 report.ime='synthetic composition events guard; native OS IME not verified';
 }
 fs.writeFileSync(`${out}/report.json`,JSON.stringify(reports,null,2));await context.close();
 }
 if(!observe){
 const page=await browser.newPage({viewport:{width:390,height:844}});let release;
 const gate=new Promise(resolve=>{release=resolve;});
 await page.route('**/catalog.json',async route=>{await gate;await route.continue();});
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('#query').click();await page.locator('#query').fill('旅遊');await page.locator('#query').press('Enter');
 assert(await page.locator('#search-submit').isDisabled());await page.locator('#filters').evaluate(e=>e.requestSubmit());assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
 release();await page.locator('#search-submit').waitFor();await page.waitForFunction(()=>!document.querySelector('#search-submit').disabled);assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
 await page.locator('#query').press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
 reports.push({name,loading:'blocked submission, no deferred focus, explicit resubmission passes'});fs.writeFileSync(`${out}/report.json`,JSON.stringify(reports,null,2));await page.close();
 }
 if(!observe&&name==='chromium'){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('**/catalog.json',route=>route.fulfill({status:503,body:'unavailable'}));
 await page.goto(base,{waitUntil:'networkidle'});await page.locator('#error').waitFor();assert(await page.locator('#search-submit').isDisabled());
 await page.locator('#query').fill('旅遊');await page.locator('#filters').evaluate(e=>e.requestSubmit());assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
 reports.push({name,totalFailure:'disabled, no empty-results handoff'});await page.close();
 const partial=await browser.newPage({viewport:{width:390,height:844}});
 await partial.route('**/cases/001-*',route=>route.fulfill({status:404,body:'missing fixture'}));
 await partial.goto(base,{waitUntil:'networkidle'});await partial.waitForFunction(()=>!document.querySelector('#search-submit').disabled);await partial.locator('#partial-load').waitFor();
 await partial.locator('#query').fill('zzzz-no-such-usecase');await partial.locator('#search-submit').click();assert(await partial.locator('#partial-load').isVisible());assert(await partial.locator('#empty').isVisible());assert.equal(await partial.evaluate(()=>document.activeElement.id),'results-count');
 reports.push({name,partialFailure:'can submit, retains incomplete-source and zero-match notices'});await partial.close();fs.writeFileSync(`${out}/report.json`,JSON.stringify(reports,null,2));
 }
 await browser.close();
 }
 console.log(JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
