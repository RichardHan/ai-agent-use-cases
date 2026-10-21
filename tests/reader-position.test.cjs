'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(process.env.POSITION_SOURCE||path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const items=['UC-001','UC-002','UC-003'].map(id=>({id,title:id+' 案例'}));
function run(current,list,{ready=true,failed=[]}={}) {
 const controls=Object.fromEntries(['nav-prev-case','nav-next-case','detail-result-context'].map(id=>[id,{textContent:'',setAttribute(name,value){this[name]=value;}}]));
 const context=vm.createContext({document:{getElementById:id=>controls[id]},current,list,ready,failed});
 vm.runInContext(source+'\ncurrentDetailItem=current;currentFiltered=list;discoveryReady=ready;failedPaths=failed;updateModalNav();',context);
 return controls;
}
test('visible reader position follows the current result order and preserves navigation boundaries',()=>{
 for(let i=0;i<3;i++){
  const c=run({...items[i]},items);
  assert.equal(c['detail-result-context'].textContent,`目前結果 ${i+1}／3`);
  assert.equal(c['nav-prev-case'].disabled,i===0);assert.equal(c['nav-next-case'].disabled,i===2);
  assert.match(c[i===0?'nav-next-case':'nav-prev-case']['aria-label'],/案例/);
 }
 const c=run(items[0],[items[2],items[0],items[1]]);
 assert.equal(c['detail-result-context'].textContent,'目前結果 2／3');
 assert.match(c['nav-next-case'].title,/UC-002/);
});
test('single and outside-filter direct links never invent a result position',()=>{
 assert.equal(run(items[0],[items[0]])['detail-result-context'].textContent,'目前結果 1／1');
 for(const list of [[],[items[1]]]){
  const c=run(items[0],list);assert.equal(c['detail-result-context'].textContent,'不在目前結果中');
  assert(c['nav-prev-case'].disabled&&c['nav-next-case'].disabled);
 }
});
test('loading and partial-source states distinguish available results from a complete collection',()=>{
 assert.equal(run(items[0],[items[0]],{ready:false})['detail-result-context'].textContent,'其他案例載入中');
 assert.equal(run(items[1],items,{failed:['cases/unavailable.md']})['detail-result-context'].textContent,'已載入結果 2／3');
 assert.equal(run(items[0],[],{failed:['cases/unavailable.md']})['detail-result-context'].textContent,'不在已載入結果中');
});
