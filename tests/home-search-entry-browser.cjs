'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.SEARCH_ENTRY_URL||'http://127.0.0.1:8087/ai-agent-use-cases/';
const observe=process.env.SEARCH_ENTRY_OBSERVE==='1';
fs.mkdirSync('qa-artifacts',{recursive:true});
const report=[];
async function capture(page,name){
 const path='qa-artifacts/'+name+'.jpg';
 await page.screenshot({path,type:'jpeg',quality:75});
 console.log('CAPTURED:'+name+':'+path);
}
(async()=>{
 for(const [engine,width,height] of [[chromium,1440,1000],[chromium,390,844],[chromium,320,740],[firefox,390,844],[webkit,390,844]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.locator('#drawn-case .card').waitFor();
  await page.evaluate(()=>scrollTo(0,0));
  const entry=page.locator('.discovery-hero [data-search-entry]');
  const rect=await entry.count()?await entry.boundingBox():null;
  const row={engine:engine.name(),width,height,entry:rect,queryBefore:await page.locator('#query').boundingBox()};
  if(engine===chromium&&width!==320)await capture(page,'entry-'+(observe?'before':'after')+'-'+width);
  if(observe){report.push(row);await browser.close();continue;}
  const taskLinks=page.locator('.hero-task-examples [data-task-entry]');
  assert.equal(await taskLinks.count(),3,'homepage exposes three evidence-backed task searches');
  for(const link of await taskLinks.all()){
   const rect=await link.boundingBox();
   assert(rect&&rect.y>=0&&rect.y+rect.height<=height,'task examples stay in the initial viewport');
   assert(rect.height>=44,'task examples have a 44px touch target');
  }
  const taskExamples=await taskLinks.evaluateAll(nodes=>nodes.map(node=>({label:node.innerText.trim(),href:node.getAttribute('href')})));
  assert.deepEqual(taskExamples.map(item=>new URL(item.href,origin).searchParams.get('q')),['規劃旅行','收件匣','比價']);
  if(engine===webkit){
   await taskLinks.first().focus();
   assert(await taskLinks.first().evaluate(node=>node.tagName==='A'&&node.tabIndex>=0&&node.matches(':focus-visible')&&getComputedStyle(node).outlineWidth==='3px'),'task links expose a visible focus style ('+engine.name()+' '+width+'px)');
  }else{
   for(let step=0;step<32;step++){
    if(await taskLinks.first().evaluate(node=>node===document.activeElement))break;
    await page.keyboard.press('Tab');
   }
   assert(await taskLinks.first().evaluate(node=>node===document.activeElement&&node.matches(':focus-visible')),'task examples are reachable with a visible keyboard focus ('+engine.name()+' '+width+'px)');
  }
  if(engine===chromium&&width===1440){
   const taskPage=await context.newPage();
   for(let index=0;index<taskExamples.length;index++){
    const example=taskExamples[index];
    if(index===0){
     await taskPage.goto(origin,{waitUntil:'networkidle'});
     await taskPage.locator('.hero-task-examples [data-task-entry]').nth(index).click();
    }else await taskPage.goto(new URL(example.href,origin).href,{waitUntil:'networkidle'});
    await taskPage.locator('#results .card').first().waitFor();
    assert.equal(await taskPage.locator('#query').inputValue(),new URL(example.href,origin).searchParams.get('q'));
    assert((await taskPage.locator('#results .card').count())>0,example.label+' must open matching results');
    row.taskSearches??=[];row.taskSearches.push({label:example.label,count:await taskPage.locator('#results .card').count(),first:await taskPage.locator('#results .card h3').first().innerText()});
    if(index===0){
     await taskPage.screenshot({path:'qa-artifacts/task-entry-results.png'});
     const read=taskPage.locator('#results .card .card-bottom button').first();
     await read.click();await taskPage.locator('#detail[open]').waitFor();
     await taskPage.locator('.research-details summary').click();
     assert.match(await taskPage.locator('.markdown a[href^="https:"]').first().getAttribute('href'),/^https:/);
     await taskPage.goBack();await taskPage.waitForFunction(()=>!document.getElementById('detail').open);
     assert.equal(await taskPage.locator('#query').inputValue(),'規劃旅行','return from a case keeps the task query');
    }
   }
   await taskPage.close();
  }
  assert(rect&&rect.y>=0&&rect.y+rect.height<=height,'direct search entry must be in the initial viewport');
  assert(rect.height>=44,'search entry must have a 44px target');
  assert.equal(await entry.getAttribute('href'),'#explore','native fallback stays on the static page');
  const historyLength=await page.evaluate(()=>{history.replaceState({...history.state,entryQAMarker:'keep'},'');return history.length;});
  for(const options of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1}]){
   const prevented=await entry.evaluate((link,options)=>{
    let intercepted;
    link.addEventListener('click',event=>{intercepted=event.defaultPrevented;event.preventDefault();},{once:true});
    link.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,button:0,...options}));
    return intercepted;
   },options);
   assert.equal(prevented,false,'modified/middle click retains native link handling');
  }
  await entry.focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>history.length),historyLength,'shortcut does not add a history step');
  assert.equal(await page.evaluate(()=>history.state.entryQAMarker),'keep');
  assert.equal(await page.locator('#query').evaluate(el=>document.activeElement===el),true);
  assert.equal(new URL(page.url()).hash,'#explore');
  const searchRect=await page.locator('#query').boundingBox();
  assert(searchRect.y>=0&&searchRect.y+searchRect.height<=height,'search input must be visible');
  await page.keyboard.type('旅遊');
  await page.locator('#filter-options').evaluate(el=>el.open=true);
  await page.locator('#scenario').selectOption('生活');
  assert((await page.locator('#results .card').count())>0);
  const read=page.locator('#results .card .card-bottom button').first();
  const id=await page.locator('#results .card').first().getAttribute('data-case-id');
  await read.click();await page.locator('#detail[open]').waitFor();
  await page.locator('.research-details summary').click();
  assert.match(await page.locator('.markdown a[href^="https:"]').first().getAttribute('href'),/^https:/);
  await page.evaluate(()=>{
   window.entryReturnTrace=[];
   const sample=label=>{
    const active=document.activeElement;
    const target=document.querySelector('#results .card .card-bottom button');
    window.entryReturnTrace.push({label,time:performance.now(),scrollY,url:location.href,history:history.state,focus:{tag:active.tagName,id:active.id,card:active.closest('.card')?.dataset.caseId,rect:active.getBoundingClientRect().toJSON()},target:target?.getBoundingClientRect().toJSON(),open:document.getElementById('detail').open});
   };
   addEventListener('popstate',()=>{sample('popstate');[0,50,100,200,400,800].forEach(delay=>setTimeout(()=>sample('after-'+delay),delay));},{once:true});
  });
  await page.goBack();await page.waitForFunction(()=>!document.getElementById('detail').open);
  try{await page.waitForFunction(id=>{
   const active=document.activeElement,rect=active.getBoundingClientRect();
   return active.closest('.card')?.dataset.caseId===id&&rect.top>=-1&&rect.bottom<=innerHeight+1;
  },id,{timeout:1000});}catch(error){
   console.log('RETURN_DIAGNOSTIC '+JSON.stringify({engine:engine.name(),width,expected:id,trace:await page.evaluate(()=>window.entryReturnTrace)}));
   await capture(page,'entry-return-failure-'+engine.name()+'-'+width);
   throw error;
  }
  const returnedRect=await page.evaluate(()=>document.activeElement.getBoundingClientRect().toJSON());
  assert(returnedRect.y>=-1&&returnedRect.bottom<=height+1,'returned read button stays visible');
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  await page.locator('#query').fill('no-such-task-entry-987654');
  await page.locator('#empty').waitFor({state:'visible'});
  await page.locator('#edit-query').click();
  assert.equal(await page.locator('#query').evaluate(el=>document.activeElement===el),true);
  await page.locator('#empty-reset').click();
  await page.locator('#query').fill('旅遊');
  await page.locator('.draw-actions [data-search-entry]').click();
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert.equal(await page.locator('#query').evaluate(el=>document.activeElement===el),true);
  if(engine===chromium&&width!==320)await capture(page,'entry-search-'+width);
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  row.axeViolations=audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
  assert.deepEqual(row.axeViolations,[]);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.goto(origin+'?q=旅遊&scenario=生活&case=UC-001#explore',{waitUntil:'networkidle'});
  await page.locator('#detail[open]').waitFor();await page.reload({waitUntil:'networkidle'});
  await page.locator('#detail[open]').waitFor();await page.locator('#close-detail').click();
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert.equal(await page.locator('#scenario').inputValue(),'生活');
  assert.deepEqual(errors,[]);
  row.journeys='known-task, no-results-recovery, shared-case-reload';
  report.push(row);await browser.close();
 }
 if(!observe){
  for(const engine of [chromium,webkit]){
  const browser=await engine.launch(),page=await browser.newPage({viewport:{width:390,height:844}});
  let release;const gate=new Promise(resolve=>release=resolve);
  await page.route('**/catalog.json',async route=>{await gate;await route.continue();});
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  // AT-style click has no preceding pointerdown/keydown to cancel late arrival.
  await page.locator('.discovery-hero [data-search-entry]').evaluate(el=>el.click());
  await page.locator('#query').evaluate(el=>{el.value='旅遊';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.locator('#query').evaluate(el=>document.activeElement===el),true);
  release();await page.locator('#results .card').first().waitFor();
  const loadedRect=await page.locator('#query').boundingBox();
  assert(loadedRect.y>=0&&loadedRect.y+loadedRect.height<=844,'input remains visible after loading in '+engine.name());
  assert.equal(await page.locator('#query').inputValue(),'旅遊');
  assert.equal(await page.locator('#query').evaluate(el=>document.activeElement===el),true);
  assert.equal(new URL(page.url()).hash,'#explore');
  await page.unroute('**/catalog.json');
  await page.route('**/catalog.json',route=>route.fulfill({status:503,body:'unavailable'}));
  await page.reload({waitUntil:'networkidle'});await page.locator('#error').waitFor({state:'visible'});
  await page.locator('.discovery-hero [data-search-entry]').click();
  assert.equal(await page.locator('#query').evaluate(el=>document.activeElement===el),true);
  await page.unroute('**/catalog.json');await page.locator('#retry').click();
  await page.locator('#results .card').first().waitFor();
  await browser.close();
  }
 }
 fs.writeFileSync('qa-artifacts/entry-'+(observe?'baseline':'verification')+'.json',JSON.stringify(report,null,2));
 console.log('ENTRY_REPORT '+JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;setTimeout(()=>process.exit(1),1000).unref();});
