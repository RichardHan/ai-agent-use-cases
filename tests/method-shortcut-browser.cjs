'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.METHOD_URL||'http://127.0.0.1:8095/ai-agent-use-cases/';
const observe=process.env.OBSERVE==='1',label=observe?'before':'after';
fs.mkdirSync('qa-artifacts',{recursive:true});
(async()=>{
 const rows=[];
 for(const engine of observe?[chromium]:[chromium,firefox,webkit]){
  const browser=await engine.launch();
  for(const width of engine===chromium?[1440,390,320]:[390]){
   const context=await browser.newContext({viewport:{width,height:width===1440?1000:width===320?740:844},reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base,{waitUntil:'networkidle'});await page.locator('#results .card').first().waitFor({timeout:60000});
   await page.screenshot({path:`qa-artifacts/${label}-home-${engine.name()}-${width}.png`});
   await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(e=>e.open=true);
   await page.locator('#scenario').selectOption('生活');
   assert(await page.locator('#results .card').count()>0);
   await page.locator('#results .card .card-bottom button').first().click();await page.keyboard.press('Escape');
   assert.equal(await page.locator('#query').inputValue(),'旅遊');
   await page.locator('#query').fill('no-matching-method-987654');await page.locator('#empty').waitFor({state:'visible'});
   await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(e=>e===document.activeElement));
   // Direct link to a report with a long complete source/version record.
   await page.goto(base+'?case=UC-338',{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor({timeout:60000});
   const oldMethod=page.locator('.reader-jump').filter({hasText:'方法與步驟'});
   const row={engine:engine.name(),width,methodTop:Math.round((await oldMethod.boundingBox()).y),shortcut:await page.locator('.reader-method-shortcut').count()};rows.push(row);
   await page.screenshot({path:`qa-artifacts/${label}-reader-${engine.name()}-${width}.png`});
   if(!observe){
    const shortcut=page.locator('.reader-method-shortcut');
    const before=await page.evaluate(()=>({url:location.href,length:history.length,scroll:scrollY}));
    const bounds=await shortcut.boundingBox(),dialog=await page.locator('#detail').boundingBox(),toolbar=await page.locator('.detail-toolbar').boundingBox();
    row.shortcutTop=Math.round(bounds.y);row.shortcutBottom=Math.round(bounds.y+bounds.height);
    // A 320px screen retains the complete purpose; its shortcut is within one short swipe.
    assert(bounds.y>=toolbar.y+toolbar.height&&bounds.y+bounds.height<=dialog.y+dialog.height+(width===320?180:0));
    assert.equal(await shortcut.locator('.reader-target').innerText(),'建議操作流程（本庫設計，未實測）');
    await shortcut.focus();
    if(width===320)await page.screenshot({path:`qa-artifacts/${label}-shortcut-${engine.name()}-${width}.png`});
    await page.keyboard.press('Enter');
    const state=await page.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),t=document.querySelector('.detail-toolbar').getBoundingClientRect();return {text:e.textContent,id:e.id,top:r.top,bottom:r.bottom,toolbar:t.bottom};});
    assert.match(state.text,/步驟|流程|方法|提示詞|指令/);assert(state.top>=state.toolbar&&state.bottom<=dialog.y+dialog.height);
    assert.equal(await shortcut.getAttribute('aria-controls'),state.id);row.target=state;
    assert.deepEqual(await page.evaluate(()=>({url:location.href,length:history.length,scroll:scrollY})),before);
    await page.screenshot({path:`qa-artifacts/${label}-method-${engine.name()}-${width}.png`});
    await page.locator('#'+state.id+' + .reader-return').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-nav-title');
    await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
    assert.equal(await page.locator('.reader-method-shortcut').count(),1);
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.axe=audit.violations.map(v=>v.id);assert.deepEqual(row.axe,[]);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    // A pending lead must not be given a method shortcut implying a usable workflow.
    const pending=await page.evaluate(()=>entries.find(e=>e.kind==='pending').id);
    await page.goto(base+'?case='+pending,{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();assert.equal(await page.locator('.reader-method-shortcut').count(),0);
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  await browser.close();
 }
 fs.writeFileSync(`qa-artifacts/method-${label}.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
})().catch(e=>{console.error(e);process.exit(1)});
