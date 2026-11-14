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
test('可嘗試的流程 and 小範圍試法 precede prompt sections as the method shortcut',()=>{
 const uc026=['可嘗試的流程（本文設計、未實測）','原創提示詞（未實測，可修改後貼上）','共通方案、可用性與權限'];
 assert.deepEqual(selectMethodShortcut(uc026,'case'),{index:0,title:uc026[0]});
 const uc073=['原作者做了什麼','為什麼值得試','小範圍試法（整理者設計，未實測）','可直接貼用的指令（原創、未實測）','官方支持、費用與可用性'];
 assert.deepEqual(selectMethodShortcut(uc073,'case'),{index:2,title:uc073[2]});
 const promptOnly=['來源版本','原創提示詞（未實測，可修改後貼上）','權限與限制'];
 assert.deepEqual(selectMethodShortcut(promptOnly,'case'),{index:1,title:promptOnly[1]});
 const sourceWithPromptWord=['輸入與預期輸出','S-046A：Grok Bot — Tw93 的每晚精選提示詞（主要來源）','權限與限制'];
 assert.equal(selectMethodShortcut(sourceWithPromptWord,'case'),null);
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
