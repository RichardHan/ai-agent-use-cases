'use strict';
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
 const page=await context.newPage();
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
 // Valid direct links and refresh still open their case.
 await page.goto(origin+'?case=UC-001',{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
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
 assert.deepEqual(errors,[]);
 reports[reports.length-1].axeViolations=axe.violations.length;
 await context.close();await browser.close();
}
// Full-load failure and partial source recovery must not claim a case is absent.
if(!observe){
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('**/catalog.json',r=>r.fulfill({status:503,body:'unavailable'}));
 await page.goto(origin+'?case=UC-001');await page.locator('#error').waitFor({state:'visible'});
 assert.equal(await page.locator('#missing-case').isVisible(),false);
 await page.unroute('**/catalog.json');await page.locator('#retry').click();await page.locator('#detail[open]').waitFor();
 await page.close();
 const partial=await browser.newPage({viewport:{width:390,height:844}});
 await partial.route('**/cases/001-*.md',r=>r.fulfill({status:503,body:'unavailable'}));
 await partial.goto(origin+'?case=UC-001',{waitUntil:'networkidle'});
 await partial.locator('#partial-load').waitFor({state:'visible'});
 assert.equal(await partial.locator('#missing-case').isVisible(),false);
 assert.match(await partial.locator('#partial-message').innerText(),/分享的案例目前無法開啟/);
 await partial.unroute('**/cases/001-*.md');await partial.locator('#retry-failed').click();await partial.locator('#detail[open]').waitFor();
 assert.equal(await partial.locator('#detail-toolbar-id').innerText(),'UC-001');
 await browser.close();
}
fs.writeFileSync('qa-artifacts/'+prefix+'.json',JSON.stringify(reports,null,2));
console.log('CASE_ACCEPTANCE '+JSON.stringify(reports));
})().catch(e=>{console.error(e);process.exitCode=1;});
