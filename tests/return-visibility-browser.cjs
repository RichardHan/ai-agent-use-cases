'use strict';
const {webkit,chromium,firefox}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.RETURN_URL||'http://127.0.0.1:8087/ai-agent-use-cases/';
const before=!!process.env.RETURN_BEFORE,native=!!process.env.RETURN_NATIVE;
const delayedMs=Number(process.env.RETURN_DELAY_MS||180);
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});const reports=[];
 if(native){
  for(let attempt=0;attempt<30;attempt++){
   const response=await fetch(origin+'assets/app.js?return-qa='+Date.now(),{cache:'no-store'});
   if(response.ok&&await response.text()===fs.readFileSync('assets/app.js','utf8'))break;
   if(attempt===29)throw Error('Published return asset does not match checkout');
   await new Promise(resolve=>setTimeout(resolve,5000));
  }
 }
 for(const [engine,launch] of before?[['webkit',webkit]]:[['webkit',webkit],['chromium',chromium],['firefox',firefox]]){
  const browser=await launch.launch();
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const search=origin+'?q=旅遊&tool=Grok%20Bot#explore';
  await page.goto(search,{waitUntil:'networkidle'});
  const trigger=page.locator('#results .card .card-bottom button').first();await trigger.waitFor();
  const ids=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId));
  for(const mode of native?Array(10).fill('button'):['button','new-focus','user-scroll','pointer','key','touch','new-url','reopen','removed','deadline-ended']){
   if(await page.locator('#detail').evaluate(e=>e.open))await page.locator('#close-detail').click();
   if(mode!=='button')await page.goto(search,{waitUntil:'networkidle'});
   await page.evaluate(()=>{window.returnFixtureInjected=false;});
   await trigger.click();await page.locator('#detail[open]').waitFor();
   await page.locator('.reader-jump').first().click();
   // Simulate a fragment scroll after the old two-frame guard has ended.
   // This checks controlled ordering, without claiming the engine's root cause.
   if(!native)await page.evaluate(({mode,delayedMs})=>window.addEventListener('popstate',()=>{
    const started=performance.now();
    window.returnFixtureTiming={started};
    const inject=()=>{
     window.returnFixtureTiming.injected=performance.now()-started;
     window.returnFixtureTarget=document.activeElement;
     if(mode==='new-focus')document.getElementById('query').focus({preventScroll:true});
     if(mode==='user-scroll')window.dispatchEvent(new WheelEvent('wheel',{deltaY:100}));
     if(mode==='pointer')window.dispatchEvent(new PointerEvent('pointerdown'));
     if(mode==='key')window.dispatchEvent(new KeyboardEvent('keydown',{key:'Shift'}));
     if(mode==='touch')window.dispatchEvent(new Event('touchstart'));
     if(mode==='new-url')history.replaceState(null,'',location.pathname+location.search+'#manual');
     if(mode==='reopen')document.getElementById('detail').showModal();
     if(mode==='removed')document.activeElement.remove();
     document.getElementById('explore').scrollIntoView({block:'start',behavior:'instant'});
     window.returnFixtureIntendedScroll=scrollY;
     window.returnFixtureInjected=true;
    };
    let frames=3;
    const afterFrames=()=>{
     if(--frames>0){requestAnimationFrame(afterFrames);return;}
     window.returnFixtureTiming.frames=performance.now()-started;
     setTimeout(inject,Math.max(0,(mode==='deadline-ended'?420:delayedMs)-(performance.now()-started)));
    };
    requestAnimationFrame(afterFrames);
   },{once:true}),{mode,delayedMs});
   await page.goBack();
   // Observe after the bounded return guard has completely released listeners.
   await page.waitForTimeout(500);
   const state=await page.evaluate(()=>({injected:window.returnFixtureInjected,timing:window.returnFixtureTiming,scrollY,intendedScrollY:window.returnFixtureIntendedScroll,hash:location.hash,tool:document.getElementById('tool').value,targetConnected:window.returnFixtureTarget?.isConnected,focus:document.activeElement.id||document.activeElement.className,card:document.activeElement.closest('.card')?.dataset.caseId,rect:document.querySelector('#results .card .card-bottom button').getBoundingClientRect().toJSON(),height:innerHeight,open:document.getElementById('detail').open,query:document.getElementById('query').value}));
   reports.push({engine,mode,native,delayedMs,...state});fs.writeFileSync(`qa-artifacts/return-${before?'before':native?'live':'after'}.json`,JSON.stringify(reports,null,2));
   await page.screenshot({path:`qa-artifacts/return-${before?'before':native?'live':'after'}-${engine}-${mode}.png`});
   assert.deepEqual(errors,[]);
   if(!native){
    assert.equal(state.injected,true);
    assert(state.timing.injected>=(mode==='deadline-ended'?419:delayedMs-1),'injection follows its requested time');
    if(mode!=='deadline-ended')assert(state.timing.injected<=250,'fixture timing exceeded correction margin: '+JSON.stringify(state.timing));
   }
   assert.equal(state.open,mode==='reopen');assert.equal(state.query,'旅遊');assert.equal(state.tool,'Grok Bot');assert.equal(state.hash,mode==='new-url'?'#manual':'#explore');
   assert.deepEqual(await page.locator('#results .card').evaluateAll(nodes=>nodes.map(n=>n.dataset.caseId)),ids);
   if(mode==='new-focus')assert.equal(state.focus,'query','new user focus must win');
   else if(mode==='removed')assert.equal(state.targetConnected,false);
   else if(['user-scroll','pointer','key','touch','new-url','deadline-ended'].includes(mode)){assert(state.rect.bottom>state.height,'newer reader interaction must win');assert(Math.abs(state.scrollY-state.intendedScrollY)<=1,'preserve the reader-selected scroll position');}
   else if(mode==='button'){
    assert.equal(state.card,ids[0]);assert(state.rect.y>=-1&&state.rect.bottom<=state.height+1,'returning focused button remains visible after delayed fragment scrolling: '+JSON.stringify(state));
   }
  }
  await browser.close();
 }
 console.log(JSON.stringify(reports,null,2));
})().catch(error=>{console.error(error);process.exit(1)});
