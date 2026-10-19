'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const observe=process.env.OBSERVE==='1';
const base=process.env.FACET_URL||'http://127.0.0.1:8096/ai-agent-use-cases/';
const keys=['scenario','kind','tool','category','proof'];
fs.mkdirSync('qa-artifacts',{recursive:true});
(async()=>{
 const report=[];
 for(const [engine,width,height] of (observe?[[chromium,1440,1000],[chromium,390,844]]:[[chromium,1440,1000],[chromium,390,844],[chromium,320,740],[firefox,390,844],[webkit,390,844]])){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
  page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?q=旅遊#explore',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>!document.getElementById('copy-search-link').disabled);
  if(!(await page.locator('#filter-options').evaluate(n=>n.open)))await page.locator('#filter-summary').click();
  const inputTiming=await page.evaluate(()=>{
   const input=document.getElementById('query'),times=[];
   for(let i=0;i<5;i++){const start=performance.now();input.dispatchEvent(new Event('input',{bubbles:true}));times.push(performance.now()-start);}
   return times;
  });
  const options=await page.locator('#scenario option').allTextContents();
  await page.locator('#filters').scrollIntoViewIfNeeded();
  await page.screenshot({path:`qa-artifacts/${observe?'before':'after'}-${engine.name()}-${width}.png`});
  await page.locator('#scenario').selectOption('開發');
  const empty=await page.locator('#empty').isVisible();
  const row={engine:engine.name(),width,options,inputTimingMs:inputTiming,travelDevelopmentEmpty:empty};
  if(observe){report.push(row);await browser.close();continue;}
  assert(options.every(x=>/（\d+ 筆）$/.test(x)),'every scenario option previews its actual count');
  assert(empty,'incompatible combination still allowed, with honest empty state');
  await page.locator('#empty-suggestions [data-remove-filter="scenario"]').click();
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert.equal(await page.locator('#scenario').inputValue(),'');
  assert((await page.locator('#results .card').count())>0);
  // Every displayed count equals selecting that option, retaining every other condition.
  for(const key of keys){
   const before=await page.locator('#'+key).inputValue();
   const choices=await page.locator('#'+key+' option').evaluateAll(nodes=>nodes.map(n=>({value:n.value,text:n.textContent,disabled:n.disabled})));
   for(const choice of choices){
    assert.equal(choice.disabled,false,'zero counts stay available');
    await page.locator('#'+key).selectOption(choice.value);
    assert.equal(await page.locator('#results .card').count(),Number(choice.text.match(/（(\d+) 筆）$/)[1]),key+' '+choice.value);
   }
   await page.locator('#'+key).selectOption(before);
  }
  await page.locator('#scenario').selectOption('生活');
  await page.locator('#kind').selectOption('case');
  const combined=await page.locator('#tool option').evaluateAll(nodes=>nodes.map(n=>({value:n.value,text:n.textContent})));
  for(const choice of combined){
   await page.locator('#tool').selectOption(choice.value);
   assert.equal(await page.locator('#results .card').count(),Number(choice.text.match(/（(\d+) 筆）$/)[1]),'query + scenario + kind, changing tool');
  }
  await page.locator('#tool').selectOption('Grok Bot');
  const values=await page.locator('#filters select').evaluateAll(nodes=>nodes.map(n=>n.value));
  await page.locator('#query').fill('no-facet-task-987654');
  assert.equal(await page.locator('#empty').isVisible(),true);
  assert.deepEqual(await page.locator('#filters select').evaluateAll(nodes=>nodes.map(n=>n.value)),values);
  assert((await page.locator('#scenario option').allTextContents()).every(x=>/（0 筆）$/.test(x)));
  await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(n=>n===document.activeElement));
  await page.locator('#query').fill('旅遊');
  await page.locator('#results .card .card-bottom button').first().click();
  await page.locator('#detail[open]').waitFor();
  await page.locator('.research-details summary').click();
  const source=await page.locator('.markdown a[href^="https:"]').first().getAttribute('href');
  assert(source.startsWith('https:'));
  await page.goBack();await page.waitForFunction(()=>!document.getElementById('detail').open);
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert.equal(await page.locator('#scenario').inputValue(),'生活');
  await page.locator('#query').focus();await page.keyboard.press('Tab');
  assert(await page.locator('#filter-summary').evaluate(n=>n===document.activeElement));
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  row.axeViolations=axe.violations.map(v=>v.id);assert.deepEqual(row.axeViolations,[]);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.goto(base+'?q=旅遊&scenario=生活&case=UC-001#explore',{waitUntil:'networkidle'});
  await page.locator('#detail[open]').waitFor();await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();await page.locator('#close-detail').click();
  assert.equal(await page.locator('#scenario').inputValue(),'生活');
  assert.deepEqual(errors,[]);report.push(row);await browser.close();
 }
 if(!observe){
  const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  page.setDefaultTimeout(15000);
  let releaseCatalog;
  const gate=new Promise(resolve=>releaseCatalog=resolve);
  await page.route('**/catalog.json',async route=>{await gate;await route.continue();});
  await page.route('**/cases/001-travel-checkout.md',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.goto(base+'?q=旅遊&scenario=生活#explore',{waitUntil:'domcontentloaded'});
  assert.match(await page.locator('#facet-count-hint').textContent(),/載入完成後/);
  assert(!(await page.locator('#scenario option').allTextContents()).some(x=>/（\d+ 筆）/.test(x)));
  releaseCatalog();
  await page.waitForFunction(()=>!document.getElementById('copy-search-link').disabled);
  await page.locator('#partial-load').waitFor({state:'visible'});
  assert.match(await page.locator('#facet-count-hint').textContent(),/只計已載入/);
  const countBefore=await page.locator('#results .card').count(),urlBefore=page.url();
  const optionBefore=await page.locator('#scenario option[value="生活"]').textContent();
  await page.unroute('**/cases/001-travel-checkout.md');
  await page.locator('#retry-failed').click();
  await page.locator('#partial-load').waitFor({state:'hidden'});
  assert.equal(await page.locator('#results .card').count(),countBefore+1);
  const optionAfter=await page.locator('#scenario option[value="生活"]').textContent();
  assert.equal(Number(optionAfter.match(/（(\d+) 筆）/)[1]),Number(optionBefore.match(/（(\d+) 筆）/)[1])+1);
  assert.equal(page.url(),urlBefore);
  assert.equal(await page.locator('#scenario').inputValue(),'生活');
  assert(await page.locator('#results-count').evaluate(n=>n===document.activeElement));
  report.push({journey:'loading-partial-retry',countBefore,countAfter:countBefore+1});
  await page.goto(base+'?q=旅遊&scenario='+encodeURIComponent('未知情境')+'#explore',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#scenario').inputValue(),'未知情境');
  assert.match(await page.locator('#scenario option:checked').textContent(),/未知情境（0 筆）/);
  await browser.close();
 }
 fs.writeFileSync(`qa-artifacts/${observe?'baseline':'verification'}.json`,JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
