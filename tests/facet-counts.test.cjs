'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.FACET_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({});
vm.runInContext(source+'\nthis.api={facetCounts,tokenize};',context);
const {facetCounts,tokenize}=context.api;
const plain=x=>JSON.parse(JSON.stringify(x));
const items=[
 {search:'旅遊 travel',scenario:'生活',kind:'case',tools:['Grok Bot','Grok Bot','GitHub'],category:'旅行',proof:'作者自述'},
 {search:'旅遊 travel',scenario:'生活',kind:'pending',tools:['Grok Bot'],category:'旅行',proof:'待查'},
 {search:'開發 code',scenario:'開發',kind:'case',tools:['GitHub'],category:'開發',proof:'官方'}
];
test('facet alternatives ignore only their own current selection and retain query and all other filters',()=>{
 const filters={scenario:'開發',kind:'case',tool:'Grok Bot',category:'旅行',proof:'作者自述'};
 const before=JSON.stringify({items,filters});
 assert.deepEqual(plain(facetCounts(items,tokenize('ＴＲＡＶＥＬ'),filters,'scenario',['','生活','開發'])),[1,1,0]);
 assert.deepEqual(plain(facetCounts(items,tokenize('旅遊'),{scenario:'生活',kind:'pending'},'kind',['','case','pending','evidence'])),[2,1,1,0]);
 assert.equal(JSON.stringify({items,filters}),before);
});
test('tool membership, all-option and missing values count real entries exactly once',()=>{
 assert.deepEqual(plain(facetCounts(items,[],{},'tool',['','Grok Bot','GitHub','未知'])),[3,2,2,0]);
 assert.deepEqual(plain(facetCounts(items,[],{tool:'Grok Bot'},'proof',['','作者自述','待查','官方'])),[2,1,1,0]);
 assert.deepEqual(plain(facetCounts(items,[],{tool:'不存在'},'tool',['','GitHub','不存在'])),[3,2,0]);
});
test('empty query results, empty corpus and partial corpus do not invent available entries',()=>{
 assert.deepEqual(plain(facetCounts(items,tokenize('no-match-987'),{},'scenario',['','生活'])),[0,0]);
 assert.deepEqual(plain(facetCounts([],[],{},'category',['','旅行'])),[0,0]);
 assert.deepEqual(plain(facetCounts(items.slice(0,1),[],{},'kind',['','case','pending'])),[1,1,0]);
});

test('synonym-expanded counts use the same search semantics as result filtering',()=>{
 const travel=[{...items[0],search:'旅行 itinerary'}];
 assert.deepEqual(plain(facetCounts(travel,tokenize('旅遊'),{},'scenario',['','生活','開發'])),[1,1,0]);
});
