'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {collectPageErrors}=require('./page-context-errors.cjs');

test('page errors retain the original assertion messages and record diagnostic context',()=>{
 const page=new EventEmitter();page.url=()=> 'https://example.test/reading?case=UC-001';
 const row={errors:[]};let phase='bookmark';
 collectPageErrors(page,row,()=>phase);
 const error=new Error('Context is stopped');page.emit('pageerror',error);
 phase='empty';page.emit('pageerror',new Error('second error'));
 assert.deepEqual(row.errors,['Context is stopped','second error']);
 assert.deepEqual(row.pageErrors.map(({message,url,phase})=>({message,url,phase})),[
  {message:'Context is stopped',url:'https://example.test/reading?case=UC-001',phase:'bookmark'},
  {message:'second error',url:'https://example.test/reading?case=UC-001',phase:'empty'}
 ]);
 assert.equal(row.pageErrors[0].stack,error.stack);
 assert.throws(()=>assert.deepEqual(row.errors,[]));
});
