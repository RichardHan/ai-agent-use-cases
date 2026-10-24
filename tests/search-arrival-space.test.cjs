'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture({bottom=1075,height=1000,open=true,focusedInside=false}={}){
 const calls=[],panel={open,contains:()=>focusedInside},nodes={
  'filter-options':panel,'explore':{getBoundingClientRect:()=>({top:24}),scrollIntoView:()=>calls.push('scroll-search')},
  'results-count':{getBoundingClientRect:()=>({bottom}),scrollIntoView:()=>calls.push('scroll-results'),focus:()=>calls.push('focus-results')},
  'search-title':{focus:()=>calls.push('focus-search')},'missing-case':{hidden:true}
 };
 const context=vm.createContext({URL,URLSearchParams,innerHeight:height,document:{activeElement:{},getElementById:id=>nodes[id]},location:{hash:'#explore'},Discovery:require('../assets/discovery.js')});
 vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.api={revealSearch,arrive(move){allowAutomaticArrival=move;finishArrival(new URLSearchParams("q=旅遊&tool=Grok+Bot"));}};',context);
 return {api:context.api,panel,calls};
}
test('received search collapses an overflowing disclosure without changing its focus destination',()=>{
 const f=fixture();f.api.arrive(true);assert.equal(f.panel.open,false);assert.deepEqual(f.calls,['scroll-search','focus-search']);
});
for(const [label,options] of [['fits exactly',{bottom:1000}],['tall viewport',{height:1600}],['already closed',{open:false}]])test('arrival preserves disclosure when '+label,()=>{
 const f=fixture(options);f.api.arrive(true);assert.equal(f.panel.open,options.open??true);
});
test('reader return never changes an open disclosure',()=>{
 const f=fixture();f.api.revealSearch(true);assert.equal(f.panel.open,true);assert.deepEqual(f.calls,['scroll-results','focus-results']);
});
test('interaction during loading prevents late disclosure changes and focus movement',()=>{
 const f=fixture();f.api.arrive(false);assert.equal(f.panel.open,true);assert.deepEqual(f.calls,[]);
});
test('an already focused filter is never hidden by automatic compaction',()=>{
 const f=fixture({focusedInside:true});f.api.arrive(true);assert.equal(f.panel.open,true);
});
