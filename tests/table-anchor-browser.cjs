'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SITE_URL||'http://127.0.0.1:8100/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/table-anchor';
fs.mkdirSync(out,{recursive:true});const report=[];
const save=()=>fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));
async function settle(page){await page.evaluate(()=>new Promise((resolve,reject)=>{let prev=document.querySelector('#detail').scrollTop,stable=0,frames=0;function tick(){const top=document.querySelector('#detail').scrollTop;stable=Math.abs(top-prev)<.1?stable+1:0;prev=top;if(stable>=12)return resolve();if(++frames>120)return reject(Error('scroll did not settle'));requestAnimationFrame(tick);}requestAnimationFrame(tick);}));}
(async()=>{
 for(const [engine,launcher] of [['chromium',chromium],['firefox',firefox],['webkit',webkit]]){
 const browser=await launcher.launch();try{
 for(const [size,width,height] of (engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['narrow',320,740],['short',390,480]]:[['mobile',390,844],['short',390,480]])){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);
 let release;const gate=new Promise(r=>release=r);await page.route('**/cases/001-travel-checkout.md',async route=>{await gate;await route.continue();});
 const check={engine,size};report.push(check);save();
 await page.goto(base+'?case=UC-400');await page.locator('#detail[open]').waitFor();
 assert.equal(await page.evaluate(()=>discoveryReady),false);
 await page.locator('.research-details summary').click();await page.locator('.markdown-table').evaluate(n=>n.scrollLeft=n.scrollWidth);await page.locator('#detail-title').evaluate(n=>n.focus({preventScroll:true}));
 const target=page.locator('.markdown-table tbody tr').nth(0),toolbar=await page.locator('.detail-toolbar').boundingBox();
 await target.evaluate(n=>{const d=document.querySelector('#detail');d.scrollTop+=n.getBoundingClientRect().top-d.querySelector('.detail-toolbar').getBoundingClientRect().bottom-30;});await settle(page);
 check.before=await page.evaluate(()=>{const d=document.querySelector('#detail'),edge=d.querySelector('.detail-toolbar').getBoundingClientRect().bottom;
 const candidates=[...d.querySelectorAll('#detail-body h2,#detail-body p,#detail-body li,#detail-body pre,#detail-body summary')].filter(n=>!n.classList.contains('detail-load-status')&&n.getBoundingClientRect().height>0&&n.getBoundingClientRect().bottom>edge&&n.getBoundingClientRect().top<d.getBoundingClientRect().bottom);
 return {scroll:d.scrollTop,left:document.querySelector('.markdown-table').scrollLeft,focus:document.activeElement.id,corpus:{count:entries.length,failed:[...failedPaths]},statusHeight:document.querySelector('.detail-load-status').getBoundingClientRect().height,targetTop:document.querySelector('.markdown-table tbody tr:nth-child(1)').getBoundingClientRect().top,anchors:candidates.slice(0,5).map(n=>({tag:n.tagName,class:n.className,text:n.textContent.slice(0,80),top:n.getBoundingClientRect().top,bottom:n.getBoundingClientRect().bottom}))};});
 assert(check.before.statusHeight>0,'early reader exposes background-loading status');assert.equal(check.before.focus,'detail-title');assert(check.before.targetTop>toolbar.y+toolbar.height-1&&check.before.targetTop<height);
 await page.screenshot({path:`${out}/${engine}-${size}-before.jpg`});
 await page.evaluate(()=>{window.anchorTrace=[];let frames=0;function tick(){const d=document.querySelector('#detail');anchorTrace.push({time:performance.now(),scroll:d.scrollTop,top:document.querySelector('.markdown-table tbody tr:nth-child(1)').getBoundingClientRect().top,ready:discoveryReady});if(++frames<50)requestAnimationFrame(tick);}requestAnimationFrame(tick);});
 release();await page.waitForFunction(()=>discoveryReady);await settle(page);
 check.after=await page.evaluate(()=>({scroll:document.querySelector('#detail').scrollTop,left:document.querySelector('.markdown-table').scrollLeft,focus:document.activeElement.id,corpus:{count:entries.length,failed:[...failedPaths]},statusHeight:document.querySelector('.detail-load-status').getBoundingClientRect().height,targetTop:document.querySelector('.markdown-table tbody tr:nth-child(1)').getBoundingClientRect().top}));
 check.delta=check.after.targetTop-check.before.targetTop;check.trace=await page.evaluate(()=>anchorTrace);
 await page.screenshot({path:`${out}/${engine}-${size}-after.jpg`});
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();check.violations=audit.violations.map(v=>v.id);check.errors=errors;save();
 {assert.deepEqual(check.after.corpus.failed,[],'all background sources actually completed');assert.equal(check.after.statusHeight,0,'completion removed the loading status');assert(Math.abs(check.delta)<=2,'table reading position remains within 2px');assert.equal(check.after.focus,check.before.focus);assert.equal(check.after.left,check.before.left,'background completion preserves horizontal reading position');if(size==='short')assert.equal(check.before.anchors.length,0,'short viewport isolates table-only reading');assert.deepEqual(errors,[]);assert.deepEqual(check.violations,[]);assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+1));}
 await context.close();
 }
 }finally{await browser.close();}
 }
 save();console.log(JSON.stringify(report.map(({trace,...r})=>r),null,2));
})().catch(e=>{save();console.error(e);process.exitCode=1;});
