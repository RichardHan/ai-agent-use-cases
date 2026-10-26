'use strict';
const sourceRoute=require('./source-route.cjs');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.JOURNEY_URL||'http://127.0.0.1:8170/ai-agent-use-cases/';
const out=process.env.JOURNEY_OUTPUT||'qa-artifacts/after';fs.mkdirSync(out,{recursive:true});
const report={base,checks:[]};const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
async function loaded(page){await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});assert.deepEqual(await page.evaluate(()=>failedPaths),[],'all catalog sources must be loaded');}
async function visible(page,selector){const a=await page.locator(selector).boundingBox(),b=await page.locator('.detail-toolbar').boundingBox(),d=await page.locator('#detail').boundingBox();assert(a.y>=b.y+b.height-1,'destination below toolbar');assert(a.y+a.height<=d.y+d.height+1,'destination fits dialog');}
async function audit(page,row,state){const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({state,violations:r.violations.map(v=>v.id)});save();assert.equal(r.violations.length,0,JSON.stringify(r.violations));}
async function controls(page,row){
 await page.locator('.reader-outline').evaluate(e=>e.open=true);
 row.controls=await page.locator('.reader-return,.reader-outline>summary,.reader-outline-jump').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {class:e.className,tag:e.tagName,text:e.textContent,height:r.height,width:r.width,font:parseFloat(s.fontSize),overflow:e.scrollWidth>e.clientWidth+1};}));save();
 await page.locator('.reader-outline>summary').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/outline-controls-${row.engine}-${row.width}.png`});
 for(const c of row.controls){assert(c.height>=44,`${c.class||c.tag} height ${c.height} is below 44px`);assert(c.width>=44);assert(c.font>=14);assert(!c.overflow,'full text must wrap');}
 assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 row.overlaps=await page.locator('.reader-return').evaluateAll(nodes=>nodes.flatMap(e=>{const p=e.previousElementSibling.getBoundingClientRect(),r=e.getBoundingClientRect(),n=e.nextElementSibling?.getBoundingClientRect();return p.bottom>r.top+.5||(n&&r.bottom>n.top+.5)?[e.previousElementSibling.textContent]:[];}));save();assert.deepEqual(row.overlaps,[]);
}
async function jumpAndReturn(page,button){
 const before=await page.evaluate(()=>({url:location.href,length:history.length,scroll:scrollY}));const id=await button.getAttribute('aria-controls');
 await button.focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),id);await visible(page,'#'+id);
 await page.keyboard.press('Tab');assert(await page.locator('#'+id+' + .reader-return').evaluate(e=>e===document.activeElement));await visible(page,'#'+id+' + .reader-return');
 assert(await page.locator('#'+id+' + .reader-return').evaluate(e=>{const s=getComputedStyle(e);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2;}));
 await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-nav-title');await visible(page,'#reader-nav-title');assert.deepEqual(await page.evaluate(()=>({url:location.href,length:history.length,scroll:scrollY})),before);
}
(async()=>{for(const [engine,launcher] of (process.env.JOURNEY_CHECK_ONLY||process.env.JOURNEY_LIVE?[['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]])){
 const browser=await launcher.launch();try{for(const width of (engine==='chromium'&&!process.env.JOURNEY_CHECK_ONLY?(process.env.JOURNEY_LIVE?[1440,390]:[1440,390,320]):[390])){
 const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);
 const row={engine,width,audits:[],errors:[],journeys:[]};report.checks.push(row);page.on('pageerror',e=>row.errors.push(e.message));save();
 // Practical search -> method -> limits -> source -> native Back.
 const start=Date.now();await page.goto(base+'?q=旅遊&scenario=生活');await loaded(page);row.entries=await page.evaluate(()=>entries.length);await page.locator('#results .card[data-case-id="UC-001"] .card-bottom button').click();await page.locator('#detail[open]').waitFor();row.readyMs=Date.now()-start;
 await page.locator('.reader-method-shortcut').click();await page.screenshot({path:`${out}/method-${engine}-${width}.png`});
 await controls(page,row);if(process.env.JOURNEY_CHECK_ONLY){await context.close();continue;}
 await page.locator('#'+await page.evaluate(()=>document.activeElement.id)+' + .reader-return').click();
 const summary=page.locator('.reader-outline>summary');await summary.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');assert(await summary.evaluate(e=>e===document.activeElement));await page.keyboard.press('Enter');assert.equal(await page.locator('.reader-outline').evaluate(e=>e.open),false);await page.keyboard.press('Space');assert.equal(await page.locator('.reader-outline').evaluate(e=>e.open),true);await visible(page,'.reader-outline>summary');
 assert(await summary.evaluate(e=>{const s=getComputedStyle(e);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2;}));
 await page.screenshot({path:`${out}/outline-${engine}-${width}.png`});await audit(page,row,'full outline');
 const titles=await page.locator('.research-details .markdown h2,.research-details .markdown h3').allTextContents();assert.deepEqual(await page.locator('.reader-outline-jump').allTextContents(),titles);
 const longIndex=titles.reduce((a,t,i)=>t.length>titles[a].length?i:a,0);
 for(const i of new Set([0,longIndex,titles.length-1]))await jumpAndReturn(page,page.locator('.reader-outline-jump').nth(i));
 for(const label of ['限制與權限','來源與版本']){const btn=page.locator('.reader-jump').filter({hasText:label});if(await btn.count())await jumpAndReturn(page,btn);}
 await audit(page,row,'returned navigation');
 const source=page.locator('.research-details .markdown a').first();row.source=await source.getAttribute('href');assert.match(row.source,/^https:\/\//);assert.match(await source.getAttribute('rel'),/noopener/);
 if(engine==='chromium'&&width===1440){const next=page.waitForEvent('popup');await source.click();const popup=await next;await popup.waitForLoadState('domcontentloaded').catch(()=>{});row.sourceOpened=popup.url();assert.equal(row.sourceOpened,row.source);await popup.close();}
 await page.goBack();assert.equal(await page.locator('#detail').evaluate(e=>e.open),false);assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');row.journeys.push('search, method, limits, source, Back preserve conditions');
 // Shared long note, reload, H3 and empty recovery.
 await page.goto(base+'?q=旅遊&scenario=生活&case=UC-001');await loaded(page);await page.reload();await loaded(page);await page.locator('#detail[open]').waitFor();
 await page.locator('.reader-outline').evaluate(e=>e.open=true);const h3=await page.locator('.research-details .markdown h3').first().getAttribute('id');await jumpAndReturn(page,page.locator('.reader-outline-jump[aria-controls="'+h3+'"]'));
 await page.keyboard.press('Escape');await page.locator('#query').fill('journey-no-match-20261021');assert(await page.locator('#empty').isVisible());await page.locator('#edit-query').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'query');await page.locator('#query').fill('旅遊');assert(await page.locator('#results .card').count()>0);row.journeys.push('direct link, reload, H3, empty results and recovery');
 // Completing other sources must preserve the actual original-section return control.
 if(!process.env.JOURNEY_LIVE){const late=await context.newPage();late.on('pageerror',e=>row.errors.push(e.message));let release;const gate=new Promise(resolve=>release=resolve);
 await sourceRoute(late,'**/cases/001-travel-checkout.md',async route=>{await gate;await route.continue();});
 await late.goto(base+'?case=UC-359');await late.locator('#detail[open]').waitFor();assert.equal(await late.evaluate(()=>discoveryReady),false);
 await late.locator('.reader-method-shortcut').click();await late.keyboard.press('Tab');
 const reading=await late.evaluate(()=>{window.savedReturn=document.activeElement;return {text:savedReturn.textContent,top:savedReturn.getBoundingClientRect().top};});assert.match(reading.text,/回到閱讀導覽/);
 release();await loaded(late);await late.evaluate(()=>new Promise((resolve,reject)=>{const d=document.querySelector('#detail');let previous=d.scrollTop,stable=0,frames=0;function tick(){const top=d.scrollTop;stable=Math.abs(top-previous)<.1?stable+1:0;previous=top;if(stable>=12)return resolve();if(++frames>120)return reject(Error('reading scroll did not settle'));requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
 row.originalReturnDelta=await late.evaluate(top=>Math.abs(savedReturn.getBoundingClientRect().top-top),reading.top);assert(row.originalReturnDelta<=2,'original-section return stays within 2px after source completion');assert(await late.evaluate(()=>savedReturn===document.activeElement));await late.close();save();}
 // A long case with sparse/pending data retains literal headings; no fabricated outline.
 await page.evaluate(()=>{const body=document.createElement('div');body.id='fixture';body.innerHTML='<div class="plain-overview"></div><p class="detail-warning">待查</p><details class="research-details"><summary>原始研究</summary><div class="markdown"><p>尚無標準段落</p></div></details>';document.querySelector('#detail-body').replaceChildren(...body.childNodes);CaseReader.enhance(document.querySelector('#detail-body'),{kind:'pending'});});
 assert.equal(await page.locator('.reader-outline').count(),0);assert.equal(await page.locator('.reader-return').count(),0);row.journeys.push('no headings: no invented outline');assert.deepEqual(row.errors,[]);save();await context.close();
 }}finally{await browser.close();}}})().catch(e=>{report.failure=e.stack;save();console.error(e);process.exitCode=1});
