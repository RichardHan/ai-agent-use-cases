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
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
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
 const link=page.locator('#detail a[target="_blank"]').first();assert(await link.count());const href=await link.getAttribute('href');assert(/^https?:/.test(href));report.sourceURL=href;
 await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
 const detailURL=await first.evaluate(el=>{el.click();return location.href;});await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();assert.equal(page.url(),detailURL);await page.keyboard.press('Escape');
 await page.locator('#query').fill('zzzz-no-such-usecase');await page.locator('#search-submit').click();assert(await page.locator('#empty').isVisible());assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
 await page.locator('#empty-reset').click();await page.locator('#query').fill('旅遊');await page.locator('#query').press('Enter');
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.violations=audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));assert.deepEqual(report.violations,[]);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 }
 fs.writeFileSync(`${out}/report.json`,JSON.stringify(reports,null,2));await page.close();
 }
 await browser.close();
 }
 console.log(JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
