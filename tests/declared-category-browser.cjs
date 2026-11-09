'use strict';
// The 主題分類 filter and the 同分類 line in 延伸閱讀 claim a case belongs to a
// theme. This check keeps those claims tied to what the case page declares, and
// keeps pages that declare nothing reachable through the rest of the page.
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.CATEGORY_URL||'http://127.0.0.1:8081/ai-agent-use-cases/';
const engines=process.env.CATEGORY_ENGINES==='all'?[chromium,firefox,webkit]:[chromium];
fs.mkdirSync('qa-artifacts',{recursive:true});
(async()=>{
 const report=[];
 for(const engine of engines){
  for(const [width,height] of [[1440,900],[390,844]]){
   const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
   page.setDefaultTimeout(30000);
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   const ready=()=>page.waitForFunction(()=>typeof discoveryReady!=='undefined'&&discoveryReady,null,{timeout:120000});
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await ready();
   const row={engine:engine.name()||'chromium',width};

   // The filter offers exactly the themes the pages declare, and says how many
   // pages it therefore cannot offer.
   const facet=await page.evaluate(()=>{
    // Read the declaration from the page header, not from the value the app
    // produced: otherwise a built-in guess would count as a declaration.
    const leadOf=markdown=>(markdown||'').replace(/^#{1,3}[^\n]*\n/,'').split(/^## /m)[0];
    const declares=entry=>/^-\s*分類(?:／標籤)?\s*[：:]/m.test(leadOf(entry.markdown));
    const declaredValues=[...new Set(entries.filter(declares).map(entry=>entry.category))].sort();
    const undeclared=entries.filter(entry=>!declares(entry));
    const options=[...document.querySelectorAll('#category option')];
    return {
     declaredCount:declaredValues.length,
     declaredValues,
     unclassified:undeclared.length,
     undeclaredMismatch:undeclared.filter(entry=>entry.category).map(entry=>entry.id),
     optionValues:options.map(option=>option.value).filter(Boolean).sort(),
     blankOptions:options.filter(option=>!option.textContent.trim()).length,
     hint:document.getElementById('facet-count-hint').textContent
    };
   });
   row.facet={declared:facet.declaredCount,unclassified:facet.unclassified,options:facet.optionValues.length};
   assert.equal(facet.blankOptions,0,'no blank category option');
   assert.deepEqual(facet.undeclaredMismatch,[],'a page that declares no theme carries none');
   assert.deepEqual(facet.optionValues,facet.declaredValues,'the filter offers exactly the declared themes');
   assert(facet.unclassified>0,'the corpus still contains pages that declare no theme');
   assert.ok(facet.hint.includes(facet.unclassified+' 個未宣告分類的條目不在選項內'),'the filter says how many pages it cannot list');

   // Choosing an option still selects exactly the pages that declare it, and the
   // choice survives a reload of the shared URL.
   const biggest=await page.evaluate(()=>{
    const option=[...document.querySelectorAll('#category option')].filter(option=>option.value)
      .sort((a,b)=>Number(b.dataset.count||0)-Number(a.dataset.count||0))[0];
    return {value:option.value,count:Number(option.dataset.count||0)};
   });
   await page.goto(base+'?category='+encodeURIComponent(biggest.value),{waitUntil:'domcontentloaded'});
   await ready();
   const filtered=await page.evaluate(()=>{
    const selected=document.getElementById('category').value;
    const byId=new Map(entries.map(entry=>[entry.id,entry]));
    const shown=[...document.querySelectorAll('#results [data-case-id]')].map(node=>node.dataset.caseId);
    return {
     count:Number((document.getElementById('results-count').textContent.match(/^顯示 (\d+) \//)||[])[1]),
     shown:shown.length,
     wrong:shown.filter(id=>byId.get(id)?.category!==selected).length,
     selected
    };
   });
   assert.equal(filtered.count,biggest.count,'the option count matches the results it yields');
   assert.equal(filtered.selected,biggest.value,'the shared category stays selected');
   assert.equal(filtered.wrong,0,'every result declares the selected theme');
   row.filter={value:biggest.value,count:filtered.count};

   // 延伸閱讀 on a page without a declared theme only offers shared-tag cases.
   const unclassifiedId=await page.evaluate(()=>entries.find(entry=>entry.kind==='case'&&!entry.category&&relatedEntries(entry,entries).length)?.id||'');
   const emptyId=await page.evaluate(()=>entries.find(entry=>entry.kind==='case'&&!entry.category&&!relatedEntries(entry,entries).length)?.id||'');
   if(unclassifiedId){
    await page.goto(base+'?case='+unclassifiedId,{waitUntil:'domcontentloaded'});
    await ready();
    await page.locator('#detail[open]').waitFor();
    const related=await page.evaluate(()=>({
     reasons:[...document.querySelectorAll('.related-meta')].map(node=>node.textContent.trim()),
     note:currentDetailItem.category
    }));
    assert.equal(related.note,'','the opened page declares no theme');
    assert(related.reasons.length>0,'shared tags still produce suggestions');
    for(const reason of related.reasons)assert.match(reason,/共同標籤：/,'an unclassified page never claims 同分類');
    row.related={page:unclassifiedId,rows:related.reasons.length};
   }
   if(emptyId){
    await page.goto(base+'?case='+emptyId,{waitUntil:'domcontentloaded'});
    await ready();
    const empty=await page.evaluate(()=>({visible:!document.querySelector('.related-empty')?.hidden,text:document.querySelector('.related-empty')?.textContent||''}));
    assert(empty.visible,'a page with no theme and no shared tags shows the empty state');
    assert.match(empty.text,/沒有宣告分類/,'the empty state says why it is empty');
    row.empty={page:emptyId};
   }
   // A page that declares a theme still uses it for 同分類.
   const declaredId=await page.evaluate(()=>entries.find(entry=>entry.kind==='case'&&entry.category&&relatedEntries(entry,entries).some(other=>sharedRelatedTags(entry,other).length<2))?.id||'');
   if(declaredId){
    await page.goto(base+'?case='+declaredId,{waitUntil:'domcontentloaded'});
    await ready();
    const same=await page.evaluate(()=>({
     category:currentDetailItem.category,
     reasons:[...document.querySelectorAll('.related-meta')].map(node=>node.textContent.trim())
    }));
    const sameRows=same.reasons.filter(reason=>reason.includes('同分類：'));
    assert(sameRows.length>0,'a declared theme still links to the same theme');
    for(const reason of sameRows)assert(reason.includes('同分類：'+same.category),'the 同分類 row names the declared theme');
    row.declared={page:declaredId,rows:sameRows.length};
   }

   await page.locator('#filters').scrollIntoViewIfNeeded();
   await page.screenshot({path:`qa-artifacts/declared-category-${row.engine}-${width}.png`});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
   const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   assert.deepEqual(axe.violations,[],'axe violations');
   assert.deepEqual(errors,[],'page errors');
   row.axe=axe.violations.length;
   report.push(row);
   await context.close();await browser.close();
  }
 }
 fs.writeFileSync('qa-artifacts/declared-category.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
})().catch(error=>{console.error(error);process.exit(1);});
