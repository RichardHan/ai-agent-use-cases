'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const base=process.env.REDESIGN_URL||'http://127.0.0.1:8130/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/visual-redesign';
const observe=process.env.QA_OBSERVE==='1';
fs.mkdirSync(out,{recursive:true});
const report=[],failures=[];
function check(condition,message){if(!condition)failures.push(message);}
function save(){fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({observe,base,report,failures},null,2));}
async function capture(page,row,state){
 await page.screenshot({path:path.join(out,`${state}-${row.width}.png`)});
 const overflow=await page.evaluate(()=>({document:{scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth},detail:document.querySelector('#detail[open]')?{scroll:document.querySelector('#detail').scrollWidth,client:document.querySelector('#detail').clientWidth}:null}));
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 const violations=audit.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));
 row.states[state]={overflow,violations};save();
 if(!observe){
  check(overflow.document.scroll<=overflow.document.client+1,`${row.width} ${state}: document overflows horizontally`);
  if(overflow.detail)check(overflow.detail.scroll<=overflow.detail.client+1,`${row.width} ${state}: detail overflows horizontally`);
  check(violations.length===0,`${row.width} ${state}: axe violations ${violations.map(v=>v.id).join(', ')}`);
 }
}
(async()=>{
 const browser=await chromium.launch();
 try{
  for(const [width,height] of [[1440,900],[768,1024],[390,844],[320,740]]){
   const row={width,height,states:{}},context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();report.push(row);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
    await page.evaluate(()=>scrollTo(0,0));
    const cta=page.locator('.discovery-hero [data-search-entry]').first(),panel=page.locator('.hero-value-props'),tasks=page.locator('.hero-task-examples [data-task-entry]');
    const ctaBox=await cta.boundingBox(),panelBox=await panel.boundingBox();
    const domOrder=await cta.evaluate((node)=>Boolean(node.compareDocumentPosition(document.querySelector('.hero-value-props'))&Node.DOCUMENT_POSITION_FOLLOWING));
    const taskBoxes=[];for(const task of await tasks.all())taskBoxes.push({label:(await task.innerText()).trim(),box:await task.boundingBox()});
    const featureShadows=await page.locator('.hero-value-props, .hero-value-props .value-prop-item').evaluateAll(nodes=>nodes.map(node=>({className:node.className,boxShadow:getComputedStyle(node).boxShadow})));
    row.hero={cta:ctaBox,panel:panelBox,domOrder,taskBoxes,featureShadows};
    await capture(page,row,'home');
    if(!observe){
     check(domOrder,`${width} home: primary search CTA must precede value panel in DOM`);
     check(ctaBox&&panelBox&&ctaBox.y+ctaBox.height<=panelBox.y+1,`${width} home: primary search CTA must appear above value panel`);
     check(ctaBox&&ctaBox.x>=0&&ctaBox.x+ctaBox.width<=width+1&&ctaBox.y>=0&&ctaBox.y+ctaBox.height<=height&&ctaBox.height>=44,`${width} home: primary search CTA must be visible and at least 44px high`);
     check(taskBoxes.length===3,`${width} home: expected three task links`);
     for(const {label,box} of taskBoxes)check(box&&box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=height&&box.height>=44,`${width} home: ${label} must be in the initial viewport and at least 44px high`);
     for(const item of featureShadows)check(item.boxShadow==='none',`${width} home: ${item.className} has a shadow`);
    }
    await cta.focus();await page.keyboard.press('Enter');
    if(!observe)check(await page.locator('#query').evaluate(el=>el===document.activeElement),`${width} search: keyboard CTA must focus the search field`);
    await page.locator('#query').fill('旅遊');
    await page.locator('#filter-options').evaluate(el=>el.open=true);await page.locator('#scenario').selectOption('生活');
    await page.locator('#search-submit').click();await page.locator('#results .card').first().waitFor();
    if(!observe){check(await page.locator('#query').inputValue()==='旅遊',`${width} results: query must be retained`);check(await page.locator('#scenario').inputValue()==='生活',`${width} results: scenario must be retained`);}
    await page.locator('#results-count').scrollIntoViewIfNeeded();await capture(page,row,'results');
    const target=page.locator('#results .card[data-case-id="UC-001"] .card-bottom button');
    await target.waitFor();await target.focus();if(!observe)check(await target.evaluate(el=>el===document.activeElement),`${width} detail: read control must receive keyboard focus`);await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();
    row.detailId=await page.locator('#detail-toolbar-id').innerText();await capture(page,row,'detail');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('detail').open);
    row.returnedFocus=await target.evaluate(el=>el===document.activeElement);row.errors=errors;
    if(!observe){check(row.detailId==='UC-001',`${width} detail: expected UC-001`);check(row.returnedFocus,`${width} detail: Escape must restore focus to the read control`);check(errors.length===0,`${width}: page errors ${errors.join(', ')}`);}
    save();console.log(`VISUAL_CHECK ${width}`);
   }catch(error){row.failure=error.stack;save();throw error;}finally{await context.close();}
  }
 }finally{await browser.close();}
 save();if(!observe)assert.deepEqual(failures,[],'visual redesign acceptance failures');
})().catch(error=>{save();console.error(error);process.exitCode=1});
