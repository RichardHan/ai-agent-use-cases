'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createReadingMemory}=require('../assets/reader.js');
test('each browser entry retains its own reading view, including repeated cases',()=>{
 const memory=createReadingMemory(20),item={id:'UC-005',markdown:'original'};
 memory.save('a',item,{scroll:1200,open:[true],query:'限制'});
 memory.save('b',item,{scroll:0,open:[false],query:''});
 assert.equal(memory.read('a',item).scroll,1200);assert.equal(memory.read('b',item).scroll,0);
 assert.equal(memory.read('a',{...item,markdown:'updated'}),null);
 assert.equal(memory.read('a',{...item,id:'UC-006'}),null);
 assert.equal(memory.read(null,item),null);
});
test('reading memory is bounded and never restores an evicted or unsaved entry',()=>{
 const memory=createReadingMemory(2),item={id:'UC-005',markdown:'original'};
 memory.save('a',item,{scroll:10});memory.save('b',item,{scroll:20});memory.save('c',item,{scroll:30});
 assert.equal(memory.read('a',item),null);assert.equal(memory.read('c',item).scroll,30);
 memory.save('b',item,{scroll:40});memory.save('d',item,{scroll:50});
 assert.equal(memory.read('c',item),null);assert.equal(memory.read('b',item).scroll,40);
});
