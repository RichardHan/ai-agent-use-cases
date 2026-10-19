'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const observe=process.env.CONTEXT_OBSERVE==='1';
const origin=process.env.CONTEXT_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const output=process.env.CONTEXT_OUTPUT||'qa-artifacts/passage';
fs.mkdirSync(output,{recursive:true});
const reports=[];
const save=()=>fs.writeFileSync(output+'/report.json',JSON.stringify(reports,null,2));
(async()=>{
 for(const [engine,launcher] of (observe?[['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]])){
 const browser=await launcher.launch();try{
 for(const [size,width,height] of (engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]])){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(45000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const report={engine,size,cases:[],audits:[]};reports.push(report);save();
 for(const [id,query] of [['UC-001','Lyft'],['UC-028','服務降級']]){
 const response=await page.goto(origin+'?q='+encodeURIComponent(query)+'&case='+id);assert.equal(response.status(),200);
 await page.waitForFunction(()=>discoveryReady,null,{timeout:30000});await page.locator('#detail[open]').waitFor();
 const jump=page.locator('.reader-search-jump').first();await jump.scrollIntoViewIfNeeded();
 await page.screenshot({path:`${output}/${id}-${engine}-${size}-entry.jpg`,type:'jpeg',quality:80});
 const target=await jump.getAttribute('aria-controls');await jump.click();
 const finding=await page.evaluate(({target,query})=>{
  const heading=document.getElementById(target),blocks=[];
  for(let n=heading.nextElementSibling;n&&!/^H[23]$/.test(n.tagName);n=n.nextElementSibling){
   if(n.classList.contains('reader-return'))continue;
   const nodes=/^[UO]L$/.test(n.tagName)?[...n.children]:[n];blocks.push(...nodes);
  }
  const hit=blocks.find(n=>n.textContent.normalize('NFKC').toLowerCase().includes(query.toLowerCase()));
  return {heading:heading.textContent,headingTop:heading.getBoundingClientRect().top,hitTop:hit?.getBoundingClientRect().top,hitText:hit?.textContent,viewport:innerHeight};
 },{target,query});report.cases.push({id,query,...finding});save();
 await page.screenshot({path:`${output}/${id}-${engine}-${size}-heading.jpg`,type:'jpeg',quality:80});
 if(!observe){
  const locate=page.locator('.reader-search-locate').first();assert.equal(await locate.count(),1);
  const excerpt=await page.locator('.reader-search-excerpt').first().textContent();assert(finding.hitText.includes(excerpt.replace(/^…|…$/g,'')),'literal continuous source excerpt');assert(excerpt.toLowerCase().includes(query.toLowerCase()));
  await locate.focus();await page.keyboard.press('Enter');const dest=await locate.getAttribute('aria-controls');
  assert.equal(await page.evaluate(()=>document.activeElement.id),dest);
  const bounds=await page.locator('#'+dest).evaluate(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,toolbarBottom:document.querySelector('.detail-toolbar').getBoundingClientRect().bottom,text:e.textContent}));
  assert(bounds.top>=bounds.toolbarBottom);assert(bounds.top<height);assert(bounds.text.includes(query));assert.equal(bounds.text,finding.hitText);
  report.cases.at(-1).located=bounds;await page.screenshot({path:`${output}/${id}-${engine}-${size}-located.jpg`,type:'jpeg',quality:80});
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.audits.push({id,violations:axe.violations});save();assert.equal(axe.violations.length,0);
  const direct=page.url();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:30000});assert.equal(page.url(),direct);await page.locator('#close-detail').click();assert.equal(await page.locator('#query').inputValue(),query);
 }
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth));assert.deepEqual(errors,[]);report.complete=true;save();await context.close();
 }
 }finally{await browser.close();}
 }
 console.log(JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);save();process.exitCode=1;});
