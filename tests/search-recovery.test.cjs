'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({});
vm.runInContext(source+'\nthis.api={activeConditions,relaxationOptions,queryRelaxationOptions,queryRecoveryOptions,filterEntries,tokenize};',context);
const {activeConditions,relaxationOptions,queryRelaxationOptions,queryRecoveryOptions,filterEntries,tokenize}=context.api;
const plain=value=>JSON.parse(JSON.stringify(value));
const items=[
 {search:'旅遊 旅行 travel',scenario:'生活',kind:'case',tools:['Grok Bot'],category:'旅遊',proof:'作者報告／示範'},
 {search:'旅遊 旅行 travel',scenario:'生活',kind:'case',tools:['Meta Muse'],category:'旅遊',proof:'官方自報'},
 {search:'開發 code',scenario:'開發',kind:'case',tools:['Grok Bot'],category:'開發',proof:'作者報告／示範'}
];
test('active conditions preserve the original query, all facets and unfamiliar scenario URLs',()=>{
 const query='「ＴＲＡＶＥＬ」  <script>';
 const filters={scenario:'未知情境',kind:'pending',tool:'Grok Bot',category:'旅遊',proof:'尚待查證'};
 const conditions=plain(activeConditions(query,filters));
 assert.equal(conditions.length,6);
 assert.equal(conditions[0].value,query);
 assert.equal(conditions.find(x=>x.key==='kind').display,'待查線索');
 assert.equal(conditions.find(x=>x.key==='scenario').display,'未知情境');
 assert.deepEqual(plain(activeConditions('',{kind:'',tool:''})),[]);
});
test('a relaxation changes exactly one facet, preserves input and reports the real count',()=>{
 const terms=tokenize('「ＴＲＡＶＥＬ」');
 const filters={scenario:'開發',tool:'Grok Bot',category:'旅遊',proof:'作者報告／示範'};
 const original=JSON.stringify(filters);
 assert.equal(filterEntries(items,terms,filters).length,0);
 assert.deepEqual(plain(relaxationOptions(items,terms,filters)),[{key:'scenario',value:'開發',count:1}]);
 assert.equal(JSON.stringify(filters),original);
});
test('never propose a single change that still returns zero, or discard the query',()=>{
 assert.deepEqual(plain(relaxationOptions(items,tokenize('旅遊'),{scenario:'不存在',tool:'不存在'})),[]);
 assert.deepEqual(plain(relaxationOptions(items,tokenize('xyz987'),{scenario:'生活'})),[]);
 assert.deepEqual(plain(relaxationOptions([],[],{scenario:'生活'})),[]);
});
test('suggestion counts use the supplied loaded corpus, including pending entries without inventing evidence',()=>{
 const corpus=[...items,{search:'旅遊',scenario:'生活',kind:'pending',tools:[],category:'旅遊',proof:'尚待查證'}];
 const filters={scenario:'生活',kind:'pending',proof:'作者報告／示範'};
 const result=plain(relaxationOptions(corpus,tokenize('旅遊'),filters));
 assert.deepEqual(result,[{key:'kind',value:'pending',count:1},{key:'proof',value:'作者報告／示範',count:1}]);
 assert.deepEqual(plain(relaxationOptions([],tokenize('旅遊'),filters)),[]);
});
test('empty multi-word search offers only real shorter queries while preserving facets',()=>{
 const filters={scenario:'生活',kind:'case'};
 const original=JSON.stringify(filters);
 assert.deepEqual(plain(queryRelaxationOptions(items,'旅遊 API',filters)),[{query:'旅遊',removed:'api',count:2}]);
 assert.deepEqual(plain(queryRelaxationOptions(items,'API 旅遊',filters)),[{query:'旅遊',removed:'api',count:2}]);
 assert.deepEqual(plain(queryRelaxationOptions(items,'旅遊,xyz987',filters)),[{query:'旅遊',removed:'xyz987',count:2}]);
 assert.deepEqual(plain(queryRelaxationOptions(items,'xyz987 ,',filters)),[]);
 assert.deepEqual(plain(queryRelaxationOptions(items,'旅遊 xyz', {...filters,scenario:'開發'})),[]);
 assert.deepEqual(plain(queryRelaxationOptions(items,'xyz987',filters)),[]);
 assert.equal(JSON.stringify(filters),original);
});
test('topic scope chips and relaxation retain the selected search semantics',()=>{
 const corpus=[
  {id:'UC-901',title:'整理文件',category:'旅遊',tags:[],search:'旅遊',scenario:'生活',tools:[],kind:'case'},
  {id:'UC-902',title:'整理文件',category:'行政',tags:[],search:'旅遊 作者署名',scenario:'生活',tools:[],kind:'case'}
 ];
 const filters={scope:'topic',scenario:'生活'};
 assert.match(activeConditions('旅遊',filters).find(x=>x.key==='scope').display,/主題.*分類.*標籤.*ID/);
 assert.deepEqual(plain(relaxationOptions(corpus.slice(1),tokenize('旅遊'),filters)),[{key:'scope',value:'topic',count:1}]);
 assert.equal(filterEntries(corpus,tokenize('旅遊'),filters).length,1);
 assert.equal(filterEntries(corpus,tokenize('旅遊'),{...filters,scope:''}).length,2);
});

