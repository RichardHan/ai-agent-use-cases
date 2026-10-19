'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.guide={sourceTypeMessage,SOURCE_TYPES};',context);
const {sourceTypeMessage,SOURCE_TYPES}=context.guide;
test('source guide distinguishes all current origin labels without claiming independent verification',()=>{
 assert.deepEqual(Object.keys(SOURCE_TYPES),['作者報告／示範','官方自報','公開資料核讀','模板／文件核讀','尚待查證']);
 for(const type of Object.keys(SOURCE_TYPES)){
  const message=sourceTypeMessage(type);
  assert(message.startsWith(type+'：'));
  assert(message.includes('本庫未獨立重現'));
 }
 assert.match(sourceTypeMessage('官方自報'),/官方.*自報/);
 assert.match(sourceTypeMessage('模板／文件核讀'),/文件.*不代表.*實作/);
 assert.match(sourceTypeMessage('尚待查證'),/不要.*已驗證/);
});
test('default and unfamiliar source types remain honest instead of silently assigning evidence',()=>{
 assert.match(sourceTypeMessage(''),/不是.*驗證/);
 const unknown='未分類 <img src=x onerror=alert(1)>';
 assert(sourceTypeMessage(unknown).includes(unknown));
 assert.match(sourceTypeMessage(unknown),/未列入.*核對原文/);
 assert(!sourceTypeMessage(unknown).includes('作者報告'));
});
