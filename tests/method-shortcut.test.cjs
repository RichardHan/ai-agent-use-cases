'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {selectMethodShortcut}=require(process.env.READER_MODULE||'../assets/reader.js');
test('method shortcut preserves the full untested heading and original index',()=>{
 const titles=['來源版本','建議操作流程（本庫設計，未實測）','可貼指令（本庫原創、未測）'];
 assert.deepEqual(selectMethodShortcut(titles,'case'),{index:1,title:titles[1]});
});
test('workflow heading marked 本庫未實作 stays the method shortcut instead of being stolen as a result',()=>{
 const titles=[
  '輸入與預期輸出',
  '來源版本',
  '來源A：tantan21jp（Qiita，日文）',
  '建議操作流程（依來源整理；本庫未實作）',
  '可複製提示詞（本庫原創設計，未實跑）'
 ];
 assert.deepEqual(selectMethodShortcut(titles,'case'),{index:3,title:titles[3]});
});
test('pending, sparse and missing methods do not fabricate an actionable workflow',()=>{
 assert.equal(selectMethodShortcut(['建議流程'],'pending'),null);
 assert.equal(selectMethodShortcut([],'case'),null);
 assert.equal(selectMethodShortcut(['來源','限制'],'evidence'),null);
});
test('prompt fallback and evidence methods keep literal source labels',()=>{
 const title='可貼指令（自設未測） <img onerror=alert(1)>';
 assert.deepEqual(selectMethodShortcut(['來源',title],'evidence'),{index:1,title});
 assert.deepEqual(selectMethodShortcut(['權限','方法'],'case'),{index:1,title:'方法'});
});
