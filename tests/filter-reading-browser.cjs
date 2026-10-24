'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8187/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/filter-after',observe=process.env.QA_OBSERVE==='1';
fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];
for(const [engine,width] of (observe?[[chromium,1440],[chromium,390],[chromium,320]]:[[chromium,1440],[chromium,768],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const b=await engine.launch(),p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),row={label:engine.name()+'-'+width,errors:[]};rows.push(row);p.on('pageerror',e=>row.errors.push(e.message));
 try{
 await p.goto(base);await p.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.deepEqual(await p.evaluate(()=>failedPaths),[]);row.total=await p.evaluate(()=>entries.length);
 await p.locator('#filter-options').evaluate(n=>n.open=true);await p.locator('.filter-row').scrollIntoViewIfNeeded();
 row.layout=await p.locator('.filter-row').evaluate(n=>({columns:getComputedStyle(n).gridTemplateColumns,controls:[...n.querySelectorAll('label,select,button')].map(x=>({tag:x.tagName,font:parseFloat(getComputedStyle(x).fontSize),height:x.getBoundingClientRect().height,width:x.getBoundingClientRect().width})),overflow:document.documentElement.scrollWidth>innerWidth}));
 await p.screenshot({path:`${out}/controls-${row.label}.png`});
 if(!observe){
  assert.equal(row.layout.overflow,false);
  for(const c of row.layout.controls){assert(c.font>=14,'labels and reset must remain legible');if(c.tag!=='LABEL'){assert(c.height>=44);assert(c.width>=44);}if(c.tag==='SELECT'){assert(c.font>=16);assert(c.width>=220,'room for selected values');}}
  const cols=row.layout.columns.split(' ').length;assert.equal(cols,width<=480?1:width<=1000?2:3);
  // Native controls retain normal keyboard order and a visible focus indicator.
  await p.locator('#scenario').focus();row.focus=await p.locator('#scenario').evaluate(n=>({active:n===document.activeElement,style:getComputedStyle(n).outlineStyle,width:parseFloat(getComputedStyle(n).outlineWidth)}));assert(row.focus.active);assert.notEqual(row.focus.style,'none');assert(row.focus.width>=2);
  await p.keyboard.press('Tab');assert(await p.locator('#kind').evaluate(n=>n===document.activeElement));
 }
 // Scenario 1: a visitor starts with a problem, combines facets, reads and returns.
 await p.locator('#query').fill('旅遊');await p.locator('#scenario').selectOption('生活');await p.locator('#tool').selectOption('Grok Bot');await p.locator('#search-submit').click();row.results=await p.locator('#results-count').innerText();
 const read=p.locator('#results .card[data-case-id="UC-001"] .card-bottom button');await read.click();await p.locator('#detail[open]').waitFor();await p.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();row.source=await p.locator('.research-details .markdown a[href^="https:"]').first().getAttribute('href');
 await p.keyboard.press('Escape');assert(await read.evaluate(n=>n===document.activeElement));assert.equal(await p.locator('#scenario').inputValue(),'生活');assert.equal(await p.locator('#tool').inputValue(),'Grok Bot');
 // Scenario 2: impossible constraints are recoverable and preserve keyboard access.
 await p.locator('#query').fill('no-filter-reading-qa-result');await p.locator('#empty').waitFor({state:'visible'});await p.locator('#edit-query').click();assert(await p.locator('#query').evaluate(n=>n===document.activeElement));await p.locator('#empty-reset').click();
 // Scenario 3: long classification names remain native options; reset returns the full corpus.
 await p.locator('#filter-options').evaluate(n=>n.open=true);const long=await p.locator('#category option').evaluateAll(ns=>ns.filter(n=>n.value).sort((a,b)=>b.textContent.length-a.textContent.length)[0].value);await p.locator('#category').selectOption(long);row.longCategory=long;assert.equal(await p.locator('#category').inputValue(),long);await p.locator('.filter-row').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/selected-${row.label}.png`});
 await p.locator('#reset').click();assert.equal(await p.locator('#category').inputValue(),'');assert.equal(await p.locator('#query').inputValue(),'');assert.equal(await p.locator('#results-count').innerText(),`顯示 ${row.total} / ${row.total} 筆收錄`);
 row.violations=(await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));assert.deepEqual(row.violations,[]);assert.deepEqual(row.errors,[]);console.log('PASS '+row.label);
 }catch(e){row.failure=e.stack;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));await b.close();}
}
})().catch(e=>{console.error(e);process.exit(1)});
