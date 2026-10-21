'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(process.env.TASK_SOURCE||path.join(__dirname,'../assets/app.js'),'utf8');
// Run the real delegated click listener; DOM rendering is verified in cloud browsers.
const listener=source.slice(source.indexOf("$('scenario-chips')?.addEventListener('click'"),source.indexOf("$('detail').addEventListener('cancel'"));
function setup(kind=''){
 const fields=Object.fromEntries(Object.entries({query:'晨報',kind,tool:'ChatGPT dots',category:'檢核',proof:'作者報告／示範',sort:'reviewed'}).map(([id,value])=>[id,{value}]));
 let click,renders=0;
 const context=vm.createContext({$:id=>id==='scenario-chips'?{addEventListener:(type,fn)=>{click=fn;}}:fields[id],render:()=>renders++,activeScenario:'工作'});
 vm.runInContext(listener,context);
 return {fields,context,click:dataset=>click({target:{closest:()=>({dataset})}}),renders:()=>renders};
}
test('experience entry applies the explicit status without replacing a task or other facets',()=>{
 for(const initial of ['', 'case', 'pending']){
  const x=setup(initial),before=JSON.stringify({...x.fields,kind:undefined});
  x.click({kind:'evidence'});assert.equal(x.fields.kind.value,'evidence');assert.equal(JSON.stringify({...x.fields,kind:undefined}),before);assert.equal(x.context.activeScenario,'工作');assert.equal(x.renders(),1);
 }
});
test('second click removes only the experience status, including under an empty intersection',()=>{
 const x=setup('evidence');x.fields.query.value='no-such-task';x.click({kind:'evidence'});
 assert.equal(x.fields.kind.value,'');assert.equal(x.fields.query.value,'no-such-task');assert.equal(x.fields.sort.value,'reviewed');assert.equal(x.context.activeScenario,'工作');assert.equal(x.renders(),1);
});
test('existing query and scenario entries retain their independent toggle behavior',()=>{
 const x=setup('pending');x.click({query:'收件匣'});assert.equal(x.fields.query.value,'收件匣');assert.equal(x.fields.kind.value,'pending');x.click({query:'收件匣'});assert.equal(x.fields.query.value,'');x.click({scenario:'工作'});assert.equal(x.context.activeScenario,'');assert.equal(x.fields.kind.value,'pending');
});
