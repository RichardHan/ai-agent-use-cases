'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.SHARE_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0];
function setup(){
 let resolve,reject;const pending=new Promise((a,b)=>{resolve=a;reject=b;});
 const document={activeElement:null,getElementById:id=>nodes[id]};
 const nodes=Object.fromEntries(['query','kind','tool','category','proof','sort','overview-only','search-share-status','search-share-url','copy-search-link'].map(id=>[id,{id,value:'',checked:false,hidden:true,textContent:'',focus(){document.activeElement=this;},select(){this.selected=true;}}]));
 nodes.query.value='旅遊';document.activeElement=nodes['copy-search-link'];
 const context=vm.createContext({document,URL,URLSearchParams,location:{href:'https://example.org/ai-agent-use-cases/?token=private#other'},navigator:{clipboard:{writeText:url=>{context.copied=url;return pending;}}}});
 vm.runInContext(source+'\ndiscoveryReady=true;this.api={copySearchLink,clearSearchShare};',context);
 return {context,nodes,document,resolve,reject,...context.api};
}
test('delayed denial reveals the manual search URL without stealing a reader who moved focus',async()=>{
 const s=setup(),work=s.copySearchLink(),other={id:'source-guide-summary'};s.document.activeElement=other;s.reject(Error('denied'));await work;
 assert.equal(s.document.activeElement,other);assert.equal(s.nodes['search-share-url'].hidden,false);assert.equal(s.nodes['search-share-url'].selected,undefined);
 assert.equal(s.nodes['search-share-url'].value,'https://example.org/ai-agent-use-cases/?q=%E6%97%85%E9%81%8A#explore');
});
test('a reader still waiting at the copy trigger gets the selected manual fallback',async()=>{
 const s=setup(),work=s.copySearchLink();assert.match(s.nodes['search-share-status'].textContent,/正在複製/);s.reject(Error('denied'));await work;
 assert.equal(s.document.activeElement,s.nodes['search-share-url']);assert.equal(s.nodes['search-share-url'].selected,true);
});
test('changing search invalidates pending success and denial without restoring stale URLs or focus',async()=>{
 for(const success of [true,false]){const s=setup(),work=s.copySearchLink();s.clearSearchShare();const other={id:'query'};s.document.activeElement=other;if(success)s.resolve();else s.reject(Error('denied'));await work;
 assert.equal(s.document.activeElement,other);assert.equal(s.nodes['search-share-status'].textContent,'');assert.equal(s.nodes['search-share-url'].hidden,true);assert.equal(s.nodes['search-share-url'].value,'');}
});
test('successful copying keeps focus and announces completion without manual fallback',async()=>{
 const s=setup(),trigger=s.document.activeElement,work=s.copySearchLink();s.resolve();await work;assert.equal(s.document.activeElement,trigger);assert.match(s.nodes['search-share-status'].textContent,/已複製/);assert.equal(s.nodes['search-share-url'].hidden,true);
});
