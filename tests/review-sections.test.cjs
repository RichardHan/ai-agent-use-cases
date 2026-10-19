'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {selectReviewSections}=require(process.env.REVIEW_SOURCE||'../assets/reader.js');

test('later versions with links and unlinked limitations remain discoverable in original order',()=>{
 const sections=[{title:'來源與證據',linkCount:1},{title:'適合誰',linkCount:0},{title:'權限、費用與限制',linkCount:0},{title:'Grok Bot貨運版本（作者自述）',linkCount:2},{title:'自設只讀驗收（未實跑）',linkCount:0}];
 const result=selectReviewSections(sections);
 assert.deepEqual(result.map(s=>s.index),[0,2,3,4]);
 assert.equal(result[2].title,sections[3].title);
 assert.equal(result[2].linkCount,2);
 assert.equal(result[3].caution,true);
});
test('duplicates preserve separate destinations, raw qualification and unsafe-looking literal titles',()=>{
 const title='來源 <img src=x onerror=alert(1)>（未驗證）';
 const result=selectReviewSections([{title,linkCount:1},{title,linkCount:1}]);
 assert.deepEqual(result.map(s=>s.index),[0,1]);
 assert(result.every(s=>s.title===title));
});
test('sparse and unknown structures do not invent verification or source destinations',()=>{
 assert.deepEqual(selectReviewSections([]),[]);
 assert.deepEqual(selectReviewSections([{title:'用途',linkCount:0}]),[]);
 const result=selectReviewSections([{title:'待查缺口',linkCount:0},{title:'工具文件',linkCount:1}]);
 assert.equal(result[0].caution,true);
 assert.equal(result[1].caution,false);
 assert.equal(result[1].title,'工具文件');
 assert(result.every(s=>!('proof' in s)));
});
