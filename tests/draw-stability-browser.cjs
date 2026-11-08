'use strict';
// Typing or filtering changes the drawable pool on every keystroke. Replacing the
// inspiration card then reflows everything above the search field, so on a phone
// the results slide off screen. Keep a card that still matches; redraw only when
// it no longer qualifies.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.env.DRAW_URL||process.env.SITE_URL||'http://127.0.0.1:8081/ai-agent-use-cases/';
(async()=>{
 const browser=await chromium.launch();
 for(const [name,width,height] of [['desktop',1440,900],['phone',390,844]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(base,{waitUntil:'load'});
  await page.locator('#results-count').filter({hasText:'顯示'}).waitFor({timeout:60000});
  await page.waitForFunction(()=>discoveryReady);
  const drawn=await page.evaluate(()=>{
    const node=document.querySelector('#drawn-case .card');
    window.__drawnNode=node;
    return {id:node.dataset.caseId,scenario:node.querySelector('.card-scenario')?.dataset.scenario,difficulty:node.querySelector('.card-difficulty')?.dataset.difficulty};
  });
  assert.ok(drawn.id&&drawn.scenario&&drawn.difficulty,`${name}: the inspiration card must expose its case, scenario and difficulty`);
  if(!(await page.locator('#filter-options').evaluate(n=>n.open)))await page.locator('#filter-summary').click();
  // A filter that still admits the drawn case must not swap it out.
  await page.selectOption('#scenario',drawn.scenario);
  await page.waitForTimeout(300);
  const kept=await page.evaluate(()=>({
    sameNode:document.querySelector('#drawn-case .card')===window.__drawnNode,
    id:document.querySelector('#drawn-case .card').dataset.caseId,
    status:document.querySelector('#draw-status').textContent.trim(),
    total:document.querySelector('#draw-status').textContent.match(/這組條件有 (\d+) 張案例卡/)?.[1]
  }));
  assert.equal(kept.sameNode,true,`${name}: a filter that still matches the drawn case replaced it (${drawn.id} -> ${kept.id})`);
  assert.equal(kept.id,drawn.id,`${name}: the kept card must stay the same case`);
  assert.match(kept.status,/目前顯示/,'The status must say the card is kept, not drawn again');
  assert.ok(Number(kept.total)>0,`${name}: the kept card must report the filtered count`);
  // A filter that excludes it must still redraw.
  const other=drawn.difficulty==='入門對話'?'進階開發':'入門對話';
  await page.selectOption('#difficulty',other);
  await page.waitForTimeout(300);
  const replaced=await page.evaluate(()=>({sameNode:document.querySelector('#drawn-case .card')===window.__drawnNode,id:document.querySelector('#drawn-case .card')?.dataset.caseId||null}));
  assert.equal(replaced.sameNode,false,`${name}: a card outside the filtered pool must be redrawn`);
  assert.notEqual(replaced.id,drawn.id,`${name}: the redrawn card must come from the filtered pool, not the replaced case`);
  await context.close();
 }
 console.log('DRAW_STABILITY ok');
 await browser.close();
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
