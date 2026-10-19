'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const observe=process.env.CONTEXT_OBSERVE==='1';
const origin=process.env.CONTEXT_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const output=process.env.CONTEXT_OUTPUT||'qa-artifacts/passage';
fs.mkdirSync(output,{recursive:true});
const reports=[];
const save=()=>fs.writeFileSync(output+'/report.json',JSON.stringify(reports,null,2));
(async()=>{
 for(const [engine,launcher] of (observe?[['chromium',chromium]]:[['chromium',chromium],['firefox',firefox],['webkit',webkit]])){
 const browser=await launcher.launch();try{
 for(const [size,width,height] of (engine==='chromium'?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]])){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(45000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const report={engine,size,cases:[],audits:[]};reports.push(report);save();
 for(const [id,query] of [['UC-001','Lyft'],['UC-028','服務降級']]){
 const response=await page.goto(origin+'?q='+encodeURIComponent(query)+'&case='+id);assert.equal(response.status(),200);
 await page.waitForFunction(()=>discoveryReady,null,{timeout:30000});await page.locator('#detail[open]').waitFor();
 const jump=page.locator('.reader-search-jump').first();await jump.scrollIntoViewIfNeeded();
 await page.screenshot({path:`${output}/${id}-${engine}-${size}-entry.jpg`,type:'jpeg',quality:80});
 const target=await jump.getAttribute('aria-controls');await jump.click();
 const finding=await page.evaluate(({target,query})=>{
  const heading=document.getElementById(target),blocks=[];
  for(let n=heading.nextElementSibling;n&&!/^H[23]$/.test(n.tagName);n=n.nextElementSibling){
   if(n.classList.contains('reader-return'))continue;
   const nodes=/^[UO]L$/.test(n.tagName)?[...n.children]:[n];blocks.push(...nodes);
  }
  const hit=blocks.find(n=>n.textContent.normalize('NFKC').toLowerCase().includes(query.toLowerCase()));
  return {heading:heading.textContent,headingTop:heading.getBoundingClientRect().top,hitTop:hit?.getBoundingClientRect().top,hitText:hit?.textContent,viewport:innerHeight};
 },{target,query});report.cases.push({id,query,...finding});save();
 await page.screenshot({path:`${output}/${id}-${engine}-${size}-heading.jpg`,type:'jpeg',quality:80});
 if(!observe){
  const locate=page.locator('.reader-search-locate').first();assert.equal(await locate.count(),1);
  const excerpt=await page.locator('.reader-search-excerpt').first().textContent();assert(finding.hitText.includes(excerpt.replace(/^…|…$/g,'')),'literal continuous source excerpt');assert(excerpt.toLowerCase().includes(query.toLowerCase()));
  await locate.focus();await page.keyboard.press('Enter');const dest=await locate.getAttribute('aria-controls');
  assert.equal(await page.evaluate(()=>document.activeElement.id),dest);
  const bounds=await page.locator('#'+dest).evaluate(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,toolbarBottom:document.querySelector('.detail-toolbar').getBoundingClientRect().bottom,text:e.textContent}));
  assert(bounds.top>=bounds.toolbarBottom);assert(bounds.top<height);assert(bounds.text.includes(query));assert.equal(bounds.text,finding.hitText);
  report.cases.at(-1).located=bounds;await page.screenshot({path:`${output}/${id}-${engine}-${size}-located.jpg`,type:'jpeg',quality:80});
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.audits.push({id,violations:axe.violations});save();assert.equal(axe.violations.length,0);
  const direct=page.url();await page.reload();await page.waitForFunction(()=>discoveryReady,null,{timeout:30000});assert.equal(page.url(),direct);await page.locator('#close-detail').click();assert.equal(await page.locator('#query').inputValue(),query);
 }
 }
 if(!observe){
 // 3. Problem search with combined facets, no results, keyboard read/return.
 await page.goto(origin+'?q='+encodeURIComponent('旅遊')+'&scenario='+encodeURIComponent('生活')+'&tool=Grok+Bot');
 await page.waitForFunction(()=>discoveryReady,null,{timeout:30000});assert(await page.locator('#results .card').count()>0);
 await page.locator('#query').fill('no-passage-results-98765');assert(await page.locator('#empty').isVisible());await page.locator('#edit-query').click();assert(await page.locator('#query').evaluate(e=>e===document.activeElement));
 await page.locator('#query').fill('旅遊');const trigger=page.locator('#results .card .card-bottom button').first();await trigger.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();await page.keyboard.press('Escape');assert(await trigger.evaluate(e=>e===document.activeElement));
 assert.equal(await page.locator('#scenario').inputValue(),'生活');assert.equal(await page.locator('#tool').inputValue(),'Grok Bot');
 const fixture=async(markdown,query)=>page.evaluate(({markdown,query})=>{document.getElementById('query').value=query;showDetail({...entries[0],markdown},null,false);},{markdown,query});
 await fixture('# Test\n## 限制\n沒有相關詞','限制');assert.equal(await page.locator('.reader-search-locate').count(),0);
 await fixture('# Test\n## 來源\n[公開資料](https://example.org/hidden-payroll-key)','hidden-payroll-key');assert.equal(await page.locator('.reader-search-locate').count(),0);assert.equal(await page.locator('.reader-search-excerpt').count(),0);
 await fixture('# Test\n## 限制（未實跑）\n不登入系統或算薪資。','薪水');assert.match(await page.locator('.reader-search-excerpt').textContent(),/不登入系統或算薪資/);assert.match(await page.locator('.reader-search-jump strong').textContent(),/薪水.*薪資/);
 await fixture('# Test\n## 同名\n背景\n## 同名\nＡＰＩ <img src=x onerror=alert(1)>','api');assert.equal(await page.locator('.reader-search img').count(),0);await page.locator('.reader-search-locate').click();assert.match(await page.locator(':focus').textContent(),/ＡＰＩ/);
 const long='背景。'.repeat(180)+'尚未驗證長段落命中。'+'補充。'.repeat(180);
 await fixture('# Test\n## 長文\n'+long,'長段落命中');assert.match(await page.locator('.reader-search-excerpt-label').textContent(),/節錄，非完整段落/);assert.match(await page.locator('.reader-search-excerpt').textContent(),/尚未驗證長段落命中/);await page.locator('.reader-search-locate').click();assert.equal(await page.locator(':focus').textContent(),long);
 await fixture('# Test\n頁首特有詞原段。','頁首特有詞');await page.locator('.reader-search-locate').click();assert.equal(await page.locator(':focus').textContent(),'頁首特有詞原段。');
 await fixture('# Test\n## 限制\n- 跨列\n- 命中','跨列命中');assert.equal(await page.locator('.reader-search').count(),0);
 await fixture('# Test\n## 內容\n沒有匹配','no-source-match');assert.equal(await page.locator('.reader-search').count(),0);
 if(engine==='chromium'&&size==='desktop'){
 report.corpus=await page.evaluate(()=>{
  let passages=0;const terms=[{term:'未',variants:['未']},{term:'來源',variants:['來源']}];
  for(const item of entries){
   const body=document.createElement('div');body.innerHTML='<section class="plain-overview"></section><details class="research-details"><summary>完整研究</summary></details>';
   const markdown=renderMarkdown(item.markdown,item.path);body.querySelector('details').append(markdown);const original=markdown.innerHTML;
   CaseReader.enhance(body,item,terms);
   for(const group of body.querySelectorAll('.reader-search-match')){
    const locate=group.querySelector('.reader-search-locate'),quote=group.querySelector('.reader-search-excerpt');if(!locate)continue;
    const target=body.querySelector('#'+locate.getAttribute('aria-controls'));assertSource: {
     if(!target||!['P','LI','PRE','BLOCKQUOTE'].includes(target.tagName))throw Error(item.id+' bad original block');
     if(quote&&!target.textContent.includes(quote.textContent.replace(/^…|…$/g,'')))throw Error(item.id+' nonliteral excerpt');
    }passages++;
   }
   const clean=markdown.cloneNode(true);clean.querySelectorAll('.reader-return').forEach(n=>n.remove());
   clean.querySelectorAll('h2,h3,[id^="reader-passage-"]').forEach(n=>{n.removeAttribute('id');n.removeAttribute('tabindex');});
   if(clean.innerHTML!==original)throw Error(item.id+' original research changed');
  }return {entries:entries.length,passages};
 });save();
 await page.evaluate(()=>{globalThis.savedSegmenter=Intl.Segmenter;Intl.Segmenter=undefined;});
 await fixture('# Test\n## 長文\n'+long,'長段落命中');assert.equal(await page.locator('.reader-search-excerpt').count(),0);await page.locator('.reader-search-locate').click();assert.equal(await page.locator(':focus').textContent(),long);
 await page.evaluate(()=>{Intl.Segmenter=globalThis.savedSegmenter;delete globalThis.savedSegmenter;});
 }
 await page.locator('#close-detail').click();
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth));assert.deepEqual(errors,[]);report.complete=true;save();await context.close();
 }
 }finally{await browser.close();}
 }
 console.log(JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);save();process.exitCode=1;});