// The empty state used to offer "只移除關鍵字「機票」 → 查看 1 筆" while searching
// 「機票」 alone finds 11. A word that carries more hits than the removal leaves
// behind replaces that removal; a removal that lands on the same search as an
// offered word is not repeated.
const libraryItem=(id,tags,markdown)=>({id,title:id,summary:'',kind:'case',scenario:'工作',category:'工作',tools:[],tags,markdown,search:(tags.join(' ')+' '+markdown).toLowerCase()});
test('a word that alone finds more cases replaces the removal that deletes it',()=>{
 const corpus=[
  ...Array.from({length:11},(_,index)=>libraryItem('UC-7'+index,['機票'],'機票')),
  libraryItem('UC-800',['比價'],'想讓 ai 幫我盯 比價'),
  ...Array.from({length:18},(_,index)=>libraryItem('UC-9'+index,['旅遊'],'旅遊'))
 ];
 const result=plain(queryRecoveryOptions(corpus,'想讓 AI 幫我盯機票價格',{}));
 assert.deepEqual(result.words,[{query:'機票',count:11}]);
 assert.deepEqual(result.removals,[],'dropping the word the library can search is not offered');
});
test('one next step per resulting search, and a removal survives when the rest is not a library word',()=>{
 const corpus=[
  {id:'UC-1',title:'alpha 一',summary:'',kind:'case',scenario:'工作',category:'工作',tools:[],tags:[],search:'alpha 一',markdown:''},
  {id:'UC-2',title:'alpha 二',summary:'',kind:'case',scenario:'工作',category:'工作',tools:[],tags:[],search:'alpha 二',markdown:''},
  {id:'UC-3',title:'旅遊 a',summary:'',kind:'case',scenario:'工作',category:'工作',tools:[],tags:['旅遊'],search:'旅遊',markdown:''},
  {id:'UC-4',title:'旅遊 b',summary:'',kind:'case',scenario:'工作',category:'工作',tools:[],tags:['旅遊'],search:'旅遊',markdown:''},
  ...Array.from({length:60},(_,index)=>libraryItem('UC-6'+index,['排班'],'排班'))
 ];
 assert.deepEqual(plain(queryRecoveryOptions(corpus,'alpha beta',{})),{words:[],removals:[{query:'alpha',removed:'beta',count:2}]});
 const mixed=plain(queryRecoveryOptions(corpus,'旅遊 xyz987',{}));
 assert.deepEqual(mixed.words.map(option=>option.query),['旅遊']);
 assert.deepEqual(mixed.removals,[],'the removal would land on the same search as the offered word');
});

test('a searchable Latin word is compared with the removal that deletes it',()=>{
 const corpus=[
  ...Array.from({length:6},(_,index)=>libraryItem('UC-7'+index,[],'invoice 發票')),
  ...Array.from({length:9},(_,index)=>libraryItem('UC-8'+index,[],'travel 旅遊')),
  ...Array.from({length:40},(_,index)=>libraryItem('UC-9'+index,[],'排班'))
 ];
 const result=plain(queryRecoveryOptions(corpus,'invoice travel',{}));
 assert.deepEqual(result.words,[{query:'travel',count:9}]);
 assert.deepEqual(result.removals,[],'the removal would land on the search already offered');
 assert.deepEqual(plain(queryRecoveryOptions(corpus,'invoice xyz987',{})),{words:[],removals:[{query:'invoice',removed:'xyz987',count:6}]});
});
