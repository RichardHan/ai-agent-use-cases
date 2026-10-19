'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const calls=[],state={marker:'retain'},query={value:'旅遊',focus:options=>calls.push(['focus',options])};
 const location={href:'https://example.test/ai-agent-use-cases/?q=旅遊&scenario=生活#old'};
 const controls={query,explore:{scrollIntoView:options=>calls.push(['scroll',options])}};
 const context=vm.createContext({URL,location,document:{getElementById:id=>controls[id]},history:{state,replaceState:(saved,title,url)=>calls.push(['history',saved,url.href])}});
 vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.enter=typeof enterSearch===\'function\'?enterSearch:null;this.arrival=()=>allowAutomaticArrival;',context);
 assert.equal(typeof context.enter,'function','dynamic result links must share the search handoff');
 return {context,calls,state,query};
}
test('result return preserves filters and history state, focuses search, and cancels late arrival',()=>{
 const {context,calls,state,query}=setup();let prevented=false;
 context.enter({button:0,preventDefault(){prevented=true;}});
 assert(prevented);assert.equal(context.arrival(),false);assert.equal(query.value,'旅遊');
 assert.equal(calls[0][0],'history');assert.equal(calls[0][1],state);const url=new URL(calls[0][2]);assert.equal(url.pathname,'/ai-agent-use-cases/');assert.equal(url.searchParams.get('scenario'),'生活');assert.equal(url.searchParams.get('q'),'旅遊');assert.equal(url.hash,'#explore');
 assert.equal(calls[1][0],'scroll');assert.equal(calls[1][1].behavior,'instant');assert.equal(calls[2][0],'focus');assert.equal(calls[2][1].preventScroll,true);
});
test('modified, middle and cancelled result links retain their native behavior',()=>{
 for(const flags of [{metaKey:true},{ctrlKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}]){
  const {context,calls}=setup();context.enter({button:0,...flags,preventDefault(){throw Error('must preserve native link');}});assert.deepEqual(calls,[]);assert.equal(context.arrival(),true);
 }
});
test('source recovery keeps an active return route near its original result position, including a changed tail',()=>{
 for(const [oldPosition,newPositions,expected] of [[6,[6,7],6],[356,[6,354,357],357],[5,[6],6],[7,[6,12],12],[5,[],null]]){
  const calls=[],active={dataset:{resultsReturn:String(oldPosition)},isConnected:false,parentElement:{},closest:()=>null};
  const links=newPositions.map(position=>({dataset:{resultsReturn:String(position)},focus(){calls.push(position);},scrollIntoView(){}}));
  const context=vm.createContext({document:{activeElement:active,body:{},getElementById:id=>id==='results'?{querySelectorAll:()=>links}:{focus(){calls.push(null);},scrollIntoView(){}}}});
  vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.preserve=preserveRecoveryFocus;',context);
  context.preserve()();assert.deepEqual(calls,[expected]);
 }
});
