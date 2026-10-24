'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8184/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/reading-selection',observe=process.env.QA_OBSERVE==='1';
fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];
for(const [engine,width] of (process.env.QA_CHROMIUM==='1'?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const b=await engine.launch(),context=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
 const row={engine:engine.name(),width,checks:[],errors:[]};rows.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 const id=()=>page.locator('#detail-toolbar-id').innerText();
 const snapshot=()=>page.evaluate(()=>({url:location.href,history:history.length,title:document.title}));
 const select=async (selector,focus=true)=>{const n=page.locator(selector).first();await n.scrollIntoViewIfNeeded();await n.evaluate((n,focus)=>{if(focus)n.focus();const range=document.createRange();range.selectNodeContents(n);const s=document.getSelection();s.removeAllRanges();s.addRange(range)},focus);assert(await page.evaluate(()=>!getSelection().isCollapsed));};
 try{
 await page.goto(base+'?q=旅遊&scenario=生活&tool=Grok+Bot&case=UC-001');await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.locator('#detail[open]').waitFor();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await id(),'UC-001');
 // Reader who selects the title before quoting or saving a case.
 await select('#detail-title');const before=await snapshot();await page.screenshot({path:`${out}/selected-${engine.name()}-${width}.png`});await page.keyboard.press('ArrowRight');
 row.checks.push({flow:'selected-title',before:'UC-001',after:await id()});await page.screenshot({path:`${out}/after-arrow-${engine.name()}-${width}.png`});
 if(observe)continue;
 assert.equal(await id(),'UC-001');assert.deepEqual(await snapshot(),before);
 // Normal navigation remains available once selection is explicitly cleared.
 await page.evaluate(()=>getSelection().removeAllRanges());await page.locator('#detail-title').focus();await page.keyboard.press('ArrowRight');const next=await id();assert.notEqual(next,'UC-001');await page.keyboard.press('ArrowLeft');assert.equal(await id(),'UC-001');row.checks.push({flow:'unselected-navigation',next,returned:await id()});
 // Reader examining and selecting the full source report, in both directions.
 await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();
 for(const key of ['ArrowLeft','ArrowRight']){await select('.markdown p');const previous=await snapshot();await page.keyboard.press(key);assert.equal(await id(),'UC-001');assert.deepEqual(await snapshot(),previous);}
 row.checks.push({flow:'source-passage',bothDirections:true});
 // Explicit navigation still works while a range exists (Enter and pointer).
 await page.locator('#nav-next-case').focus();await select('#detail-title',false);await page.keyboard.press('Enter');assert.notEqual(await id(),'UC-001');
 await select('#detail-title');await page.locator('#nav-prev-case').click();assert.equal(await id(),'UC-001');
 await select('#detail-title');
 row.checks.push({flow:'selected-explicit-navigation',passed:true});
 row.axe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));assert.deepEqual(row.axe,[]);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
 await page.locator('#query').fill('no-selection-results-xyz');await page.locator('#empty').waitFor({state:'visible'});await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(n=>document.activeElement===n));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(row.errors,[]);
 row.checks.push({flow:'return-and-empty-recovery',passed:true});console.log('PASS '+engine.name()+' '+width);
 }catch(e){row.failure=e.stack;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));await b.close();}
}
})().catch(e=>{console.error(e);process.exitCode=1});
