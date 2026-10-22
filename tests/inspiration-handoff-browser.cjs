'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8136/ai-agent-use-cases/';
const out=process.env.QA_OUT||'qa-artifacts/after';fs.mkdirSync(out,{recursive:true});
(async()=>{
const report=[];
for(const [engine,width] of [[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
 const label=engine.name()+'-'+width,row={label,errors:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
 const panel=()=>page.locator('#filter-options').evaluate(n=>n.open=true);
 const ready=async suffix=>{await page.goto(base+(suffix||''));await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.evaluate(()=>failedPaths.length),0);};
 const cardTitle=()=>page.locator('#drawn-case h3 button');
 const handoff=async()=>{assert(await cardTitle().evaluate(n=>n===document.activeElement));const r=await cardTitle().boundingBox();assert(r.y>=0&&r.y+r.height<=900,'drawn title must be visible');return {focus:await cardTitle().innerText(),rect:r};};
 const shot=name=>page.screenshot({path:`${out}/${name}-${label}.png`});
 await ready();row.total=await page.evaluate(()=>entries.length);await shot('home');
 // 1. A new visitor chooses a scenario, reads the card, and returns exactly to it.
 await page.locator('#guide-options [data-scenario="工作"]').focus();await page.keyboard.press('Enter');row.guide=await handoff();await shot('guide');
 await page.keyboard.press('Tab');assert(await page.locator('#drawn-case .tag-scenario').evaluate(n=>n===document.activeElement));
 await cardTitle().focus();const id=await cardTitle().evaluate(n=>n.closest('.card').dataset.caseId);await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();row.readID=id;await shot('detail');
 await page.keyboard.press('Escape');assert(await cardTitle().evaluate(n=>n===document.activeElement));assert.equal(await cardTitle().evaluate(n=>n.closest('.card').dataset.caseId),id);
 // Explicit drawing hands off after rendering; automatic filter updates leave input alone.
 await page.locator('#draw-case').focus();await page.keyboard.press('Space');row.draw=await handoff();await shot('draw');
 await page.locator('#query').fill('旅遊');assert(await page.locator('#query').evaluate(n=>n===document.activeElement));
 await panel();await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');await page.locator('#search-submit').click();
 row.filtered=await page.locator('#results-count').innerText();assert(await page.locator('#results .card').count()>0);
 // 2. Search, combined filters, sources, exact return and a refreshed direct link.
 const read=page.locator('#results .card .card-bottom button').first(),resultID=await read.evaluate(n=>n.closest('.card').dataset.caseId);await read.click();await page.locator('#detail[open]').waitFor();const direct=page.url();
 await page.locator('.reader-report-open').filter({hasText:'來源與版本'}).click();const source=page.locator('.markdown a[href^="https:"]').first();row.source=(await source.getAttribute('href')).split('?')[0];
 if(label==='chromium-1440'){const pending=page.waitForEvent('popup');await source.click();const popup=await pending;const response=await popup.waitForLoadState('domcontentloaded',{timeout:15000}).catch(()=>{});row.sourceOpened=popup.url().split('?')[0];await popup.close();}
 await page.keyboard.press('Escape');assert(await read.evaluate(n=>n===document.activeElement));
 await ready(direct.slice(base.length));await page.locator('#detail[open]').waitFor();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});await page.locator('#detail[open]').waitFor();await page.keyboard.press('Escape');
 assert.equal(await page.locator('#scenario').inputValue(),'生活');assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
 // 3. Empty results and an empty draw collection explain themselves and recover.
 await panel();await page.locator('#kind').selectOption('pending');await page.locator('#query').fill('no-match-inspiration-round');await page.locator('#search-submit').click();assert(await page.locator('#empty').isVisible());await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(n=>n===document.activeElement));await shot('empty');
 await page.evaluate(()=>revealDiscovery());assert(await page.locator('#draw-status').evaluate(n=>n===document.activeElement));assert(await page.locator('#draw-case').isDisabled());await shot('empty-deck');
 await page.locator('#empty-reset').click();assert(await page.locator('#results .card').count()>0);
 // Long title preserves an actionable focus target and wraps on narrow screens.
 await page.evaluate(()=>{const item={...entries.find(e=>e.kind==='case'),title:'長標題與來源限定，'.repeat(16)};discoveryDeck=Discovery.createDeck([item]);drawNext();});await page.locator('#draw-case').scrollIntoViewIfNeeded();await page.evaluate(()=>revealDiscovery());
 assert(await cardTitle().evaluate(n=>n===document.activeElement));const long=await cardTitle().boundingBox();row.longTitle=long;fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await shot('long-title');assert(long.y>=0&&(long.height<=900-48?long.y+long.height<=900:long.y+80<=900),'title must fit when possible; otherwise its beginning must be readable');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.evaluate(()=>{const item={...entries.find(e=>e.kind==='case'),title:'超過一屏仍保留來源限定，'.repeat(64)};discoveryDeck=Discovery.createDeck([item]);drawNext();revealDiscovery();});
 const oversized=await cardTitle().boundingBox();row.oversizedTitle=oversized;await shot('oversized-title');assert(oversized.height>900);assert(oversized.y>=0&&oversized.y+80<=900);assert(await cardTitle().evaluate(n=>n===document.activeElement));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 row.axe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id);assert.deepEqual(row.axe,[]);assert.deepEqual(row.errors,[]);
 row.timing=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd};});
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await context.close();await browser.close();
}
// Loading, error and partial recovery must not invoke an automatic card handoff.
const browser=await chromium.launch(),lifecycle=[];
for(const mode of ['loading','error','partial','empty']){
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();let release;const gate=new Promise(r=>release=r);
 if(mode==='loading')await page.route('**/catalog.json',async route=>{await gate;await route.continue();});
 if(mode==='error')await page.route('**/catalog.json',route=>route.abort());
 if(mode==='partial')await page.route('**/cases/001-travel-checkout.md',route=>route.abort());
 if(mode==='empty')await page.route('**/catalog.json',route=>route.fulfill({json:{files:['cases/005-cloud-pr-review.md']}}));
 await page.goto(base);if(mode==='empty'){await page.waitForFunction(()=>discoveryReady);await page.locator('#guide-options [data-scenario="生活"]').click();assert(await page.locator('#draw-status').evaluate(n=>n===document.activeElement));assert(await page.locator('#draw-case').isDisabled());await page.screenshot({path:out+'/empty-guide.png'});lifecycle.push({mode,passed:true,focus:'draw-status'});await context.close();continue;}if(mode==='error')await page.locator('#error').waitFor({state:'visible'});if(mode==='partial')await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
 await page.locator('#query').click();await page.locator('#query').fill('旅遊');const before=await page.evaluate(()=>document.activeElement.id);await page.evaluate(()=>revealDiscovery());
 if(mode!=='partial')assert(await page.locator('#query').evaluate(n=>n===document.activeElement));
 if(mode==='loading'){release();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert(await page.locator('#query').evaluate(n=>n===document.activeElement));}
 if(mode==='error'){await page.unroute('**/catalog.json');await page.locator('#retry').click();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');}
 if(mode==='partial'){await page.unroute('**/cases/001-travel-checkout.md');await page.locator('#retry-failed').click();await page.waitForFunction(()=>!recoveringSources&&failedPaths.length===0,null,{timeout:120000});assert.equal(await page.evaluate(()=>document.activeElement.id),'results-count');}
 lifecycle.push({mode,passed:true,before,after:await page.evaluate(()=>document.activeElement.id)});fs.writeFileSync(out+'/lifecycle.json',JSON.stringify(lifecycle,null,2));await context.close();
}
fs.writeFileSync(out+'/lifecycle.json',JSON.stringify(lifecycle,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
