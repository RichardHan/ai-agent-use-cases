'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({URL,URLSearchParams});
vm.runInContext(source+'\nthis.recover=phraseRecoveryOptions;',context);
const item=(id,tags,markdown='')=>({id,title:id,summary:'',kind:'case',scenario:'工作',category:'工作',tools:[],tags,markdown,search:(tags.join(' ')+' '+markdown).toLowerCase()});
test('empty conversational query offers matching indexed task phrases without altering the query',()=>{
  const entries=[item('UC-001',['權限','登入']),item('UC-002',['權限']),item('UC-003',['郵件'])];
  const result=context.recover(entries,'我想管理登入權限',{scenario:'工作'});
  assert.deepEqual(Array.from(result,({query,count})=>[query,count]),[['登入',1],['權限',2]]);
  assert.equal(context.recover(entries,'我想管理登入權限',{scenario:'生活'}).length,0);
  assert.equal(context.recover(entries,'完全不相關',{scenario:'工作'}).length,0);
});
test('broad matches, absent tags and absent corpus do not invent useful recovery',()=>{
  const entries=Array.from({length:20},(_,index)=>item('UC-'+index,index<10?['權限']:['裝修']));
  entries.push({id:'P-001',search:'',scenario:'工作',kind:'pending'});
  assert.deepEqual(Array.from(context.recover(entries,'我想管權限',{scenario:'工作'})),[]);
  assert.deepEqual(Array.from(context.recover([], '裝修怎麼做',{})),[]);
  assert.deepEqual(Array.from(context.recover(entries,'裝修怎麼做',{scenario:'生活'})),[]);
});
