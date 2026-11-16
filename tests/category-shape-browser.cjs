'use strict';
// The shape sentence used to sit at the end of #facet-count-hint. On the live
// site at 320×640, centering #category put that sentence entirely above the
// viewport (hint bottom -99). A reader choosing a category must still see that
// these options are page phrases, not a shared topic list.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.CATEGORY_SHAPE_URL||'http://127.0.0.1:8081/ai-agent-use-cases/';

(async()=>{
  const browser=await chromium.launch();
  const errors=[];
  for (const [width,height] of [[320,640],[390,844],[1440,900]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    page.setDefaultTimeout(30000);
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof discoveryReady!=='undefined'&&discoveryReady,null,{timeout:120000});
    await page.locator('#filter-options').evaluate(el=>{el.open=true;});
    await page.locator('#category').scrollIntoViewIfNeeded();
    const row=await page.evaluate(()=>{
      const note=document.getElementById('category-shape');
      const select=document.getElementById('category');
      const hint=document.getElementById('facet-count-hint');
      const noteRect=note?note.getBoundingClientRect():null;
      const selectRect=select.getBoundingClientRect();
      const counts=new Map();
      for (const item of entries) {
        if (!item||!item.category) continue;
        counts.set(item.category,(counts.get(item.category)||0)+1);
      }
      let singleton=0;
      for (const count of counts.values()) if (count===1) singleton+=1;
      return {
        noteText:note?note.textContent:'',
        hidden:note?note.hidden:true,
        note:noteRect?{top:noteRect.top,bottom:noteRect.bottom,height:noteRect.height,width:noteRect.width}:null,
        selectTop:selectRect.top,
        selectBottom:selectRect.bottom,
        hintHasShape:hint.textContent.includes('不是共用主題清單'),
        overflow:document.documentElement.scrollWidth-innerWidth,
        total:counts.size,
        singleton,
        describedBy:select.getAttribute('aria-describedby')||''
      };
    });
    assert.ok(row.note,width+': the shape note must exist beside the category select');
    assert.equal(row.hidden,false,width+': the shape note must be shown once phrases are loaded');
    assert.match(row.noteText,/不是共用主題清單/);
    assert.ok(row.noteText.includes(row.total+' 個分類有 '+row.singleton+' 個只出現 1 次'),width+': the note counts loaded phrases');
    assert.equal(row.hintHasShape,false,width+': the long facet hint must not repeat the shape sentence');
    assert.ok(row.note.bottom>0&&row.note.top<height,width+': the shape note must intersect the viewport when the select is in view; got '+JSON.stringify(row.note));
    assert.ok(row.note.top>=row.selectTop-4,width+': the shape note must sit with the select, not in the hint above it');
    assert.equal(row.overflow,0,width+': the shape note must not overflow horizontally');
    assert.ok(row.describedBy.split(/\s+/).includes('category-shape'),width+': the select must describe the note');
    assert.deepEqual(pageErrors,[]);
    await page.close();
  }
  await browser.close();
  console.log('PASS category shape stays with the select');
})().catch(error=>{console.error(error);process.exit(1);});
