'use strict';
const {chromium}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.LINK_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const out=process.env.LINK_OUTPUT||'qa-artifacts/source-links',observe=process.env.LINK_OBSERVE==='1';
fs.mkdirSync(out,{recursive:true});const report=[];
const prefix='https://github.com/jojowanuby/LLM-Alignment-Atlas/blob/main/GrokBot%20Workspace%20(copied%20from%20VM)/';
const expected=[prefix+'llm-alignment-summary-long.csv',prefix+'llm-alignment-summary_README.md'];
(async()=>{for(const width of [1440,390]){
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'}),page=await context.newPage();const row={width,links:[],errors:[]};report.push(row);
 try{page.on('pageerror',e=>row.errors.push(e.message));await page.goto(base+'?case=UC-161');await page.locator('#detail[open]').waitFor({timeout:90000});
 await page.locator('.research-details').evaluate(e=>e.open=true);
 const links=page.locator('.research-details .markdown a');
 for(const [i,label] of ['公開CSV','補檔紀錄'].entries()){
 const link=links.getByText(label,{exact:true});await link.focus();await link.scrollIntoViewIfNeeded();
 row.links.push({label,expected:expected[i],actual:await link.getAttribute('href'),text:await link.locator('..').innerText()});
 if(!observe){assert.equal(row.links[i].actual,expected[i]);assert.equal(await link.getAttribute('rel'),'noopener noreferrer');}
 }
 await page.screenshot({path:`${out}/source-${width}.png`});
 row.popups=[];
 for(const [i,label] of ['公開CSV','補檔紀錄'].entries()){
 const popupWait=page.waitForEvent('popup');await links.getByText(label,{exact:true}).click();const popup=await popupWait;await popup.waitForLoadState('domcontentloaded').catch(()=>{});row.popups.push({label,url:popup.url()});if(!observe)assert.equal(decodeURI(popup.url()),decodeURI(expected[i]));await popup.close();
 }
 row.audit=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(row.audit,[]);
 assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.keyboard.press('Escape');assert.equal(await page.locator('#detail').evaluate(e=>e.open),false);
 await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});row.entries=await page.evaluate(()=>entries.length);row.failed=await page.evaluate(()=>failedPaths);assert.deepEqual(row.failed,[]);assert.deepEqual(row.errors,[]);row.completed=true;
 }catch(e){row.failure=e.message;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
