'use strict';
// A reader's place in a case is the block under the detail toolbar, not the raw
// `#detail.scrollTop` number. Chromium's scroll anchoring deliberately changes
// scrollTop to hold that block still when content above it reflows: inserting
// 240px above the anchor moved scrollTop by exactly 240px and the block by 0px
// (measured 2026-11-10, Chromium 1440x900, reduced motion). Continuous Integration
// installs its own CJK fonts, so a relayout can land after the popstate restore and
// nudge scrollTop a few pixels while the reader is still looking at the same line.
// An equality test on scrollTop therefore reports "the reading position was lost"
// for a layout shift the reader never sees — it failed that way twice on
// 2026-11-10 (runs 42799277060, 42806867753), at two different assertions of the
// same restore. This helper asserts what the reader can observe — same block, same
// offset below the toolbar — and says so with numbers when it does not hold.
const BLOCK_SELECTOR='#detail-body h2,#detail-body h3,#detail-body p,#detail-body li,#detail-body pre,#detail-body summary,#detail-body .markdown-table';

// Same rule as the app's selectReadingAnchor(): a block counts when it is on screen
// inside the inset reading area, and the one that *starts* below the toolbar wins —
// a block already clipped under the toolbar is only the fallback. Sampling a
// different block than the app saves would let the assertion pass while the passage
// the reader actually returns to moves, so the rule is copied rather than simplified.
exports.readingPosition=page=>page.evaluate(selector=>{
  const dialog=document.querySelector('#detail');
  if(!dialog||!dialog.open)return {open:false,scrollTop:0,text:null,offset:null};
  const toolbar=dialog.querySelector('.detail-toolbar').getBoundingClientRect();
  const top=toolbar.bottom+8,bottom=dialog.getBoundingClientRect().bottom-8;
  const visible=[...dialog.querySelectorAll(selector)].filter(node=>{
    if(node.closest('.related-cases')||node.classList.contains('detail-load-status'))return false;
    const rect=node.getBoundingClientRect();
    return rect.height>0&&rect.bottom>top&&rect.top<bottom;
  });
  const node=visible.find(candidate=>candidate.getBoundingClientRect().top>=top)||visible[0]||null;
  const rect=node?.getBoundingClientRect();
  return {open:true,scrollTop:Math.round(dialog.scrollTop),text:node?node.textContent:null,offset:rect?+(rect.top-toolbar.bottom).toFixed(2):null};
},BLOCK_SELECTOR);

const describe=sample=>sample.text===null
  ? `no reading block (scrollTop ${sample.scrollTop})`
  : `${JSON.stringify(sample.text.slice(0,48))} at ${sample.offset}px below the toolbar (scrollTop ${sample.scrollTop})`;

// Two consecutive samples at least `settle` ms apart: a single frame can be caught
// mid-restore, and the point of this wait is that the position stayed put.
exports.waitReadingPosition=async(page,expected,{timeout=15000,tolerance=3,settle=120,message='Reading position was not held'}={})=>{
  const deadline=Date.now()+timeout;
  const samples=[];
  let held=0;
  while(Date.now()<deadline){
    const sample=await exports.readingPosition(page);
    samples.push(sample);
    const matched=sample.open&&sample.text!==null&&sample.text===expected.text&&sample.offset!==null&&expected.offset!==null&&Math.abs(sample.offset-expected.offset)<=tolerance;
    held=matched?held+1:0;
    if(held>=2)return sample;
    await page.waitForTimeout(settle);
  }
  const tail=samples.slice(-6).map(sample=>'    '+describe(sample)).join('\n');
  throw new Error(`${message} (waited ${timeout}ms).\n  expected ${describe(expected)}\n  observed\n${tail}`);
};
