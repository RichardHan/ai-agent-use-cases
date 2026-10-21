'use strict';
const {chromium}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.PRINT_URL||'http://127.0.0.1:8108/ai-agent-use-cases/';
const observe=process.env.OBSERVE==='1',label=process.env.LABEL||(observe?'before':'after');
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const browser=await chromium.launch(),reports=[];
 for(const [width,height] of [[1440,1000],[390,844]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 await page.goto(base,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>typeof discoveryReady!=='undefined'&&discoveryReady,{timeout:90000});
 await page.screenshot({path:`qa-artifacts/${label}-home-${width}.png`});
 await page.locator('#query').fill('旅遊');
 await require('./filter-controls.cjs').ensureFiltersVisible(page);
 await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');
 const read=page.locator('#results .card .card-bottom button').first();await read.click();
 await page.keyboard.press('Escape');assert(await read.evaluate(e=>e===document.activeElement));
 await page.locator('#query').fill('no-match-398239');assert(await page.locator('#empty').isVisible());
 await page.goto(base+'?case=UC-005',{waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
 await page.screenshot({path:`qa-artifacts/${label}-detail-${width}.png`});
 const link=page.locator('.research-details a[href^="https:"]').first();
 const source=await link.getAttribute('href');const response=await page.request.get(source,{failOnStatusCode:false}).catch(e=>({status:()=>e.message}));
 await page.emulateMedia({media:'print'});
 await page.screenshot({path:`qa-artifacts/${label}-print-${width}.png`,fullPage:true});
 const state=await page.evaluate(()=>({dialog:{height:document.querySelector('#detail').clientHeight,scrollHeight:document.querySelector('#detail').scrollHeight,overflow:getComputedStyle(document.querySelector('#detail')).overflowY},researchOpen:document.querySelector('.research-details').open,researchBodyVisible:!!document.querySelector('.research-details .markdown').getBoundingClientRect().height,mainVisible:getComputedStyle(document.querySelector('main')).display!=='none',printButton:!!document.querySelector('#print-case')}));
 reports.push({width,state,source,sourceHTTP:response.status()});
 fs.writeFileSync(`qa-artifacts/${label}-report.json`,JSON.stringify(reports,null,2));
 if(!observe){assert(state.printButton);assert(state.researchBodyVisible);assert(!state.mainVisible);assert(state.dialog.scrollHeight<=state.dialog.height+2,'all research must print without clipping');}
 await page.emulateMedia({media:'screen'});
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 reports.at(-1).axe=axe.violations.map(v=>v.id);assert.equal(axe.violations.length,0);
 await page.reload({waitUntil:'networkidle'});await page.locator('#detail[open]').waitFor();
 await page.keyboard.press('Escape');assert(!new URL(page.url()).searchParams.has('case'));
 await page.close();
 }
 fs.writeFileSync(`qa-artifacts/${label}-report.json`,JSON.stringify(reports,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
