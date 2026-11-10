'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture({bottom=1075,height=1000,open=true,focusedInside=false,hash='#explore',cardTop=400,emptyTop=400,countTop=24}={}){
 // Give the fixture real scroll geometry: scrubbing `shift` on each scroll makes
 // the follow-up visibility check see what a browser would see.
 let shift=0, panel={open,contains:()=>focusedInside};
 const calls=[];
 const moved=top=>top-shift;
 const nodes={
  'filter-options':panel,'explore':{getBoundingClientRect:()=>({top:24}),scrollIntoView:()=>calls.push('scroll-search')},
  'results-count':{
   getBoundingClientRect:()=>({top:moved(countTop),bottom:moved(bottom)}),
   scrollIntoView:()=>{shift=countTop-24;calls.push('scroll-results');},
   focus:()=>calls.push('focus-results')
  },
  'search-title':{focus:()=>calls.push('focus-search')},'missing-case':{hidden:true},
  'edit-query':{focus:()=>calls.push('focus-edit')}
 };
 // A hidden block reports 0,0 in a browser.
 const rect=top=>top===null?{top:0,bottom:0}:{top:moved(top),bottom:moved(top+40)};
 const empty=emptyTop===null?null:{getBoundingClientRect:()=>rect(emptyTop)};
 const hint=emptyTop===null?null:{getBoundingClientRect:()=>rect(emptyTop+50)};
 const title={getBoundingClientRect:()=>rect(cardTop),scrollIntoView:()=>{shift=cardTop-24;calls.push('scroll-line');}};
 const card=cardTop===null?null:{getBoundingClientRect:()=>rect(cardTop),querySelector:selector=>selector==='h3'?title:null};
 const control={focus:()=>calls.push('focus-control')};
 nodes['empty-hint']=hint;
 const context=vm.createContext({URL,URLSearchParams,innerHeight:height,document:{activeElement:{},getElementById:id=>nodes[id],querySelector:selector=>{
  if(selector==='#results .card')return card;
  if(selector==='#empty h3')return empty;
  if(selector==='#results .card h3 button')return control;
  return null;
 }},location:{hash},Discovery:require('../assets/discovery.js')});
 vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.api={revealSearch,arrive(move,query){allowAutomaticArrival=move;finishArrival(new URLSearchParams(query===undefined?"q=旅遊&tool=Grok+Bot":query));},arriveReady(move,query){allowAutomaticArrival=move;discoveryReady=true;finishArrival(new URLSearchParams(query===undefined?"q=旅遊&tool=Grok+Bot":query));}};',context);
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

// Measured on the published site (2026-11-10, 390×844): a task entry lands on
// #explore with the result line at y=563 and the first card at y=852, so the
// reader sees a count and no case. The old check only asked for the result line.
test('arrival brings the first case on screen when only the result line fits',()=>{
 const f=fixture({countTop:563,bottom:586,height:844,cardTop:852});
 f.api.arriveReady(true);
 assert.deepEqual(f.calls,['scroll-search','focus-search','scroll-results','focus-results'],'the first case, not the count, decides');
});
test('arrival leaves a shared search alone when a case is already readable',()=>{
 const f=fixture({countTop:563,bottom:586,height:844,cardTop:313});
 f.api.arriveReady(true);
 assert.deepEqual(f.calls,['scroll-search','focus-search'],'a visible first case keeps the arriving reader where they are');
});
test('arrival brings the empty state on screen when no case matches',()=>{
 const f=fixture({countTop:563,bottom:586,height:844,cardTop:null,emptyTop:900});
 f.api.arriveReady(true);
 assert.deepEqual(f.calls,['scroll-search','focus-search','scroll-results','focus-results']);
 const visible=fixture({countTop:563,bottom:586,height:844,cardTop:null,emptyTop:700});
 visible.api.arriveReady(true);
 assert.deepEqual(visible.calls,['scroll-search','focus-search'],'an empty state already on screen is not moved');
});
// Measured on the published site (390×844): the empty heading ends at y=838,
// inside the viewport, while the line that says what to try instead starts at
// y=850. A heading alone does not tell the reader what to do next.
test('arrival moves an empty state whose next-step line is below the fold',()=>{
 const f=fixture({countTop:563,bottom:586,height:844,cardTop:null,emptyTop:805});
 f.api.arriveReady(true);
 assert.deepEqual(f.calls,['scroll-search','focus-search','scroll-results','focus-results'],'the empty hint, not just its heading, has to be readable');
});

// A hidden #empty reports a 0,0 rect, which must not read as "the reader can see it".
test('arrival does not treat a hidden empty state as readable',()=>{
 const f=fixture({countTop:563,bottom:586,height:844,cardTop:null,emptyTop:null});
 f.api.arriveReady(true);
 assert.deepEqual(f.calls,['scroll-search','focus-search','scroll-results','focus-results']);
});

// A landscape phone cannot show the result line and the first case together
// (390px tall: the line fits, the title ends at 401). The case wins and focus
// moves to its read button so it never sits off screen.
test('a viewport too short for both places the case and keeps focus visible',()=>{
 const f=fixture({countTop:24,bottom:47,height:320,cardTop:340});
 f.api.arriveReady(true);
 assert.deepEqual(f.calls,['scroll-search','focus-search','scroll-results','focus-results','scroll-line','focus-control']);
});
