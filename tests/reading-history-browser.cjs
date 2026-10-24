'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8190/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/history',observe=process.env.QA_OBSERVE==='1';
fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];
for(const [engine,width] of (observe?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const b=await engine.launch(),context=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await context.newPage(),row={label:engine.name()+'-'+width,errors:[]};rows.push(row);p.on('pageerror',e=>row.errors.push(e.message));
 try{
 await p.goto(base+'?case=UC-005');await p.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.deepEqual(await p.evaluate(()=>failedPaths),[]);
 await p.locator('.reader-outline>summary').click();await p.locator('#reader-outline-query').fill('獨立審查');await p.locator('#reader-outline-query').press('Enter');
 const state=()=>p.evaluate(()=>({id:currentDetailItem.id,top:document.querySelector('#detail').scrollTop,open:document.querySelector('.research-details').open,query:document.querySelector('#reader-outline-query').value,focus:document.activeElement.id,anchor:document.querySelector('#reader-section-32').getBoundingClientRect().top,overflow:document.documentElement.scrollWidth>innerWidth}));
 row.before=await state();assert(row.before.open&&row.before.top>500);await p.screenshot({path:`${out}/reading-${row.label}.png`});
 await p.locator('#nav-next-case').click();
 row.nextID=await p.locator('#detail-toolbar-id').innerText();
 if(!observe){assert.equal(await p.locator('#detail').evaluate(n=>n.scrollTop),0);await p.locator('.reader-jump').first().click();row.nextTop=await p.locator('#detail').evaluate(n=>n.scrollTop);}
 await p.goBack();await p.waitForFunction(()=>currentDetailItem.id==='UC-005');row.returned=await state();await p.screenshot({path:`${out}/returned-${row.label}.png`});
 if(!observe){assert(row.returned.open,'History must restore expanded original research');assert.equal(row.returned.query,row.before.query);assert(Math.abs(row.returned.anchor-row.before.anchor)<3,'History must restore reading anchor');assert.equal(row.returned.overflow,false);row.violations=(await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(row.violations,[]);
 // History visits are distinct: a newly opened copy of A starts at its top.
 await p.goForward();await p.waitForFunction(id=>currentDetailItem.id===id,row.nextID);
 assert(Math.abs(await p.locator('#detail').evaluate(n=>n.scrollTop)-row.nextTop)<3);
 await p.locator('#nav-prev-case').click();assert.equal(await p.locator('#detail-toolbar-id').innerText(),'UC-005');assert.equal(await p.locator('#detail').evaluate(n=>n.scrollTop),0);assert.equal(await p.locator('.research-details').evaluate(n=>n.open),false);
 await p.goBack();await p.waitForFunction(id=>currentDetailItem.id===id,row.nextID);await p.goBack();await p.waitForFunction(()=>currentDetailItem.id==='UC-005');
 assert(Math.abs((await state()).anchor-row.before.anchor)<3,'Each history entry keeps its own reading location');
 // A reload is a fresh reading session, not persisted browsing history.
 await p.reload();await p.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.deepEqual(await p.evaluate(()=>failedPaths),[]);assert.equal(await p.locator('#detail').evaluate(n=>n.scrollTop),0);assert.equal(await p.locator('.research-details').evaluate(n=>n.open),false);
 // A search visitor can Back to results and Forward to the original passage.
 await p.goto(base+'?q=旅遊&scenario=生活&tool=Grok+Bot');await p.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.deepEqual(await p.evaluate(()=>failedPaths),[]);
 const read=p.locator('#results .card[data-case-id="UC-001"] .card-bottom button');await read.click();await p.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();
 const sourceTop=await p.locator('#detail').evaluate(n=>n.scrollTop);await p.goBack();await p.waitForFunction(()=>!document.querySelector('#detail').open);assert(await read.evaluate(n=>n===document.activeElement));assert.equal(await p.locator('#query').inputValue(),'旅遊');
 await p.goForward();await p.locator('#detail[open]').waitFor();assert(await p.locator('.research-details').evaluate(n=>n.open));assert(Math.abs(await p.locator('#detail').evaluate(n=>n.scrollTop)-sourceTop)<3);await p.keyboard.press('Escape');assert(await read.evaluate(n=>n===document.activeElement));
 // Touch/wheel-style reading keeps a distant title focused; a table keeps its right-side columns.
 await p.goto(base+'?case=UC-400');await p.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.deepEqual(await p.evaluate(()=>failedPaths),[]);await p.locator('.research-details>summary').click();
 const table=p.locator('.markdown-table').first();await table.evaluate(n=>{const d=document.querySelector('#detail');d.scrollTop+=n.getBoundingClientRect().top-document.querySelector('.detail-toolbar').getBoundingClientRect().bottom-18;n.scrollLeft=160;});
 await p.locator('#detail-title').focus({preventScroll:true});
 const tableState=()=>table.evaluate(n=>({top:n.getBoundingClientRect().top,left:n.scrollLeft}));row.tableBefore=await tableState();
 await p.keyboard.press('ArrowRight');assert.notEqual(await p.locator('#detail-toolbar-id').innerText(),'UC-400');await p.goBack();await p.waitForFunction(()=>currentDetailItem.id==='UC-400');row.tableReturned=await tableState();
 assert(Math.abs(row.tableReturned.top-row.tableBefore.top)<3);assert.equal(row.tableReturned.left,row.tableBefore.left);
 row.returnedFocus=await p.evaluate(()=>{const r=document.activeElement.getBoundingClientRect(),d=document.querySelector('#detail').getBoundingClientRect();return {tag:document.activeElement.tagName,top:r.top,bottom:r.bottom,visible:r.bottom>d.top&&r.top<d.bottom};});assert(row.returnedFocus.visible,'Return focus stays in the visible reading area');
 await p.screenshot({path:`${out}/table-returned-${row.label}.png`});
 row.tableViolations=(await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(row.tableViolations,[]);
 row.scenarios=['long reading Back and Forward','distinct visits and reload','filtered results Back and Forward','offscreen focus and horizontal table'];
 }
 assert.deepEqual(row.errors,[]);
 }catch(e){row.failure=e.stack;throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));await b.close();}
}
})().catch(e=>{console.error(e);process.exit(1)});
