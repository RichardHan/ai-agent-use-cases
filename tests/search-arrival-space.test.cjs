'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture({bottom=1075,height=1000,open=true,focusedInside=false,hash='#explore'}={}){
 const calls=[],panel={open,contains:()=>focusedInside},nodes={
  'filter-options':panel,'explore':{getBoundingClientRect:()=>({top:24}),scrollIntoView:()=>calls.push('scroll-search')},
  'results-count':{getBoundingClientRect:()=>({bottom}),scrollIntoView:()=>calls.push('scroll-results'),focus:()=>calls.push('focus-results')},
  'search-title':{focus:()=>calls.push('focus-search')},'missing-case':{hidden:true}
 };
 const context=vm.createContext({URL,URLSearchParams,innerHeight:height,document:{activeElement:{},getElementById:id=>nodes[id]},location:{hash},Discovery:require('../assets/discovery.js')});
 vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.api={revealSearch,arrive(move,query){allowAutomaticArrival=move;finishArrival(new URLSearchParams(query===undefined?"q=旅遊&tool=Grok+Bot":query));}};',context);
 return {api:context.api,panel,calls};
}
test('received search collapses an overflowing disclosure without changing its focus destination',()=>{
 const f=fixture();f.api.arrive(true);assert.equal(f.panel.open,false);assert.deepEqual(f.calls,['scroll-search','focus-search']);
});
for(const [label,options] of [['fits exactly',{bottom:1000}],['tall viewport',{height:1600}],['already closed',{open:false}]])test('arrival preserves disclosure when '+label,()=>{
 const f=fixture(options);f.api.arrive(true);assert.equal(f.panel.open,options.open??true);
});
test('a plain landing compacts an off-screen result line and leaves a visible one alone',()=>{
 const overflowing=fixture({bottom:1075,height:1000,hash:''});overflowing.api.arrive(true,'');
 assert.equal(overflowing.panel.open,false,'a panel that hides every result must start compact');
 assert.deepEqual(overflowing.calls,[],'a plain landing must not move focus or scroll the reader');
 const visible=fixture({bottom:900,height:1000,hash:''});visible.api.arrive(true,'');
 assert.equal(visible.panel.open,true,'a result line already on screen keeps the facets open');
});
test('a drawable pool that still contains the drawn case keeps that card',()=>{
 const nodes={
   'filter-options':{open:false,contains:()=>false},'draw-case':{disabled:false,textContent:''},
   'drawn-case':{replaceChildren:()=>{throw Error('must not redraw a still-matching card');}},
   'draw-status':{textContent:''},'scenario':{value:'工作'},'difficulty':{value:'入門對話'},
   'results-count':{getBoundingClientRect:()=>({bottom:0})},'explore':{getBoundingClientRect:()=>({top:0})}
 };
 const context=vm.createContext({document:{activeElement:{},getElementById:id=>nodes[id],querySelectorAll:()=>[]},window:{matchMedia:()=>({matches:false}),innerHeight:900},Discovery:require('../assets/discovery.js'),entries:[],innerHeight:900});
 const kept={id:'UC-1',title:'kept',kind:'case'};
 vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+`;this.api={setDrawn(id){drawnItemId=id;},sync(list){discoveryReady=true;discoveryKey='different';syncDiscovery(list);}};`,context);
 context.api.setDrawn('UC-1');
 context.api.sync([kept,{id:'UC-2',title:'other',kind:'case'}]);
 assert.match(nodes['draw-status'].textContent,/目前顯示：kept/,'the status must report the kept card instead of a new draw');
 assert.equal(nodes['draw-case'].textContent,'再抽一張 ↻');
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
