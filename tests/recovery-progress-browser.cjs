'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'https://richardhan.github.io/ai-agent-use-cases/',out=process.env.QA_OUT||'qa-artifacts/recovery',before=process.env.QA_BEFORE==='1';
(async()=>{fs.mkdirSync(out,{recursive:true});const rows=[];
for(const [engine,width] of (before?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
 const b=await engine.launch(),p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),r={engine:engine.name(),width,errors:[]};rows.push(r);p.on('pageerror',e=>r.errors.push(e.message));
 let phase='initial',release;const gate=new Promise(resolve=>release=resolve),calls={};const paths=['cases/001-travel-checkout.md','cases/002-daily-brief.md'];
 try{
 const catalog=await (await p.request.get(base+'catalog.json')).json();paths[1]=catalog.files.find(x=>x.startsWith('cases/002-'));assert(paths[1]);
 await p.route('**/*.md',async route=>{const path=paths.find(x=>route.request().url().endsWith('/'+x));if(!path)return route.continue();calls[path]=(calls[path]||0)+1;if(phase==='initial')return route.fulfill({status:404,body:'QA unavailable source'});if(phase==='recovery'&&path===paths[1])await gate;return route.continue().catch(()=>{});});
 await p.goto(base+'?q=旅遊&scenario=生活');await p.waitForFunction(()=>discoveryReady,null,{timeout:30000});r.initial=await p.evaluate(()=>({count:entries.length,failed:[...failedPaths]}));assert.deepEqual([...r.initial.failed].sort(),[...paths].sort());
 phase='recovery';await p.locator('#retry-failed').click();await p.waitForFunction(()=>recoveringSources);await p.waitForFunction(()=>document.querySelector('#partial-message').textContent.includes('正在補讀'));
 if(!before)await p.waitForFunction(()=>document.querySelector('#recovery-progress').value===1);
 else await p.waitForTimeout(800);
 r.waiting=await p.locator('#partial-load').innerText();await p.locator('#partial-load').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/waiting-${engine.name()}-${width}.png`});
 if(before){r.stopAvailable=await p.locator('#stop-recovery').count();assert.equal(r.stopAvailable,0);release();}
 else {assert.match(r.waiting,/已處理 1 \/ 2 個來源，成功讀取 1 個/);await p.locator('#stop-recovery').focus();await p.keyboard.press('Enter');}
 await p.waitForFunction(()=>!recoveringSources);r.after=await p.evaluate(()=>({count:entries.length,failed:[...failedPaths],focus:document.activeElement.id}));
 if(!before){assert.deepEqual(r.after.failed,[paths[1]]);assert.equal(r.after.count,r.initial.count+1);assert.equal(r.after.focus,'retry-failed');assert.match(await p.locator('#load-status').innerText(),/已停止等待/);assert.equal(await p.locator('#query').inputValue(),'旅遊');assert.equal(await p.locator('#scenario').inputValue(),'生活');await p.screenshot({path:`${out}/stopped-${engine.name()}-${width}.png`});release();phase='finish';await p.locator('#retry-failed').click();await p.waitForFunction(()=>!recoveringSources);assert.equal(await p.evaluate(()=>failedPaths.length),0);assert.equal(await p.evaluate(()=>entries.length),r.initial.count+2);assert(await p.locator('#partial-load').isHidden());r.axe=(await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations;assert.deepEqual(r.axe,[]);}
 assert.deepEqual(r.errors,[]);
 }finally{release();fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));await b.close();}
}
})().catch(e=>{console.error(e);process.exit(1)});
