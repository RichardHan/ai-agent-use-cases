'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL,out=process.env.QA_OUT||'qa-artifacts/bundle';fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));
const publicRun=process.env.QA_PUBLIC==='1',legacy=process.env.QA_LEGACY==='1';
for(const [engine,width] of publicRun||legacy?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]]){
 const b=await engine.launch(),context=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await context.newPage(),r={engine:engine.name(),width,requests:[],errors:[]};rows.push(r);p.on('pageerror',e=>r.errors.push(e.message));
 p.on('request',req=>{if(/\.(md|json)(\?|$)/.test(req.url()))r.requests.push(new URL(req.url()).pathname);});
 try{
 if(legacy)await p.route('**/catalog.json',async route=>{const response=await route.fetch(),catalog=await response.json();delete catalog.bundleRevision;await route.fulfill({response,json:catalog});});
 const start=Date.now();await p.goto(base);await p.waitForFunction(()=>discoveryReady,null,{timeout:60000});r.readyMs=Date.now()-start;r.corpus=await p.evaluate(()=>({total:entries.length,failed:failedPaths}));assert.deepEqual(r.corpus.failed,[]);assert(r.corpus.total>400);
 r.sourceRequests=r.requests.filter(s=>s.endsWith('.md'));if(!legacy)assert.equal(r.sourceRequests.length,0);assert.equal(r.requests.filter(s=>s.endsWith('/corpus.json')).length,legacy?0:1);
 await p.screenshot({path:`${out}/home-${engine.name()}-${width}.png`});
 // Verify every parsed entry against the old loader on the same original corpus.
 const fidelity=await p.evaluate(async()=>{const c=await(await fetch('catalog.json')).json(),bundle=await(await fetch('corpus.json')).json();const original=bundle.sources.flatMap(s=>parseFile(s.path,s.markdown));const normalize=xs=>JSON.stringify(xs.map(e=>[e.path,e.id,e.markdown,e.title,e.purpose,e.scenario,e.tools,e.proof]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));return {same:normalize(entries)===normalize(original),files:c.files.length,bytes:new TextEncoder().encode(JSON.stringify(bundle)).length};});assert(fidelity.same);r.fidelity=fidelity;if(legacy)assert.equal(r.sourceRequests.length,fidelity.files);
 await p.locator('.hero-search-link').click();await p.locator('#query').fill('旅遊');await p.locator('#filter-options').evaluate(n=>n.open=true);await p.locator('#scenario').selectOption('生活');await p.locator('#tool').selectOption('Grok Bot');await p.locator('#search-submit').click();r.results=await p.locator('#results-count').innerText();await p.screenshot({path:`${out}/results-${engine.name()}-${width}.png`});
 const read=p.locator('#results .card[data-case-id="UC-001"] .card-bottom button');await read.focus();await p.keyboard.press('Enter');await p.locator('#detail[open]').waitFor();await p.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();await p.screenshot({path:`${out}/reader-${engine.name()}-${width}.png`});
 r.axeReader=(await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(r.axeReader,[]);await p.keyboard.press('Escape');assert(await read.evaluate(n=>n===document.activeElement));assert.equal(await p.locator('#query').inputValue(),'旅遊');
 await p.locator('#query').fill('no_bundle_qa_result_728');await p.locator('#empty').waitFor({state:'visible'});await p.locator('#edit-query').click();assert(await p.locator('#query').evaluate(n=>n===document.activeElement));r.axeEmpty=(await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(r.axeEmpty,[]);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(r.errors,[]);
 }finally{save();await b.close();}
}
if(!publicRun&&!legacy){
 const b=await chromium.launch();
 for(const mode of ['bundle-http','bundle-invalid','bundle-stall','shared-early','shared-cancel','bundle-wins']){
  const context=await b.newContext({viewport:{width:390,height:900}}),p=await context.newPage(),r={mode,errors:[]};rows.push(r);let release;const gate=new Promise(resolve=>release=resolve);p.on('pageerror',e=>r.errors.push(e.message));
  try{
   if(mode==='bundle-http')await p.route('**/corpus.json',route=>route.fulfill({status:404,body:'missing bundle'}));
   if(mode==='bundle-invalid')await p.route('**/corpus.json',route=>route.fulfill({json:{version:1,revision:'old',sources:[]}}));
   if(['bundle-stall','shared-early','shared-cancel'].includes(mode))await p.route('**/corpus.json',async route=>{await gate;await route.continue().catch(()=>{});});
   if(mode==='bundle-wins')await p.route('**/cases/001-travel-checkout.md',async route=>{await gate;await route.continue().catch(()=>{});});
   if(mode==='shared-cancel')await p.route('**/*.md',async route=>{if(!route.request().url().endsWith('/001-travel-checkout.md'))await gate;await route.continue().catch(()=>{});});
   const start=Date.now();await p.goto(base+(mode.startsWith('shared')||mode==='bundle-wins'?'?case=UC-001&q=旅遊&scenario=生活':''));
   if(mode.startsWith('shared')){
    await p.locator('#detail[open]').waitFor();r.early=!await p.evaluate(()=>discoveryReady);assert(r.early);await p.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();const original=await p.locator('.research-details').elementHandle();await p.locator('.research-details summary').focus();
    if(mode==='shared-cancel'){await p.keyboard.press('Escape');await p.locator('#use-loaded').click();await p.waitForFunction(()=>discoveryReady);assert(await p.locator('#partial-load').isVisible());r.partial=await p.evaluate(()=>({count:entries.length,failed:failedPaths.length}));assert.equal(r.partial.count,1);assert(r.partial.failed>400);release();await p.locator('#retry-failed').click();await p.waitForFunction(()=>!recoveringSources&&failedPaths.length===0,null,{timeout:60000});}
    else {release();await p.waitForFunction(()=>discoveryReady);assert(await original.evaluate(n=>n.isConnected));assert(await p.locator('.research-details summary').evaluate(n=>n===document.activeElement));await p.keyboard.press('Escape');}
   }
   else await p.waitForFunction(()=>discoveryReady,null,{timeout:60000});
   r.readyMs=Date.now()-start;r.corpus=await p.evaluate(()=>({total:entries.length,failed:failedPaths}));assert.deepEqual(r.corpus.failed,[]);assert(r.corpus.total>400);r.axe=(await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(r.axe,[]);assert.deepEqual(r.errors,[]);
   await p.screenshot({path:`${out}/${mode}-390.png`});
  }finally{release();save();await context.close();}
 }
 await b.close();
}
})().catch(e=>{console.error(e);process.exit(1)});
