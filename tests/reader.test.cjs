'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {selectJumps,selectReadingPosition}=require('../assets/reader.js');
test('reader position follows the last heading above its marker and handles boundaries',()=>{
 const headings=[100,220,410].map(top=>({getBoundingClientRect:()=>({top})}));
 assert.equal(selectReadingPosition(headings,80,800,2000),0,'before the first heading, show the first section');
 assert.equal(selectReadingPosition(headings,220,800,2000),1,'an exact heading boundary selects that section');
 assert.equal(selectReadingPosition(headings,390,800,2000),1,'between headings, retain the section currently being read');
 assert.equal(selectReadingPosition(headings,200,800,790),2,'at the end of a document, select its final section');
 assert.equal(selectReadingPosition([],80,800,0),-1,'headings are not fabricated');
});
test('jump choices point to existing result, method, limits and source headings',()=>{
 const headings=['來源','來源報告與限制','建議操作流程（整理者設計，未實跑）','可複製提示詞（自設未測，非作者原文）','權限、費用與可用性','驗收'];
 const jumps=selectJumps(headings);
 // A source report is not an implementation result. The old pattern matched
 // `來源報告` here and labelled that section `實作與結果` on UC-004/005/006/007/059,
 // promising a section the page does not have; those pages still list it in the
 // full outline, so no shortcut is lost.
 assert.deepEqual(jumps.map(x=>x.label),['方法與步驟','限制與權限','來源與版本']);
 assert.deepEqual(jumps.map(x=>x.index),[2,4,0]);
 assert.deepEqual(jumps.map(x=>x.title),[headings[2],headings[4],headings[0]]);
});
test('a real author implementation section still gets the result shortcut',()=>{
 const headings=['問題與原作者實際做了什麼','可參考的操作順序','權限、費用與限制','來源與查閱範圍'];
 const jumps=selectJumps(headings);
 assert.equal(jumps[0].label,'實作與結果');
 assert.equal(jumps[0].title,headings[0]);
});
test('dated supplements never become the result shortcut',()=>{
 // UC-005's first heading mentioning a result word is a 2026-10-22 supplement. It
 // belongs in the full outline, but a shortcut labelled 實作與結果 would send a
 // reader to an appendix instead of the case. A dated heading that is the
 // implementation itself (2026-10-17 中文實作變體) is not a supplement.
 const headings=['來源','2026-10-23 補充：先做一次可接受的操作流程','來源報告與限制','建議操作流程（整理者設計，未實跑）','權限、費用與可用性','2026-10-22 補充：兩層審查仍曾發生先合併、後審查'];
 const jumps=selectJumps(headings);
 assert.equal(jumps.some(x=>x.label==='實作與結果'),false);
 // A dated supplement with no source-report heading proves the date guard alone,
 // not the 來源報告 removal: on the base selector this heading is the result target.
 const supplementOnly=selectJumps(['2026-10-22 補充：兩層審查仍曾發生先合併、後審查','權限、費用與可用性','來源']);
 assert.equal(supplementOnly.some(x=>x.label==='實作與結果'),false);
 const variant=selectJumps(['2026-10-17 中文實作變體：上游改版','權限、費用與可用性']);
 assert.equal(variant[0].label,'實作與結果');
 assert.equal(variant[0].title,'2026-10-17 中文實作變體：上游改版');
});
test('sparse, pending and unknown structures do not invent sections or evidence',()=>{
 assert.deepEqual(selectJumps([]),[]);
 assert.deepEqual(selectJumps(['無標準分類的章節']),[]);
 const jumps=selectJumps(['來源與限制','可貼指令（自行設計，未測）']);
 assert.equal(new Set(jumps.map(x=>x.index)).size,jumps.length);
 assert(jumps.every(x=>x.index>=0&&x.index<2));
});
test('duplicate and unsafe-looking heading text stays literal and keeps its index',()=>{
 const headings=['作者實作與結果','作者實作與結果','權限 <img src=x onerror=alert(1)>','來源'];
 const jumps=selectJumps(headings);
 assert.equal(jumps[0].index,0);
 assert.equal(jumps.find(x=>x.index===2).title,headings[2]);
 assert.equal(jumps.filter(x=>x.title===headings[0]).length,1);
});
