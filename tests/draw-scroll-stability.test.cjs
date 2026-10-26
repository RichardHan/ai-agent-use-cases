'use strict';
// Regression: on phones, tapping「再抽一張」scrolled the page back to the stage top
// (the stage is taller than the viewport), so readers lost their place in the card.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
function setup({buttonTop=60,layoutShift=0,titleTop=null,titleHeight=60,ready=true}={}){
 const calls=[],state={scrollY:0,drawn:false};
 const top=base=>base+(state.drawn?layoutShift:0)-state.scrollY;
 const button={getBoundingClientRect:()=>({top:top(buttonTop),bottom:top(buttonTop)+56})};
 const titleBase=titleTop??buttonTop+160;
 const title={focus:o=>calls.push(['focus',o]),scrollIntoView:o=>calls.push(['title-scroll',o]),getBoundingClientRect:()=>({top:top(titleBase),bottom:top(titleBase)+titleHeight})};
 const stage={getBoundingClientRect:()=>({top:top(-300),bottom:top(1400)}),scrollIntoView:o=>calls.push(['stage-scroll',o])};
 const status={focus:o=>calls.push(['focus',o]),getBoundingClientRect:()=>({top:0,bottom:0}),scrollIntoView:o=>calls.push(['status-scroll',o])};
 const nodes={'draw-case':button,discover:stage,'drawn-case':{querySelector:()=>title},'draw-status':status};
 const window={innerHeight:844,scrollBy:o=>{calls.push(['scrollBy',o]);state.scrollY+=o.top;},matchMedia:()=>({matches:true})};
 const context=vm.createContext({document:{getElementById:id=>nodes[id]},window,state});
 vm.runInContext(source+`;discoveryReady=${ready};drawNext=()=>{state.drawn=true;};this.draw=drawFromButton;`,context);
 return {calls,state,button,draw:context.draw};
}
test('redrawing keeps the tapped button where it was instead of jumping to the stage top',()=>{
 const {calls,draw,button}=setup({buttonTop:60});const before=button.getBoundingClientRect().top;draw();
 assert.equal(button.getBoundingClientRect().top,before);
 assert(!calls.some(([n])=>n.endsWith('-scroll')),'must not call scrollIntoView on the stage or card');
 assert(calls.some(([n,o])=>n==='focus'&&o.preventScroll===true));
});
test('a layout shift during the swap is compensated instantly',()=>{
 const {calls,draw,button}=setup({buttonTop:60,layoutShift:40});const before=button.getBoundingClientRect().top;draw();
 assert.equal(button.getBoundingClientRect().top,before);
 assert(calls.some(([n,o])=>n==='scrollBy'&&o.behavior==='instant'));
});
test('a cut-off title scrolls down only, never back up above the button',()=>{
 const {calls,draw}=setup({buttonTop:600,titleTop:760,titleHeight:120});draw();
 const scrolls=calls.filter(([n])=>n==='scrollBy').map(([,o])=>o.top);
 assert(scrolls.length&&scrolls.every(v=>v>0));
});
