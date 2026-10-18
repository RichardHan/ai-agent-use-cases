'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
function setup(){
 const calls=[],controls=Object.fromEntries(['query','kind','tool','category','proof'].map(id=>[id,{value:id==='query'?'旅遊':id+'-retained'}]));
 controls['results-count']={focus(){calls.push('focus');},scrollIntoView(options){calls.push(options);}};
 const context=vm.createContext({document:{getElementById:id=>controls[id]}});
 vm.runInContext(source+'\nrender=()=>recordRender();activeScenario="生活";this.refine=typeof refineFromCard==="function"?refineFromCard:null;this.scenario=()=>activeScenario;',context);
 context.recordRender=()=>calls.push('render');
 assert.equal(typeof context.refine,'function','card refinement must hand off to the updated results');
 return {context,controls,calls};
}
test('tag exploration replaces only the query, preserving every active facet',()=>{
 const {context,controls,calls}=setup();context.refine('query','長文字 <script> 保留原樣');
 assert.equal(controls.query.value,'長文字 <script> 保留原樣');assert.equal(context.scenario(),'生活');
 for(const id of ['kind','tool','category','proof'])assert.equal(controls[id].value,id+'-retained');
 assert.equal(calls[0],'render');assert(calls.includes('focus'));assert(calls.some(c=>c?.behavior==='instant'));
});
test('scenario toggles off and on without throwing away the task or other facets',()=>{
 const {context,controls}=setup();context.refine('scenario','生活');assert.equal(context.scenario(),'');
 context.refine('scenario','開發');assert.equal(context.scenario(),'開發');assert.equal(controls.query.value,'旅遊');
 assert.equal(controls.proof.value,'proof-retained');
});
test('unrecognized card action cannot mutate controls or move the reader',()=>{
 const {context,controls,calls}=setup();context.refine('proof','injected');
 assert.equal(controls.proof.value,'proof-retained');assert.deepEqual(calls,[]);
});
