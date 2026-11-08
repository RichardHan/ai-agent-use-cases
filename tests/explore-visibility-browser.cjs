'use strict';
// A reader who types a question must see an answer: the first matching card has
// to land in the same viewport as the search field, at ordinary laptop sizes and
// on a phone. Before this check existed, the expanded facet panel sat between the
// field and the cards, so 0 of 24 rendered cards were on screen at 1440x900.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.env.EXPLORE_URL||process.env.SITE_URL||'http://127.0.0.1:8081/ai-agent-use-cases/';
(async()=>{
 const browser=await chromium.launch(),rows=[];
 for(const [name,width,height] of [['laptop',1440,900],['small-laptop',1280,800],['tall',1440,2600],['phone',390,844]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage();
  const ready=async()=>{await page.locator('#results-count').filter({hasText:'顯示'}).waitFor({timeout:60000});};
  await page.goto(base,{waitUntil:'load'});await ready();
  const landing=await page.evaluate(()=>({panelOpen:document.querySelector('#filter-options').open,firstCardTop:Math.round(document.querySelector('#results .card').getBoundingClientRect().top+scrollY),resultLineTop:Math.round(document.querySelector('#results-count').getBoundingClientRect().top+scrollY),height:innerHeight}));
  await page.locator('.hero-search-link').click();
  await page.locator('#query').fill('會議');
  await page.waitForFunction(()=>document.querySelector('#filter-outcome-count').textContent.includes('筆結果'));
  const typed=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('#results .card')];
    const first=cards[0]?.getBoundingClientRect();
    return {focus:document.activeElement.id,queryTop:Math.round(document.querySelector('#query').getBoundingClientRect().top),firstCardTop:first?Math.round(first.top):null,visibleCards:cards.filter(card=>card.getBoundingClientRect().top<innerHeight&&card.getBoundingClientRect().bottom>0).length,total:cards.length,count:document.querySelector('#results-count').textContent.trim(),outcome:document.querySelector('#filter-outcome-count').textContent.trim()};
  });
  rows.push({name,width,height,landing,typed});
  // An open facet panel must never be the reason the result line is off screen.
  if(landing.panelOpen)assert.ok(landing.resultLineTop<height,`${name}: the open facet panel hides the result line at ${landing.resultLineTop}px`);
  if(typed.total>0)assert.ok(typed.firstCardTop<height,`${name}: first matching card is off screen at ${typed.firstCardTop}px (viewport ${height}px) after typing a question`);
  assert.ok(typed.visibleCards>=1,`${name}: no result card is visible together with the search field`);
  assert.equal(typed.focus,'query',`${name}: typing must keep focus in the search field`);
  // The facet controls stay one click away and still open from the same summary.
  if(!(await page.locator('#filter-options').evaluate(n=>n.open)))await page.locator('#filter-summary').click();
  await page.waitForFunction(()=>document.querySelector('#filter-options').open);
  const opened=await page.evaluate(()=>({panelOpen:document.querySelector('#filter-options').open,facets:[...document.querySelectorAll('#filters select')].length}));
  assert.ok(opened.facets>=5,`${name}: opening the summary must reveal the facet controls`);
  await context.close();
 }
 console.log('EXPLORE_VISIBILITY '+JSON.stringify(rows));
 await browser.close();
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
