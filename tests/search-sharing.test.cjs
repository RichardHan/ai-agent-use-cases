'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const nodes={};let context;
 for(const id of ['search-share-status','search-share-url','copy-search-link','query','kind','tool','category','proof','sort','detail','overview-only'])nodes[id]={id,value:'',checked:false,hidden:true,textContent:'',open:false,focus(){context.document.activeElement=this;},select(){this.selected=true;}};
 nodes.query.value='旅遊';nodes.tool.value='Grok Bot';nodes.sort.value='reviewed';nodes['search-share-url'].hidden=true;
 context=vm.createContext({URL,URLSearchParams,location:{href:'https://example.org/ai-agent-use-cases/?case=UC-001&secret=synthetic#other'},document:{getElementById:id=>nodes[id],activeElement:nodes['copy-search-link']},navigator:{clipboard:{writeText:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}}});
 const pending=[];
 vm.runInContext(fs.readFileSync(process.env.SHARE_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\ndiscoveryReady=true;activeScenario="生活";this.api={copySearchLink,clearSearchShare};',context);
 return {nodes,context,pending,...context.api};
}
test('search sharing announces pending, then success with only supported search conditions',async()=>{
 const f=fixture(),p=f.copySearchLink();assert.equal(f.nodes['search-share-status'].textContent,'正在複製搜尋連結…');
 f.pending[0].resolve();await p;assert.match(f.nodes['search-share-status'].textContent,/已複製/);assert.equal(f.nodes['search-share-url'].hidden,true);
});
test('delayed denied clipboard preserves a reader who moved to another control',async()=>{
 const f=fixture(),p=f.copySearchLink();f.context.document.activeElement=f.nodes.query;f.pending[0].reject(Error('denied'));await p;
 assert.equal(f.context.document.activeElement,f.nodes.query);assert.equal(f.nodes['search-share-url'].hidden,false);assert.equal(f.nodes['search-share-url'].selected,undefined);
 const url=new URL(f.nodes['search-share-url'].value);assert.equal(url.pathname,'/ai-agent-use-cases/');assert.equal(url.searchParams.get('q'),'旅遊');assert.equal(url.searchParams.get('scenario'),'生活');assert.equal(url.searchParams.get('tool'),'Grok Bot');assert.equal(url.searchParams.get('sort'),'reviewed');assert.equal(url.searchParams.has('case'),false);assert.equal(url.searchParams.has('secret'),false);assert.equal(url.hash,'#explore');
});
test('denied or missing clipboard focuses and selects fallback when the requester still has focus',async()=>{
 for(const missing of [false,true]){const f=fixture();if(missing)f.context.navigator.clipboard=undefined;const p=f.copySearchLink();if(!missing)f.pending[0].reject(Error('denied'));await p;assert.equal(f.context.document.activeElement,f.nodes['search-share-url']);assert.equal(f.nodes['search-share-url'].selected,true);}
});
test('superseded and cleared requests cannot replace the newest feedback or fallback',async()=>{
 const f=fixture(),first=f.copySearchLink(),second=f.copySearchLink();f.pending[1].resolve();await second;f.pending[0].reject(Error('old denied'));await first;assert.match(f.nodes['search-share-status'].textContent,/已複製/);assert.equal(f.nodes['search-share-url'].hidden,true);
 const third=f.copySearchLink();f.clearSearchShare();f.pending[2].reject(Error('cleared'));await third;assert.equal(f.nodes['search-share-status'].textContent,'');assert.equal(f.nodes['search-share-url'].value,'');assert.equal(f.nodes['search-share-url'].hidden,true);
});

test('late success after changed search cannot announce that obsolete conditions were copied',async()=>{
 const f=fixture(),p=f.copySearchLink();f.clearSearchShare();f.nodes.query.value='新的問題';f.pending[0].resolve();await p;assert.equal(f.nodes['search-share-status'].textContent,'');assert.equal(f.nodes['search-share-url'].hidden,true);
});
