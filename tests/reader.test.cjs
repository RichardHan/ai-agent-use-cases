'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {selectJumps}=require('../assets/reader.js');
test('jump choices point to existing result, method, limits and source headings',()=>{
 const headings=['來源','來源報告與限制','建議操作流程（整理者設計，未實跑）','可複製提示詞（自設未測，非作者原文）','權限、費用與可用性','驗收'];
 const jumps=selectJumps(headings);
 assert.deepEqual(jumps.map(x=>x.index),[1,2,4,0]);
 assert.deepEqual(jumps.map(x=>x.title),[headings[1],headings[2],headings[4],headings[0]]);
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
