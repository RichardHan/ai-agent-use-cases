'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.REFINE_URL||'http://127.0.0.1:8093/ai-agent-use-cases/';
const observe=process.env.OBSERVE==='1',label=observe?'before':process.env.REFINE_LABEL||'after';
fs.mkdirSync('qa-artifacts',{recursive:true});
(async()=>{
 const report=[];
 for(const engine of observe?[chromium]:[chromium,firefox,webkit]){
  const browser=await engine.launch();
  for(const [width,height] of engine===chromium?[[1440,1000],[390,844],[320,740]]:[[390,844]]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:width===1440?'no-preference':'reduce'});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin,{waitUntil:'networkidle'});await page.locator('#results .card').first().waitFor();
   // Known task, source and return, then keyboard-driven card refinement.
   await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(e=>e.open=true);
   await page.locator('#scenario').selectOption('生活');
   const read=page.locator('#results .card .card-bottom button').first();
   await read.click();await page.locator('#detail[open]').waitFor();
   await page.locator('.research-details').evaluate(e=>e.open=true);
   const source=await page.locator('.markdown a[href^="https:"]').first().getAttribute('href');
   if(width===1440){const pending=page.waitForEvent('popup');await page.locator('.markdown a[href^="https:"]').first().click();const popup=await pending;await popup.waitForLoadState('domcontentloaded');await popup.close();}
   await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),'旅遊');
   // Refine from a result far down the list: replacement removes the trigger.
   const tag=page.locator('#results .card .tag-interactive').last();const value=await tag.innerText();
   await tag.focus();await page.keyboard.press('Enter');
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const state=await page.evaluate(()=>({focus:document.activeElement.id||document.activeElement.tagName,rect:document.getElementById('results-count').getBoundingClientRect().toJSON(),count:document.getElementById('results-count').textContent}));
   await page.screenshot({path:`qa-artifacts/${label}-refine-${engine.name()}-${width}.jpg`,type:'jpeg',quality:85});
   const row={engine:engine.name(),width,source,tag:value,...state};report.push(row);
   if(!observe){
    assert.equal(state.focus,'results-count');assert(state.rect.top>=0&&state.rect.bottom<=height);
    assert.equal(await page.locator('#query').inputValue(),value);
    assert.equal(await page.locator('#scenario').inputValue(),'生活');
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'copy-search-link');
    const scenario=page.locator('#results .card .tag-scenario').first();
    assert.equal(await scenario.getAttribute('aria-pressed'),'true');
    await scenario.focus();await page.keyboard.press('Space');
    assert.equal(await page.locator('#scenario').inputValue(),'');assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
    // Random discovery card also routes clearly to filtered results.
    const discovery=page.locator('#drawn-case .tag-interactive').first();await discovery.click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');
    // All facets survive card refinement; URL and in-page history stay coherent.
    await page.locator('#query').fill('旅遊');
    await page.locator('#filter-options').evaluate(e=>e.open=true);
    const meta=await page.evaluate(()=>{const e=entries.find(e=>e.id==='UC-001');return {kind:e.kind,tool:e.tools[0],category:e.category,proof:e.proof};});
    for(const [id,value] of Object.entries(meta))await page.locator('#'+id).selectOption(value);
    const historyLength=await page.evaluate(()=>history.length);
    const taskTag=page.locator('#results .card .tag-interactive').first();const task=await taskTag.innerText();await taskTag.click();
    for(const [id,value] of Object.entries(meta))assert.equal(await page.locator('#'+id).inputValue(),value);
    const url=new URL(page.url());assert.equal(url.searchParams.get('q'),task);
    for(const [id,value] of Object.entries(meta))assert.equal(url.searchParams.get(id),value);
    assert.equal(await page.evaluate(()=>history.length),historyLength);
    await page.locator('#results .card .card-bottom button').first().click();await page.locator('#detail[open]').waitFor();
    await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),task);
    // Empty search separately recovers without discarding retained facets.
    await page.locator('#query').fill('no-such-refine-987654');await page.locator('#empty').waitFor({state:'visible'});
    await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(e=>document.activeElement===e));
    // Shared link preserves refinement through direct loading and refresh.
    await page.goto(origin+'?q=旅遊&scenario=生活&case=UC-001#explore',{waitUntil:'networkidle'});
    await page.locator('#detail[open]').waitFor();await page.reload({waitUntil:'networkidle'});
    await page.locator('#detail[open]').waitFor();await page.locator('#close-detail').click();
    assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.axe=audit.violations.map(v=>v.id);assert.deepEqual(row.axe,[]);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  await browser.close();
 }
 fs.writeFileSync('qa-artifacts/'+(observe?'baseline':label+'-verification')+'.json',JSON.stringify(report,null,2));console.log('REFINEMENT_REPORT '+JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
