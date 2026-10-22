'use strict';
const {chromium,firefox,webkit}=require('playwright'),{AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const base=process.env.SITE_URL||'http://127.0.0.1:8151/ai-agent-use-cases/',out=process.env.QA_OUT||'qa-artifacts/after',observe=process.env.LIST_OBSERVE==='1';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const report=[];
 for(const [engine,width] of (observe||process.env.LIST_LIVE==='1'?[[chromium,1440],[chromium,390]]:[[chromium,1440],[chromium,390],[chromium,320],[firefox,390],[webkit,390]])){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:width>500?1000:844},reducedMotion:'reduce'}),page=await context.newPage();
  const row={engine:engine.name(),width,errors:[],audits:[]};report.push(row);page.on('pageerror',e=>row.errors.push(e.message));
  await page.goto(base+'?q=旅遊&scenario=生活&case=UC-001');await page.locator('#detail[open]').waitFor();
  await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
  row.timing=await page.evaluate(()=>({domContentLoadedMs:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),elapsedToCorpusMs:Math.round(performance.now())}));
  await page.locator('.research-details summary').click();
  const parent=page.locator('.research-details .markdown li').filter({hasText:/^本庫判讀：這是單一作者/}).first();
  row.childCount=await parent.locator(':scope > ol > li').count();
  row.listCount=await page.locator('.research-details .markdown li').count();
  const originalText=await page.locator('.research-details .markdown').evaluate(node=>{
   const copy=node.cloneNode(true);copy.querySelectorAll('button,.reader-copy,.reader-link-note,.reader-visible-url').forEach(n=>n.remove());return copy.textContent.replace(/\s/g,'');
  });
  row.textHash=createHash('sha256').update(originalText).digest('hex');
  await parent.evaluate(node=>{const dialog=document.getElementById('detail');dialog.scrollTop+=node.getBoundingClientRect().top-document.querySelector('.detail-toolbar').getBoundingClientRect().bottom-18;});
  await page.screenshot({path:`${out}/lists-${engine.name()}-${width}.png`});
  if(observe){assert.equal(row.childCount,0);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();continue;}
  assert.equal(row.childCount,4);row.overflow=await page.evaluate(()=>{const d=document.getElementById('detail');return d.scrollWidth>d.clientWidth;});assert(!row.overflow);
  assert(await parent.locator(':scope > ol > li').last().innerText().then(t=>t.includes('申請類工作要先確認')));
  row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id));
  // 1: compare source limitations, use keyboard section navigation, then return.
  await page.locator('.reader-outline summary').click();await page.locator('.reader-outline-jump').first().focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'reader-section-0');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#query').inputValue(),'旅遊');assert.equal(await page.locator('#scenario').inputValue(),'生活');
  // 2: a nested search hit must land on the actual child item, with its parent intact.
  await page.goto(base+'?q=申請類工作&case=UC-001');await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});
  const passage=page.getByRole('button',{name:'定位這段原文 ↓'}).first();await passage.click();
  row.hit=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent,parent:document.activeElement.parentElement.tagName}));
  assert.equal(row.hit.tag,'LI');assert.equal(row.hit.parent,'OL');assert(row.hit.text.startsWith('申請類工作'));
  assert.equal(await page.locator('.markdown li:has(> ol)').filter({hasText:/^本庫判讀：/}).count(),1);
  // 3: direct refresh, long content, empty recovery, source links and native Back.
  await page.reload();await page.locator('#detail[open]').waitFor();await page.waitForFunction(()=>discoveryReady,null,{timeout:120000});assert.equal(await page.locator('#detail-toolbar-id').innerText(),'UC-001');
  await page.keyboard.press('Escape');await page.locator('#query').fill('no-list-results-qa');await page.locator('#empty').waitFor({state:'visible'});
  row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id));
  await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(n=>n===document.activeElement));
  await page.locator('#query').fill('旅遊');await page.locator('#search-submit').click();
  const trigger=page.locator('#results .card[data-case-id="UC-001"] .card-bottom button');await trigger.click();await page.locator('#detail[open]').waitFor();
  await page.locator('.research-details summary').click();assert(await page.locator('.markdown a[href^="https:"]').count());
  await page.goBack();await page.locator('#detail').waitFor({state:'hidden'});assert(await trigger.evaluate(n=>n===document.activeElement));
  row.audits.push((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id));
  assert(row.audits.every(v=>!v.length));assert.deepEqual(row.errors,[]);
  console.log('PASS LIST '+engine.name()+' '+width);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await context.close();await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
