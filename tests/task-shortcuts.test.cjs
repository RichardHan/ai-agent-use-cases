'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.SHORTCUT_SOURCE||'assets/app.js','utf8');
const listener=source.slice(source.indexOf("$('scenario-chips')?.addEventListener('click'"),source.indexOf("$('detail').addEventListener('cancel'"));
function setup(ready=true){
 const calls=[],fields=Object.fromEntries(Object.entries({query:'原本關鍵字',kind:'case',tool:'Grok Bot',category:'旅遊',proof:'作者報告／示範',sort:'reviewed'}).map(([id,value])=>[id,{value}]));let click;
 const context=vm.createContext({$:id=>id==='scenario-chips'?{addEventListener:(_,fn)=>click=fn}:fields[id],render:()=>calls.push('render'),focusLoadedResults:block=>calls.push('results:'+block),discoveryReady:ready,allowAutomaticArrival:true,activeScenario:'生活'});
 vm.runInContext(listener,context);
 return {fields,calls,context,click:dataset=>click({target:{closest:()=>({dataset})}})};
}
test('each task shortcut applies only its query and hands off to visible results after render',()=>{
 for(const query of ['每日','收件匣','比價','排程']){
  const x=setup(),before=JSON.stringify({...x.fields,query:undefined});x.click({query});
  assert.equal(x.fields.query.value,query);assert.equal(JSON.stringify({...x.fields,query:undefined}),before);assert.equal(x.context.activeScenario,'生活');
  assert.deepEqual(x.calls,['render','results:start']);assert.equal(x.context.allowAutomaticArrival,false);
 }
});
test('second activation clears the task and still hands off, including an empty intersection',()=>{
 const x=setup();x.fields.query.value=' 比價 ';x.fields.kind.value='pending';x.click({query:'比價'});
 assert.equal(x.fields.query.value,'');assert.equal(x.fields.kind.value,'pending');assert.deepEqual(x.calls,['render','results:start']);
});
test('loading or failed corpus preserves task intent without a late focus handoff',()=>{
 const x=setup(false);x.click({query:'排程'});assert.equal(x.fields.query.value,'排程');assert.deepEqual(x.calls,['render']);assert.equal(x.context.allowAutomaticArrival,false);
 x.context.discoveryReady=true;assert.deepEqual(x.calls,['render']);
});
