'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {collectPageErrors}=require('./page-context-errors.cjs');

test('page errors retain the original assertion messages and record diagnostic context',()=>{
 const page=new EventEmitter();page.url=()=> 'https://example.test/reading?case=UC-001';
 const row={errors:[]};let phase='bookmark';
 collectPageErrors(page,row,()=>phase);
 const frame={url:()=> 'https://example.test/reading'};page.mainFrame=()=>frame;
 page.emit('framenavigated',frame);
 page.emit('requestfailed',{url:()=> 'https://example.test/corpus.json',failure:()=>({errorText:'net::ERR_ABORTED'})});
 page.emit('console',{type:()=> 'error',text:()=> 'diagnostic console error'});
 const error=new Error('Context is stopped');page.emit('pageerror',error);
 phase='empty';page.emit('pageerror',new Error('second error'));
 assert.deepEqual(row.errors,['Context is stopped','second error']);
 assert.deepEqual(row.pageErrors.map(({message,url,phase})=>({message,url,phase})),[
  {message:'Context is stopped',url:'https://example.test/reading?case=UC-001',phase:'bookmark'},
  {message:'second error',url:'https://example.test/reading?case=UC-001',phase:'empty'}
 ]);
 assert.equal(row.pageErrors[0].stack,error.stack);
 assert.deepEqual(row.pageErrors[0].recentEvents.map(({type,phase})=>({type,phase})),[
  {type:'navigation',phase:'bookmark'},
  {type:'requestfailed',phase:'bookmark'},
  {type:'console-error',phase:'bookmark'}
 ]);
 assert.equal(row.pageErrors[0].recentEvents[1].error,'net::ERR_ABORTED');
 assert(row.pageErrors[0].recentEvents.every(event=>!Number.isNaN(Date.parse(event.time))));
 assert.throws(()=>assert.deepEqual(row.errors,[]));
});
