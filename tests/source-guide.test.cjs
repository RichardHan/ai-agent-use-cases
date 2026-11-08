'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.guide={sourceTypeMessage,PROOF_DEFINITIONS};',context);
const {sourceTypeMessage,PROOF_DEFINITIONS}=context.guide;
test('source guide distinguishes all current origin labels without claiming independent verification',()=>{
 assert.deepEqual(Object.keys(PROOF_DEFINITIONS),['官方自報','作者報告／示範','設計／未實跑','公開資料核讀','模板／文件核讀','尚待查證']);
 for(const type of Object.keys(PROOF_DEFINITIONS)){
  const message=sourceTypeMessage(type);
  assert(message.startsWith(type+'：'));
  assert(message.includes('本庫未獨立重現'));
  // The legend, the card badge and the detail note must quote one definition,
  // so a visitor is never told two different things about the same label.
  assert(message.includes(PROOF_DEFINITIONS[type]),`${type} must reuse the badge definition verbatim`);
 }
 assert.match(sourceTypeMessage('官方自報'),/未經第三方獨立驗證/,'the official label must keep its independent-verification caveat');
 assert.match(sourceTypeMessage('官方自報'),/推廣利益/,'a publisher-side account can carry a promotional interest');
 assert.match(sourceTypeMessage('模板／文件核讀'),/不代表.*實測/);
 assert.match(sourceTypeMessage('設計／未實跑'),/未附執行結果/,'designed-only labels must say there is no run record');
 assert.match(sourceTypeMessage('尚待查證'),/請勿直接照做/);
});
test('default and unfamiliar source types remain honest instead of silently assigning evidence',()=>{
 assert.match(sourceTypeMessage(''),/不是.*驗證/);
 const unknown='未分類 <img src=x onerror=alert(1)>';
 assert(sourceTypeMessage(unknown).includes(unknown));
 assert.match(sourceTypeMessage(unknown),/未列入.*核對原文/);
 assert(!sourceTypeMessage(unknown).includes('作者報告'));
});
