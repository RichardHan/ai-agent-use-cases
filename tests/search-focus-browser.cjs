'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'http://127.0.0.1:8134/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/after',observe=process.env.FOCUS_OBSERVE==='1',recoveryRed=process.env.FOCUS_RECOVERY_RED==='1';
fs.mkdirSync(out,{recursive:true});
const report=[];
(async()=>{
for(const [engine,width] of (recoveryRed?[[webkit,390]]:observe?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),label=engine.name()+'-'+width,row={label,errors:[],focus:[],axe:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 const save=()=>fs.writeFileSync(out+'/focus-report.json',JSON.stringify(report,null,2));
 const ready=async suffix=>{await page.goto(base+(suffix||''));await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.evaluate(()=>failedPaths.length),0);};
 const screenshot=async name=>page.screenshot({path:out+'/'+name+'-'+label+'.png'});
 const style=async (target,ringTarget=target)=>{
  // Native focus scrolling may settle after the handler returns. Observe it; never scroll for the test.
  if(!observe)await page.waitForFunction(selector=>{const n=document.querySelector(selector),r=n.getBoundingClientRect(),bar=n.closest('dialog')?.querySelector('.detail-toolbar')?.getBoundingClientRect();return r.top>=(bar?.bottom||0)&&r.bottom<=innerHeight;},ringTarget,{timeout:2000}).catch(()=>{});
  const active=await page.locator(target).evaluate(n=>({active:n===document.activeElement,focusVisible:n.matches(':focus-visible')}));
  const ring=await page.locator(ringTarget).evaluate(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect(),d=n.closest('dialog'),bar=d?.querySelector('.detail-toolbar')?.getBoundingClientRect();return {outlineStyle:s.outlineStyle,outlineWidth:s.outlineWidth,outlineColor:s.outlineColor,outlineOffset:s.outlineOffset,background:s.backgroundColor,top:r.top,bottom:r.bottom,left:r.left,right:r.right,toolbarBottom:bar?.bottom||0,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth};});
  const state={target,ringTarget,...active,...ring};row.focus.push(state);save();
  if(!observe){assert(state.active&&state.focusVisible,JSON.stringify(state));if(!(recoveryRed&&target==='#reader-outline-query')){assert.equal(state.outlineStyle,'solid','Keyboard focus must have a visible outline: '+target);assert(parseFloat(state.outlineWidth)>=2);}if(state.top<state.toolbarBottom||state.bottom>900)await screenshot('offscreen-focus');assert(state.top>=state.toolbarBottom&&state.bottom<=900,'Focused control must be visible: '+target);assert(state.left>=0&&state.right<=width);}
  return state;
 };
 const audit=async()=>{const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.axe.push(r.violations.map(v=>v.id));assert.deepEqual(row.axe.at(-1),[]);};
 // First-time visitor: search, combine a facet, read source and return to same result.
 await ready();row.total=await page.evaluate(()=>entries.length);await page.locator('.hero-search-link').click();
 await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await style('#query','.search-wrap');await screenshot('search-focus');
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'search-submit');await style('#search-submit');
 await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(n=>n.open=true);await page.locator('#scenario').selectOption('生活');await page.locator('#search-submit').click();row.matches=await page.evaluate(()=>currentFiltered.length);assert(row.matches>0);
 const read=page.locator('#results .card .card-bottom button').first();const id=await read.evaluate(n=>n.closest('.card').dataset.caseId);await read.click();await page.locator('#detail[open]').waitFor();
 await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();row.source=await page.locator('.markdown a[href^="https:"]').first().getAttribute('href');await page.keyboard.press('Escape');assert(await page.locator(`#results .card[data-case-id="${id}"] .card-bottom button`).evaluate(n=>n===document.activeElement));
 // Returning reader: long detail direct link + reload, keyboard into heading search.
 await ready('?case=UC-005');await page.locator('#detail[open]').waitFor();await page.reload();await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.evaluate(()=>failedPaths.length),0,'Reload must preserve a complete corpus');
 await page.locator('.reader-outline summary').focus();await page.keyboard.press('Enter');assert(await page.locator('.reader-outline').evaluate(n=>n.open));await page.keyboard.press('Tab');
 const input=page.locator('#reader-outline-query');const state=await style('#reader-outline-query');await screenshot('outline-focus');
 if(observe){row.reproduced=state.outlineStyle==='none';save();await context.close();await browser.close();continue;}
 if(!recoveryRed)assert.equal(state.outlineColor,'rgb(40, 83, 68)');await input.fill('獨立審查');await input.press('Enter');assert.match(await page.locator(':focus').innerText(),/獨立審查/);
 await page.locator('.reader-outline summary').scrollIntoViewIfNeeded();await input.focus();await input.fill('沒有這個段落 <script>');assert.match(await page.locator('#reader-outline-status').innerText(),/沒有符合/);await style('#reader-outline-query');await screenshot('outline-empty');
 await page.locator('.reader-outline-clear').click();assert.equal(await input.inputValue(),'');await style('#reader-outline-query');
 await audit();await page.keyboard.press('Escape');
 // Refinement/recovery: category input, empty result then clear, denied sharing fallback.
 await page.locator('#filter-options').evaluate(n=>n.open=true);await page.locator('#category-finder summary').focus();await page.keyboard.press('Enter');await page.keyboard.press('Tab');await style('#category-query');await page.locator('#category-query').fill('旅遊');await screenshot('category-focus');await page.locator('#category-query').fill('');
 await page.locator('#query').fill('不存在的任務'.repeat(30)+'<script>');await page.locator('#search-submit').click();assert(await page.locator('#empty').isVisible());await page.locator('#edit-query').click();await style('#query','.search-wrap');await page.locator('#empty-reset').click();
 await context.grantPermissions([]);await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}}));await page.locator('#copy-search-link').click();await page.locator('#search-share-url').waitFor({state:'visible'});await style('#search-share-url');assert.match(await page.locator('#search-share-url').inputValue(),/ai-agent-use-cases/);await audit();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#results .card .card-bottom button').first().click();await page.locator('#detail[open]').waitFor();await page.locator('#copy-case-link').click();await page.locator('.manual-share-link').waitFor({state:'visible'});await style('.manual-share-link');await screenshot('case-share-focus');await audit();assert.deepEqual(row.errors,[]);save();console.log('PASS '+label);await context.close();await browser.close();
}
})().catch(e=>{fs.writeFileSync(out+'/focus-report.json',JSON.stringify(report,null,2));console.error(e);process.exit(1)});
