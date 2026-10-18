'use strict';
const {webkit,chromium,firefox}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.RETURN_URL||'http://127.0.0.1:8087/ai-agent-use-cases/';
const before=!!process.env.RETURN_BEFORE;
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});const reports=[];
 for(const [engine,launch] of before?[['webkit',webkit]]:[['webkit',webkit],['chromium',chromium],['firefox',firefox]]){
  const browser=await launch.launch();
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await page.goto(origin+'?q=旅遊&tool=Grok%20Bot#explore',{waitUntil:'networkidle'});
  const trigger=page.locator('#results .card .card-bottom button').first();await trigger.waitFor();
  const ids=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId));
  for(const newerFocus of [false,true]){
   await trigger.click();await page.locator('#detail[open]').waitFor();
   await page.locator('.reader-jump').first().click();
   // Simulate WebKit applying fragment scroll after the app's first frame.
   // This is a controlled ordering check, not a claim about the engine's internals.
   await page.evaluate(newerFocus=>window.addEventListener('popstate',()=>requestAnimationFrame(()=>{
    if(newerFocus)document.getElementById('query').focus({preventScroll:true});
    document.getElementById('explore').scrollIntoView({block:'start',behavior:'instant'});
   }),{once:true}),newerFocus);
   await page.goBack();
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));
   const state=await page.evaluate(()=>({focus:document.activeElement.id||document.activeElement.className,card:document.activeElement.closest('.card')?.dataset.caseId,rect:document.querySelector('#results .card .card-bottom button').getBoundingClientRect().toJSON(),height:innerHeight,open:document.getElementById('detail').open,query:document.getElementById('query').value}));
   reports.push({engine,newerFocus,...state});fs.writeFileSync(`qa-artifacts/return-${before?'before':'after'}.json`,JSON.stringify(reports,null,2));
   await page.screenshot({path:`qa-artifacts/return-${before?'before':'after'}-${engine}-${newerFocus?'new-focus':'button'}.png`});
   assert.equal(state.open,false);assert.equal(state.query,'旅遊');
   assert.deepEqual(await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId)),ids);
   if(newerFocus)assert.equal(state.focus,'query','new user focus must win');
   else{
    assert.equal(state.card,ids[0]);assert(state.rect.y>=-1&&state.rect.bottom<=state.height+1,'returning focused button remains visible after delayed fragment scrolling: '+JSON.stringify(state));
   }
  }
  await browser.close();
 }
 console.log(JSON.stringify(reports,null,2));
})().catch(error=>{console.error(error);process.exit(1)});
