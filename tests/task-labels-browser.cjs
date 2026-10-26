'use strict';
const {chromium}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'http://127.0.0.1:8134/ai-agent-use-cases/',out=process.env.QA_OUT||'qa-artifacts/after';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch(),report=[];
for(const width of [1440,390,320]){const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),row={width,errors:[],chips:[]};report.push(row);console.log('LABELS START '+width);page.on('pageerror',e=>row.errors.push(e.message));
try{await page.goto(base);await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.evaluate(()=>failedPaths.length),0);row.total=await page.evaluate(()=>entries.length);
await page.locator('#filter-options').evaluate(n=>n.open=true);await page.locator('#scenario-chips').scrollIntoViewIfNeeded();
for(const q of ['每日','收件匣','比價','排程']){const chip=page.locator('#scenario-chips').getByRole('button',{name:new RegExp('搜尋「'+q+'」')});await chip.waitFor({state:'visible'});const box=await chip.evaluate(n=>{const b=n.getBoundingClientRect(),s=getComputedStyle(n);return {left:b.left,right:b.right,height:b.height,scroll:n.scrollWidth,client:n.clientWidth,font:s.fontSize,description:n.getAttribute('aria-describedby')};});assert(box.left>=0&&box.right<=width);assert(box.scroll<=box.client+1);assert.equal(box.description,'task-shortcuts-hint');row.chips.push({q,...box});}
row.hint=await page.locator('#task-shortcuts-hint').innerText();assert(row.hint.includes('搜尋全文及相關詞，包含來源與限制；命中不代表已實作或驗證'));
await page.screenshot({path:`${out}/tasks-${width}.png`});const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.violations=scan.violations.map(v=>v.id);assert.deepEqual(row.violations,[]);
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(row.errors,[]);console.log('LABELS PASS '+width);
}finally{fs.writeFileSync(out+'/label-report.json',JSON.stringify(report,null,2));await context.close();}}
await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
