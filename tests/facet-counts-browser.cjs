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
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?q=旅遊#explore',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>!document.getElementById('copy-search-link').disabled);
  if(!(await page.locator('#filter-options').evaluate(n=>n.open)))await page.locator('#filter-summary').click();
  const options=await page.locator('#scenario option').allTextContents();
  await page.locator('#filters').scrollIntoViewIfNeeded();
  await page.screenshot({path:`qa-artifacts/${observe?'before':'after'}-${engine.name()}-${width}.png`});
  await page.locator('#scenario').selectOption('開發');
  const empty=await page.locator('#empty').isVisible();
  const row={engine:engine.name(),width,options,travelDevelopmentEmpty:empty};
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
 fs.writeFileSync(`qa-artifacts/${observe?'baseline':'verification'}.json`,JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
