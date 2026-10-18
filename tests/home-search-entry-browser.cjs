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
 console.log('VISUAL:'+name+':'+fs.readFileSync(path).toString('base64'));
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
  await page.goBack();await page.waitForFunction(()=>!document.getElementById('detail').open);
  assert.equal(await page.evaluate(()=>document.activeElement.closest('.card')?.dataset.caseId),id);
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
