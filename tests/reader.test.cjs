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
 const uc096=selectJumps([
  '原作者實際做了什麼',
  '怎麼開始（整理者設計，未實跑）',
  '可貼指令（本庫原創，未測）',
  '驗收與限制',
  '2026-10-20補充 來源B：銷售半夜丟來的問題，Bot 用只讀權限跨系統先初判（V2EX，簡體中文）',
  '來源與查閱範圍'
 ]);
 assert.deepEqual(uc096.find(x=>x.label==='限制與權限'),{label:'限制與權限',index:3,title:'驗收與限制'});
 assert.deepEqual(uc096.find(x=>x.label==='來源與版本'),{label:'來源與版本',index:5,title:'來源與查閱範圍'});
 const uc034=selectJumps([
  '可嘗試的流程（本文設計、未實測）',
  '原創提示詞（未實測，可修改後貼上）',
  '共通方案、可用性與權限',
  '新增Grok Bot實作：收據與帳單的費用疑點',
  '2026-10-23補充：Bot提出舊發票疑點，仍須本人跨來源核對'
 ]);
 assert.equal(uc034.some(x=>x.label==='來源與版本'),false);
});
test('unimplemented workflow and pure source headings do not masquerade as 實作與結果 or steal 來源與版本',()=>{
 const uc455=selectJumps([
  '輸入與預期輸出',
  '來源版本',
  '來源A：tantan21jp（Qiita，日文）',
  '建議操作流程（依來源整理；本庫未實作）',
  '可複製提示詞（本庫原創設計，未實跑）',
  '所需連接、權限與限制'
 ]);
 assert.equal(uc455.some(x=>x.label==='實作與結果'),false);
 assert.deepEqual(uc455.find(x=>x.label==='方法與步驟'),{label:'方法與步驟',index:3,title:'建議操作流程（依來源整理；本庫未實作）'});
 const uc045=selectJumps([
  '來源及核對結果',
  '怎麼試（本庫設計，未測）',
  '可貼指令（本庫原創，未測）',
  '權限、費用與限制',
  '驗收與去重',
  '2026-10-22 14:40補充：共享表格是手動交接板，不是自動喚醒或核准來源'
 ]);
 assert.equal(uc045.some(x=>x.label==='實作與結果'),false);
 assert.deepEqual(uc045.find(x=>x.label==='來源與版本'),{label:'來源與版本',index:0,title:'來源及核對結果'});
 const uc353=selectJumps([
  '輸入與預期輸出',
  '來源版本',
  '來源A：@fankaishuoai（X，簡體中文）＋公開參考實作',
  '建議操作流程',
  '所需連接、權限與限制'
 ]);
 assert.equal(uc353.some(x=>x.label==='實作與結果'),false);
 assert.deepEqual(uc353.find(x=>x.label==='來源與版本'),{label:'來源與版本',index:1,title:'來源版本'});
 const uc340=selectJumps([
  '問題、實作與實際結果',
  '來源、結果限制與可用性',
  '可重用驗收步驟（本庫設計，未執行）',
  '可貼指令（本庫原創、未測）',
  '權限、費用與限制'
 ]);
 assert.deepEqual(uc340.find(x=>x.label==='限制與權限'),{label:'限制與權限',index:4,title:'權限、費用與限制'});
 assert.deepEqual(uc340.find(x=>x.label==='來源與版本'),{label:'來源與版本',index:1,title:'來源、結果限制與可用性'});
 assert.deepEqual(selectJumps(['怎麼試與來源']),[{label:'來源與版本',index:0,title:'怎麼試與來源'}]);
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
