'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.RECOVERY_SOURCE||require('node:path').join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({});vm.runInContext(source+'\nthis.api={combinedRelaxationOptions,relaxationOptions,tokenize,filterEntries};',context);
const {combinedRelaxationOptions:options,tokenize,filterEntries}=context.api;
const plain=x=>JSON.parse(JSON.stringify(x));
const items=[
 {search:'旅遊 travel',scenario:'生活',kind:'case',tools:['Grok Bot'],category:'旅遊',proof:'作者報告／示範'},
 {search:'旅遊 travel',scenario:'生活',kind:'case',tools:['Meta Muse'],category:'旅遊',proof:'官方自報'},
 {search:'開發 code',scenario:'開發',kind:'pending',tools:['Grok Bot'],category:'開發',proof:'尚待查證'}
];
test('two conflicting facets recover real query matches while retaining the other facets',()=>{
 const terms=tokenize('travel'),filters={scenario:'開發',kind:'pending',tool:'Grok Bot',category:'旅遊'};
 const before=JSON.stringify(filters),result=plain(options(items,terms,filters));
 assert.deepEqual(result,[{conditions:[{key:'scenario',value:'開發'},{key:'kind',value:'pending'}],count:1}]);
 assert.equal(JSON.stringify(filters),before);
 const remaining={...filters};for(const {key} of result[0].conditions)remaining[key]='';
 assert.equal(filterEntries(items,terms,remaining).length,result[0].count);
});
test('never replace an existing result or a single-facet recovery, and never weaken the query',()=>{
 assert.deepEqual(plain(options(items,tokenize('travel'),{scenario:'生活'})),[]);
 assert.deepEqual(plain(options(items,tokenize('travel'),{scenario:'開發'})),[]);
 assert.deepEqual(plain(options(items,tokenize('unknown-987'),{scenario:'開發',kind:'pending'})),[]);
 assert.deepEqual(plain(options([],[],{scenario:'開發',kind:'pending'})),[]);
});
test('offer only the smallest removals and report all matching loaded entries',()=>{
 const filters={scenario:'開發',kind:'pending',proof:'尚待查證'};
 assert.deepEqual(plain(options(items,tokenize('旅遊'),filters)),[{conditions:[{key:'scenario',value:'開發'},{key:'kind',value:'pending'},{key:'proof',value:'尚待查證'}],count:2}]);
 assert.deepEqual(plain(options(items.slice(0,1),tokenize('旅遊'),filters))[0].count,1);
});
test('multiple alternatives stay independent, ignore empty values and use the normal multi-tool matching',()=>{
 const corpus=[...items,{...items[0],scenario:'開發',kind:'case',tools:['Grok Bot','Meta Muse'],proof:'尚待查證'}];
 const filters={scenario:'開發',kind:'pending',proof:'官方自報',tool:'Meta Muse',category:''};
 const result=plain(options(corpus,tokenize('旅遊'),filters));
 assert.equal(result.length,2);assert(result.every(x=>x.conditions.length===2));
 for(const option of result){const retained={...filters};for(const {key} of option.conditions)retained[key]='';assert.equal(option.count,filterEntries(corpus,tokenize('旅遊'),retained).length);}
 assert.deepEqual(plain(options(corpus,[],{})),[]);
});

test('five conflicting facets recover without mutating any supplied data',()=>{
 const corpus=JSON.parse(JSON.stringify(items));corpus.forEach(x=>{Object.freeze(x.tools);Object.freeze(x);});Object.freeze(corpus);
 const terms=Object.freeze(Array.from(tokenize('travel'))),filters=Object.freeze({scenario:'unknown',kind:'unknown',tool:'unknown',category:'unknown',proof:'unknown'});
 const result=plain(options(corpus,terms,filters));assert.equal(result.length,1);assert.equal(result[0].conditions.length,5);assert.equal(result[0].count,2);
});
