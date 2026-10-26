'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({});
vm.runInContext(source+'\nthis.api={activeConditions,relaxationOptions,queryRelaxationOptions,filterEntries,tokenize};',context);
const {activeConditions,relaxationOptions,queryRelaxationOptions,filterEntries,tokenize}=context.api;
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
 assert.equal(conditions.find(x=>x.key==='kind').display,'還在查證');
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
