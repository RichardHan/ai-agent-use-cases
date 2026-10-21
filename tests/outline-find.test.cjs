'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {findOutlineSections}=require('../assets/reader.js');
test('find a later supplement without hiding qualifiers or merging repeated headings',()=>{
 const titles=['來源','可貼指令（自設未測）','獨立審查找到重複發送','可貼指令（自設未測）'];
 assert.deepEqual(findOutlineSections(titles,'獨立審查'),[2]);
 assert.deepEqual(findOutlineSections(titles,'可貼指令'),[1,3]);
 assert.deepEqual(findOutlineSections(titles,'指令 未測'),[1,3]);
 assert.equal(titles[1],'可貼指令（自設未測）');
});
test('title matching normalizes width/case, handles empty and literal unsafe-looking queries',()=>{
 const titles=['Ｃｏｄｅｘ 交接','來源','<img src=x>'];
 assert.deepEqual(findOutlineSections(titles,'codex'),[0]);
 assert.deepEqual(findOutlineSections(titles,'  '),[0,1,2]);
 assert.deepEqual(findOutlineSections(titles,'不存在'),[]);
 assert.deepEqual(findOutlineSections(titles,'<img'),[2]);
 assert.deepEqual(findOutlineSections([],'來源'),[]);
});
