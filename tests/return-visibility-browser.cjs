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
  const search=origin+'?q=旅遊&tool=Grok%20Bot#explore';
  await page.goto(search,{waitUntil:'networkidle'});
  const trigger=page.locator('#results .card .card-bottom button').first();await trigger.waitFor();
  const ids=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId));
  for(const mode of ['button','new-focus','user-scroll','new-url','reopen','removed']){
   if(mode!=='button')await page.goto(search,{waitUntil:'networkidle'});
   await trigger.click();await page.locator('#detail[open]').waitFor();
   await page.locator('.reader-jump').first().click();
   // Simulate WebKit applying fragment scroll after the app's first frame.
   // This is a controlled ordering check, not a claim about the engine's internals.
   await page.evaluate(mode=>window.addEventListener('popstate',()=>requestAnimationFrame(()=>{
    window.returnFixtureTarget=document.activeElement;
    if(mode==='new-focus')document.getElementById('query').focus({preventScroll:true});
    if(mode==='user-scroll')window.dispatchEvent(new WheelEvent('wheel',{deltaY:100}));
    if(mode==='new-url')history.replaceState(null,'',location.pathname+location.search+'#manual');
    if(mode==='reopen')document.getElementById('detail').showModal();
    if(mode==='removed')document.activeElement.remove();
    document.getElementById('explore').scrollIntoView({block:'start',behavior:'instant'});
    window.returnFixtureInjected=true;
   }),{once:true}),mode);
   await page.goBack();
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));
   const state=await page.evaluate(()=>({injected:window.returnFixtureInjected,hash:location.hash,tool:document.getElementById('tool').value,targetConnected:window.returnFixtureTarget?.isConnected,focus:document.activeElement.id||document.activeElement.className,card:document.activeElement.closest('.card')?.dataset.caseId,rect:document.querySelector('#results .card .card-bottom button').getBoundingClientRect().toJSON(),height:innerHeight,open:document.getElementById('detail').open,query:document.getElementById('query').value}));
   reports.push({engine,mode,...state});fs.writeFileSync(`qa-artifacts/return-${before?'before':'after'}.json`,JSON.stringify(reports,null,2));
   await page.screenshot({path:`qa-artifacts/return-${before?'before':'after'}-${engine}-${mode}.png`});
   assert.equal(state.injected,true);assert.equal(state.open,mode==='reopen');assert.equal(state.query,'旅遊');assert.equal(state.tool,'Grok Bot');assert.equal(state.hash,mode==='new-url'?'#manual':'#explore');
   assert.deepEqual(await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId)),ids);
   if(mode==='new-focus')assert.equal(state.focus,'query','new user focus must win');
   else if(mode==='removed')assert.equal(state.targetConnected,false);
   else if(['user-scroll','new-url'].includes(mode))assert(state.rect.bottom>state.height,'newer reader interaction must win');
   else if(mode==='button'){
    assert.equal(state.card,ids[0]);assert(state.rect.y>=-1&&state.rect.bottom<=state.height+1,'returning focused button remains visible after delayed fragment scrolling: '+JSON.stringify(state));
   }
  }
  await browser.close();
 }
 console.log(JSON.stringify(reports,null,2));
})().catch(error=>{console.error(error);process.exit(1)});
