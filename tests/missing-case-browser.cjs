'use strict';
const sourceRoute=require('./source-route.cjs');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.CASE_URL||'http://127.0.0.1:8091/ai-agent-use-cases/';
const observe=process.env.CASE_OBSERVE==='1';
const prefix=observe?'before':'after';
const reports=[];
async function ready(page){await page.waitForFunction(()=>document.querySelector('#results .card')||!document.querySelector('#empty').hidden); }
async function shot(page,name){const path='qa-artifacts/'+prefix+'-'+name+'.jpg';await page.screenshot({path,type:'jpeg',quality:65});if(!process.env.CASE_LIVE)console.log('VISUAL:'+prefix+'-'+name+':'+fs.readFileSync(path).toString('base64'));}
(async()=>{
fs.mkdirSync('qa-artifacts',{recursive:true});
for(const [engine,width,height] of [['chromium',1440,1000],['chromium',390,844],...observe?[]:[['chromium',320,740],['firefox',390,844],['webkit',390,844]]]){
 const browser=await ({chromium,firefox,webkit}[engine]).launch();
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(10000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const label=engine+'-'+width;
 await page.goto(origin,{waitUntil:'networkidle'});await ready(page);await shot(page,'home-'+label);
 await page.locator('[data-search-entry]').first().click();
 await page.locator('#query').fill('旅遊');
 await page.locator('#filter-options').evaluate(e=>e.open=true);
 await page.locator('#scenario').selectOption('生活');
 await page.waitForFunction(()=>document.querySelector('#results .card'));
 await page.locator('#results h3 button').first().click();
 await page.locator('#detail[open]').waitFor();
 await page.locator('.research-details summary').click();
 const href=await page.locator('.markdown a').first().getAttribute('href');
 assert.match(href,/^https?:/);
 const response=await context.request.get(href,{timeout:20000}).catch(e=>({status:()=>e.message}));
 const sourceStatus=response.status();
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#query').inputValue(),'旅遊');
 assert.equal(await page.locator('#scenario').inputValue(),'生活');
 // Shared unknown case, including saved search conditions.
 await page.goto(origin+'?case=UC-999999&q=旅遊&scenario=生活',{waitUntil:'networkidle'});await ready(page);
 await shot(page,'missing-'+label);
 const missing=page.locator('#missing-case');
 const before={engine,width,sourceStatus,url:page.url(),visible:await missing.count()?await missing.isVisible():false,active:await page.evaluate(()=>document.activeElement.id),scrollY:await page.evaluate(()=>scrollY)};
 reports.push(before);console.log('CASE_OBSERVATION '+JSON.stringify(before));
 if(observe){await context.close();await browser.close();continue;}
 await missing.waitFor({state:'visible'});
 assert.match(await missing.innerText(),/UC-999999/);
 assert.match(await missing.innerText(),/找不到/);
 await page.waitForFunction(()=>{const el=document.getElementById('missing-case-title'),r=el.getBoundingClientRect();return document.activeElement===el&&r.top>=-1&&r.bottom<=innerHeight+1;});
 await page.reload({waitUntil:'networkidle'});await ready(page);await missing.waitFor({state:'visible'});
 const buttonBox=await page.locator('#dismiss-missing-case').boundingBox();assert(buttonBox.height>=44);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 // Typing does not repeatedly announce an unchanged missing-case message.
 await page.evaluate(()=>{
   window.caseMessageMutations=0;
   window.caseMessageObserver=new MutationObserver(records=>window.caseMessageMutations+=records.length);
   window.caseMessageObserver.observe(document.getElementById('missing-case-message'),{childList:true,subtree:true,characterData:true});
 });
 await page.locator('#query').fill('旅行');await page.locator('#query').fill('旅遊');
 assert.equal(await page.evaluate(()=>{window.caseMessageObserver.disconnect();return window.caseMessageMutations;}),0);
 // Keyboard recovery removes only case, keeps the query and scenario, and does not add history.
 const length=await page.evaluate(()=>history.length);
 await page.locator('#dismiss-missing-case').focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>!new URL(location.href).searchParams.has('case'));
 assert.equal(await page.evaluate(()=>history.length),length);
 assert.equal(await page.locator('#query').inputValue(),'旅遊');
 assert.equal(await page.locator('#scenario').inputValue(),'生活');
 assert.equal(await missing.isVisible(),false);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'query');
 await page.locator('#results h3 button').first().click();await page.locator('#detail[open]').waitFor();
 await page.keyboard.press('Escape');
 assert.equal(await missing.isVisible(),false);
 // Empty results and arbitrary IDs are data, never HTML.
 await page.goto(origin+'?case='+encodeURIComponent('<img src=x onerror=alert(1)>')+'&q=zzzznomatch999',{waitUntil:'networkidle'});
 await page.locator('#empty').waitFor({state:'visible'});
 assert.equal(await missing.isVisible(),true);
 assert.equal(await missing.locator('img').count(),0);
 await page.locator('#dismiss-missing-case').click();
 await page.locator('#empty-reset').click();await page.locator('#results .card').first().waitFor();
 // Empty and long IDs remain readable without horizontal overflow.
 for(const id of ['', ' '.repeat(3), 'X'.repeat(500)]){
   await page.goto(origin+'?case='+encodeURIComponent(id),{waitUntil:'networkidle'});await ready(page);await missing.waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert((await page.locator('#missing-case-message').innerText()).length<200);
 }
 // Valid direct links and refresh still open their case.
 await page.goto(origin+'?case=1&q=zzzznomatch999',{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
 assert.equal(await missing.isVisible(),false);
 await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
 assert.equal(await page.locator('#detail-toolbar-id').innerText(),'UC-001');
 await page.keyboard.press('Escape');
 // Browser Back to an unavailable shared case restores its explanation.
 await page.goto(origin+'?case=UC-999999',{waitUntil:'networkidle'});await ready(page);
 await page.locator('#results h3 button').first().click();await page.locator('#detail[open]').waitFor();
 await page.goBack();await missing.waitFor({state:'visible'});
 assert.equal(await page.locator('#detail').evaluate(e=>e.open),false);
 const axe=await new AxeBuilder({page}).analyze();
 assert.deepEqual(axe.violations.map(v=>({id:v.id,impact:v.impact})),[]);
 // Hiding a focused missing notice through history leaves focus in visible results.
 await page.evaluate(()=>{history.pushState(null,'',location.pathname+'?q=旅遊');dispatchEvent(new PopStateEvent('popstate'));});
 assert.equal(await missing.isVisible(),false);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
 assert.deepEqual(errors,[]);
 reports[reports.length-1].axeViolations=axe.violations.length;
 await context.close();await browser.close();
}
// Full-load failure and partial source recovery must not claim a case is absent.
if(!observe){
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(10000);
 await page.route('**/catalog.json',r=>r.fulfill({status:503,body:'unavailable'}));
 await page.goto(origin+'?case=UC-001');await page.locator('#error').waitFor({state:'visible'});
 assert.equal(await page.locator('#missing-case').isVisible(),false);
 await page.unroute('**/catalog.json');await page.locator('#retry').click();await page.locator('#detail[open]').waitFor();
 await page.close();
 const partial=await browser.newPage({viewport:{width:390,height:844}});partial.setDefaultTimeout(10000);
 await sourceRoute(partial,'**/cases/001-*.md',r=>r.fulfill({status:503,body:'unavailable'}));
 await partial.goto(origin+'?case=UC-001',{waitUntil:'networkidle'});
 await partial.locator('#partial-load').waitFor({state:'visible'});
 assert.equal(await partial.locator('#missing-case').isVisible(),false);
 assert.match(await partial.locator('#partial-message').innerText(),/分享的案例目前無法開啟/);
 await partial.unroute('**/cases/001-*.md');await partial.locator('#retry-failed').click();await partial.locator('#detail[open]').waitFor();
 assert.equal(await partial.locator('#detail-toolbar-id').innerText(),'UC-001');
 await partial.close();
 for(const missingId of ['UC-999999','']){
 const unknown=await browser.newPage({viewport:{width:390,height:844}});unknown.setDefaultTimeout(10000);
 await sourceRoute(unknown,'**/cases/001-*.md',r=>r.fulfill({status:503,body:'unavailable'}));
 await unknown.goto(origin+'?case='+encodeURIComponent(missingId),{waitUntil:'networkidle'});
 await unknown.locator('#partial-load').waitFor({state:'visible'});
 assert.equal(await unknown.locator('#missing-case').isVisible(),false);
 await unknown.unroute('**/cases/001-*.md');await unknown.locator('#retry-failed').click();
 await unknown.locator('#missing-case').waitFor({state:'visible'});
 assert.equal(await unknown.evaluate(()=>document.activeElement.id),'missing-case-title');
 await unknown.close();
 }
 const slow=await browser.newPage({viewport:{width:390,height:844}});slow.setDefaultTimeout(10000);
 let release;const gate=new Promise(r=>release=r);
 await slow.route('**/catalog.json',async r=>{await gate;await r.continue();});
 await slow.goto(origin+'?case=UC-999999',{waitUntil:'domcontentloaded'});
 await slow.locator('[data-search-entry]').first().click();await slow.locator('#query').fill('旅遊');
 assert.equal(await slow.locator('#missing-case').isVisible(),false);
 release();await slow.locator('#missing-case').waitFor({state:'visible'});
 assert.equal(await slow.evaluate(()=>document.activeElement.id),'query');
 await slow.close();await browser.close();
}
fs.writeFileSync('qa-artifacts/'+prefix+'.json',JSON.stringify(reports,null,2));
console.log('CASE_ACCEPTANCE '+JSON.stringify(reports));
})().catch(e=>{console.error(e);process.exit(1);});
