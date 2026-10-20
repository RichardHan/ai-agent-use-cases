'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0];
function setup(ready=true){
 const calls=[],target={focus:o=>calls.push(['focus',o]),scrollIntoView:o=>calls.push(['scroll',o])};
 const context=vm.createContext({URL,location:{href:'https://example.test/ai-agent-use-cases/?q=旅遊&tool=Grok&sort=reviewed#old'},requestAnimationFrame:()=>{},document:{addEventListener(){},removeEventListener(){},getElementById:id=>{assert.equal(id,'results-count');return target;}},history:{state:{preserve:1},replaceState:(state,title,url)=>calls.push(['history',state,url.href])}});
 vm.runInContext(source+`\ndiscoveryReady=${ready};this.submit=typeof submitSearch==='function'?submitSearch:null;this.arrival=()=>allowAutomaticArrival;this.compose=value=>{searchComposing=value;};`,context);
 assert.equal(typeof context.submit,'function');return {context,calls};
}
test('explicit submission preserves URL filters and history, reveals results and moves keyboard focus',()=>{
 const {context,calls}=setup();let prevented=false;
 context.submit({preventDefault(){prevented=true;},isComposing:false});assert(prevented);assert.equal(context.arrival(),false);
 assert.equal(calls[0][0],'history');assert.equal(calls[0][1].preserve,1);const url=new URL(calls[0][2]);assert.equal(url.searchParams.get('q'),'旅遊');assert.equal(url.searchParams.get('tool'),'Grok');assert.equal(url.searchParams.get('sort'),'reviewed');assert.equal(url.pathname,'/ai-agent-use-cases/');assert.equal(url.hash,'#explore');
 assert.equal(calls[1][0],'focus');assert.equal(calls[1][1].preventScroll,true);assert.equal(calls[2][0],'scroll');assert.equal(calls[2][1].behavior,'instant');assert.equal(calls[2][1].block,'start');
});
test('submission while loading or composing does not steal focus or schedule delayed arrival',()=>{
 for(const [ready,composing] of [[false,false],[true,true]]){
  const {context,calls}=setup(ready);let prevented=false;context.submit({preventDefault(){prevented=true;},isComposing:composing});assert(prevented);assert.deepEqual(calls,[]);assert.equal(context.arrival(),true);
 }
});
test('search action remains outside the collapsible filters and is initially unavailable',()=>{
 const html=fs.readFileSync('index.html','utf8');assert.match(html,/<\/details>[\s\S]*?<button[^>]+id="search-submit"[^>]+type="submit"[^>]+disabled/);
 assert.match(fs.readFileSync('assets/app.js','utf8'),/\$\('filters'\)\.addEventListener\('submit', submitSearch\)/);
});

test('composition state also guards native SubmitEvent without isComposing',()=>{
 const {context,calls}=setup();context.compose(true);context.submit({preventDefault(){}});assert.deepEqual(calls,[]);context.compose(false);context.submit({preventDefault(){}});assert.equal(calls.length,3);
});

test('result settling is bounded and yields to new interaction, URL, focus or dialog changes',()=>{
 for(const interrupt of ['none','pointer','url','focus','dialog']){
  const frames=[],listeners=new Map(),scrolls=[];const location={href:'https://example.test/?q=travel#explore'},dialog={open:false};
  const document={activeElement:null,getElementById:id=>id==='detail'?dialog:target,addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type)};
  const target={focus(){document.activeElement=this;},scrollIntoView:options=>scrolls.push(options.block),getBoundingClientRect:()=>({top:1000,bottom:1030})};
  const context=vm.createContext({document,location,innerHeight:844,requestAnimationFrame:fn=>frames.push(fn)});vm.runInContext(source+'\nthis.settle=focusLoadedResults;',context);context.settle('start');assert.deepEqual(scrolls,['start']);
  if(interrupt==='pointer')listeners.get('pointerdown')();if(interrupt==='url')location.href+='changed';if(interrupt==='focus')document.activeElement={};if(interrupt==='dialog')dialog.open=true;
  let count=0;while(frames.length){frames.shift()();assert(++count<=2,'no unbounded scroll loop');}
  assert.deepEqual(scrolls,interrupt==='none'?['start','start','start']:['start']);assert.equal(listeners.size,0);
 }
});
