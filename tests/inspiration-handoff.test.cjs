'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(process.env.INSPIRATION_SOURCE||path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
function setup({ready=true,hasCard=true,mobile=true,visible=false,long=false}={}){
 const calls=[],targetRect=()=>({top:long?500:180,bottom:long?1600:240}),targetScroll=options=>calls.push(['target-scroll',options]);
 const title={focus:options=>calls.push(['title',options]),getBoundingClientRect:targetRect,scrollIntoView:targetScroll},status={focus:options=>calls.push(['status',options]),getBoundingClientRect:targetRect,scrollIntoView:targetScroll};
 const stage={getBoundingClientRect:()=>({top:visible?40:-200,bottom:visible?700:1000}),scrollIntoView:options=>calls.push(['scroll',options])};
 const nodes={discover:stage,'drawn-case':{querySelector:()=>hasCard?title:null},'draw-status':status};
 const context=vm.createContext({document:{getElementById:id=>nodes[id]},window:{innerHeight:900,matchMedia:()=>({matches:mobile})}});
 vm.runInContext(source+`;discoveryReady=${ready};this.handoff=revealDiscovery;`,context);
 return {calls,handoff:context.handoff,status};
}
test('explicit mobile inspiration handoff focuses the new readable card, with bounded instant scrolling',()=>{
 const {calls,handoff}=setup();handoff();
 assert(calls.some(([target])=>target==='title'),'focus must follow the visible new card');
 assert(calls.some(([target,options])=>target==='scroll'&&options.behavior==='instant'));
 assert(calls.some(([target,options])=>target==='title'&&options.preventScroll===true));
});
test('desktop inspiration handoff also reaches the card without scrolling an already visible stage',()=>{
 const {calls,handoff}=setup({mobile:false,visible:true});handoff();
 assert.deepEqual(calls.map(c=>c[0]),['title']);
});
test('empty deck focuses its explanation instead of a disabled draw button',()=>{
 const {calls,handoff,status}=setup({hasCard:false});handoff();
 assert(calls.some(([target])=>target==='status'));assert.equal(status.tabIndex,-1);
});
test('loading or failure never moves focus or schedules a late handoff',()=>{
 const {calls,handoff}=setup({ready:false});handoff();assert.deepEqual(calls,[]);
});

test('long original titles bring the focus target into view even after a tall status',()=>{
 const {calls,handoff}=setup({long:true});handoff();
 assert(calls.some(([target,options])=>target==='target-scroll'&&options.block==='start'&&options.behavior==='instant'));
});
