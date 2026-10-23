'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8170/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/context',observe=process.env.QA_OBSERVE==='1';fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];
for(const [engine,width] of (observe?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();const label=engine.name()+'-'+width,row={label,states:[],errors:[]};rows.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 const state=async name=>{row.states.push({name,title:await page.title(),url:page.url(),heading:await page.locator('#detail').evaluate(n=>n.open)?await page.locator('#detail-title').innerText():await page.locator('#results-count').innerText()});await page.screenshot({path:`${out}/${name}-${label}.png`});fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));};
 try{
 await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.evaluate(()=>failedPaths.length),0);row.total=await page.evaluate(()=>entries.length);await state('home');
 await page.locator('.hero-search-link').click();await page.locator('#query').fill('旅遊');await page.locator('#filter-options').evaluate(n=>n.open=true);await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');await state('search');
 const read=page.locator('#results .card .card-bottom button').first();await read.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();row.case=await page.locator('#detail-toolbar-id').innerText();await state('detail');
 await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();await state('source');const source=page.locator('.markdown a[href^="https:"]').first();row.source=await source.getAttribute('href');
 if(width===1440){const popupEvent=page.waitForEvent('popup');await source.click();const popup=await popupEvent;await popup.waitForLoadState('domcontentloaded',{timeout:15000}).catch(()=>{});row.openedSource=popup.url();await popup.close();}
 await page.keyboard.press('Escape');assert(await read.evaluate(n=>n===document.activeElement));await state('returned');
 await page.locator('#query').fill('no-page-context-qa-result');await page.locator('#empty').waitFor({state:'visible'});await state('empty');await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(n=>n===document.activeElement));
 row.violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));assert.deepEqual(row.violations,[]);assert.deepEqual(row.errors,[]);console.log('PASS '+label);
 }catch(e){row.failure=e.stack;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));await browser.close();}
}
})().catch(e=>{console.error(e);process.exit(1)});
