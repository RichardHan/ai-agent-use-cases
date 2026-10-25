'use strict';
const sourceRoute=require('./source-route.cjs');
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.FACETS_URL||'http://127.0.0.1:8136/ai-agent-use-cases/';
const out=process.env.FACETS_OUTPUT||'qa-artifacts/available-facets';
const observe=process.env.FACETS_OBSERVE==='1',live=process.env.FACETS_LIVE==='1';
const reports=[];fs.mkdirSync(out,{recursive:true});
const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(reports,null,2));
(async()=>{
 for(const [engine,width] of observe||live?[[chromium,1440],[chromium,390],[chromium,320]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
  const row={engine:engine.name(),width,errors:[],audits:[]};reports.push(row);page.on('pageerror',e=>row.errors.push(e.message));
  const ready=()=>page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
  const open=()=>require('./filter-controls.cjs').ensureFiltersVisible(page);
  const ids=()=>page.evaluate(()=>currentFiltered.map(e=>e.id));
  const inspect=()=>page.evaluate(()=>Object.fromEntries(['tool','category'].map(key=>[key,{
   selected:$(key).value,groups:[...$(key).querySelectorAll('optgroup')].map(g=>({label:g.label,values:[...g.children].map(o=>o.value)})),
   options:[...$(key).options].map(o=>({value:o.value,label:o.textContent,disabled:o.disabled,group:o.parentElement.tagName==='OPTGROUP'?o.parentElement.label:null}))
  }])));
  const verify=async()=>{
   const actual=await inspect();
   const expected=await page.evaluate(()=>Object.fromEntries(['tool','category'].map(key=>{const filters=Object.fromEntries(['scenario','kind','tool','category','proof'].map(id=>[id,$(id).value]));const values=[...$(key).options].map(o=>o.value);return [key,{values,counts:facetCounts(entries,tokenize($('query').value),filters,key,values)}];})));
   for(const key of ['tool','category']){
    const a=actual[key],e=expected[key];assert.equal(new Set(e.values).size,e.values.length);assert.equal(a.options[0].value,'');assert.equal(a.options[0].group,null);
    const positive=a.options.filter((o,i)=>o.value&&e.counts[i]>0),zero=a.options.filter((o,i)=>o.value&&e.counts[i]===0);
    assert.deepEqual(a.groups.map(g=>g.values),[positive,zero].filter(g=>g.length).map(g=>g.map(o=>o.value)));
    for(const [i,o] of a.options.entries()){assert.equal(o.disabled,false);assert.equal(Number(o.label.split(' · ')[0]),e.counts[i]);}
    for(const g of a.groups)assert.deepEqual(g.values,[...g.values].sort((a,b)=>a.localeCompare(b,'zh-Hant')));
   }
   return actual;
  };
  const audit=async label=>{const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();row.audits.push({label,violations:a.violations.map(v=>v.id)});assert.deepEqual(a.violations,[]);};
  await page.goto(base);await ready();assert.deepEqual(await page.evaluate(()=>failedPaths),[]);await open();
  await page.locator('#query').fill('旅遊');await page.locator('#scenario').selectOption('生活');await page.locator('#category').scrollIntoViewIfNeeded();
  row.beforeOrAfter=await inspect();row.resultCount=(await ids()).length;await page.screenshot({path:`${out}/${observe?'before':'after'}-${engine.name()}-${width}.png`});save();
  if(observe){await page.locator('#category').selectOption({index:1});row.firstChoice={value:await page.locator('#category').inputValue(),results:(await ids()).length};await page.locator('#category').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/first-choice-${engine.name()}-${width}.png`});save();await browser.close();continue;}
  const all=await page.locator('#category option').evaluateAll(os=>os.map(o=>o.value).sort());row.available=await verify();
  const category=row.available.category.groups[0].values[0];await page.locator('#category').focus();if(process.platform==='linux'){await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');assert.equal(await page.locator('#category').inputValue(),category);assert((await ids()).length>0);row.nativeKeyboard='ArrowDown/Tab selected first available category';}else row.nativeKeyboard='not verified: native popup unavailable in macOS headless; Linux cloud gate required';
  // Select the first available category using the platform-native select.
  await page.locator('#category').selectOption(category);assert((await ids()).length>0);const filtered=await ids();row.firstChoice={value:category,results:filtered.length};await page.locator('#category').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/first-choice-${engine.name()}-${width}.png`});
  assert.equal(await page.locator('#category').inputValue(),category);await page.locator('#kind').selectOption('case');await page.locator('#sort').selectOption('reviewed');
  await verify();await audit('combined filters');
  await page.locator('#results .card h3 button').first().click();await page.locator('#detail[open]').waitFor();const shared=page.url();
  row.source=await page.locator('.detail-source').getAttribute('href');assert.match(row.source,/^https:\/\/github\.com\/RichardHan\/ai-agent-use-cases\/blob\/(?:main|[a-f0-9]{40})\/(?:cases|evidence)\//);if(width===1440)row.sourceStatus=(await page.request.get(row.source)).status();const popupWait=page.waitForEvent('popup');await page.locator('.detail-source').click();const popup=await popupWait;row.openedSource=popup.url();assert.equal(row.openedSource,row.source);await popup.close();
  await page.reload();await page.locator('#detail[open]').waitFor();await ready();await page.locator('#close-detail').click();await open();
  assert.equal(await page.locator('#category').inputValue(),category);assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#sort').inputValue(),'reviewed');await verify();
  await page.locator('#results .card h3 button').first().click();await page.goBack();assert.equal(await page.locator('#detail').evaluate(e=>e.open),false);
  // Zero-result categories stay selectable; changing a query retains the selected value.
  await open();await page.locator('#category').selectOption('');const mixed=await verify();const zero=mixed.category.groups.find(g=>g.label.includes('0 筆')).values[0];
  await page.locator('#category').selectOption(zero);assert(await page.locator('#empty').isVisible());assert.equal(await page.locator('#category').inputValue(),zero);
  await page.locator('#query').fill('完全不存在987 '+ '很長的問題'.repeat(20));const empty=await verify();assert.equal(empty.category.groups.length,1);assert.equal(await page.locator('#category').inputValue(),zero);await audit('empty');
  await page.locator('#empty-reset').click();await open();await verify();assert.equal(await page.locator('#category').inputValue(),'');assert.deepEqual(await page.locator('#category option').evaluateAll(os=>os.map(o=>o.value).sort()),all);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.goto(base+'?category='+encodeURIComponent('未知分類<文字>')+'&tool='+encodeURIComponent('未知工具<文字>'));await ready();await open();assert.equal(await page.locator('#category').inputValue(),'未知分類<文字>');assert.equal(await page.locator('#tool').inputValue(),'未知工具<文字>');await verify();await page.locator('#clear-facets').click();assert.equal(await page.locator('#category').inputValue(),'');assert.equal(await page.locator('#tool').inputValue(),'');assert.deepEqual(row.errors,[]);row.journeys=['task + scenario + native category','combined filters + shared reload + source + Back','zero category + long query + reset'];row.shared=shared;row.initialFiltered=filtered;save();await browser.close();
 }
 if(!observe&&!live){
  const browser=await chromium.launch(),page=await browser.newPage();let release;const gate=new Promise(r=>release=r);
  await page.route('**/catalog.json',async route=>{await gate;await route.continue();});await page.goto(base,{waitUntil:'domcontentloaded'});assert.equal(await page.locator('#category optgroup').count(),0);release();await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
  await sourceRoute(page,'**/cases/001-*',r=>r.fulfill({status:503,body:'unavailable'}));await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});assert(await page.locator('#partial-load').isVisible());
  await require('./filter-controls.cjs').ensureFiltersVisible(page);await page.locator('#category').selectOption({index:1});const selected=await page.locator('#category').inputValue();await page.unroute('**/cases/001-*');await page.locator('#retry-failed').click();await page.waitForFunction(()=>!recoveringSources);assert(await page.locator('#partial-load').isHidden());assert.equal(await page.locator('#category').inputValue(),selected);assert.equal(await page.locator('#category optgroup optgroup').count(),0);
  await page.route('**/catalog.json',r=>r.fulfill({status:503,body:'unavailable'}));await page.goto(base);await page.locator('#error').waitFor();assert.equal(await page.locator('#category optgroup').count(),0);await page.unroute('**/catalog.json');await page.locator('#retry').click();await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});assert((await page.locator('#category optgroup').count())>0);
  reports.push({states:'loading, partial failure, recovery retains selection, total failure, retry',passed:true});save();await browser.close();
 }
})().catch(e=>{console.error(e);save();process.exit(1)});
