'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({URL,URLSearchParams});
vm.runInContext(source+'\nthis.recover=phraseRecoveryOptions;this.recoverVocabulary=vocabularyRecoveryOptions;',context);
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

const plain=options=>Array.from(options,({query,count})=>[query,count]);

test('a failed question offers a library term it already contains, including search synonyms',()=>{
  const entries=[item('UC-001',['旅遊','比價'],'規劃旅行並比較價格'),item('UC-002',['發票'],'整理發票'),item('UC-003',['排班'],'輪班表')];
  // 「省錢」 is a search synonym for 比價 but is not an indexed tag, so tag-only recovery misses it.
  assert.deepEqual(plain(context.recoverVocabulary(entries,'想省錢',{})),[['省錢',1]]);
  // The longer contained term wins over a shorter one.
  assert.deepEqual(plain(context.recoverVocabulary(entries,'可以幫我整理發票嗎',{})),[['發票',1]]);
  // Words the library does not use invent nothing.
  assert.deepEqual(plain(context.recoverVocabulary(entries,'想要便宜一點',{})),[]);
  // Repeating the whole failed query as a suggestion would not narrow anything.
  assert.deepEqual(plain(context.recoverVocabulary(entries,'省錢',{})),[]);
});

test('a term covering half the loaded corpus is not offered as a narrower question',()=>{
  const half=[item('A',['發票']),item('B',['發票']),item('C',['旅遊']),item('D',['旅遊'])];
  assert.deepEqual(plain(context.recoverVocabulary(half,'我要發票',{})),[]);
  const quarter=[item('A',['發票']),item('B',['旅遊']),item('C',['旅遊']),item('D',['旅遊'])];
  assert.deepEqual(plain(context.recoverVocabulary(quarter,'我要發票',{})),[['發票',1]]);
  // An active facet can remove every hit for the same term.
  assert.deepEqual(plain(context.recoverVocabulary(quarter,'我要發票',{scenario:'生活'})),[]);
  assert.deepEqual(plain(context.recoverVocabulary([],'我要發票',{})),[]);
});

test('recovery keeps the three longest contained terms in question order',()=>{
  const entries=[item('UC-001',['合約審核'],'合約審核'),item('UC-002',['報表比對'],'報表比對'),item('UC-003',['客戶反饋'],'客戶反饋'),item('UC-004',['發票'],'發票')]
    .concat(Array.from({length:16},(_,index)=>item('UC-1'+index,['旅遊'],'旅遊')));
  const result=context.recoverVocabulary(entries,'合約審核 報表比對 客戶反饋 發票',{});
  // Ranked by term length, then fewer hits, then where the visitor wrote it; the
  // shorter 發票 falls outside a three-suggestion cap.
  assert.deepEqual(Array.from(result,({query,count})=>[query,count]),[['合約審核',1],['報表比對',1],['客戶反饋',1]]);
});
