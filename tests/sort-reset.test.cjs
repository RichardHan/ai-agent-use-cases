'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0];
function setup(){const context=vm.createContext({});vm.runInContext(source,context);return context;}
test('collapsed controls disclose recent-review sorting without counting it as a filter',()=>{
 const c=setup();
 assert.match(vm.runInContext("filterSummary(0,'reviewed')",c),/未設定篩選.*頁首最近核對/);
 assert.match(vm.runInContext("filterSummary(2,'reviewed')",c),/已套用 2 項篩選.*頁首最近核對/);
 assert.equal(vm.runInContext("filterSummary(0,'')",c),'未設定篩選');
 assert.equal(vm.runInContext("filterSummary(2,'unknown')",c),'已套用 2 項篩選');
});
test('restoring default order retains the query, all five facets and the discovery deck',()=>{
 const c=setup();
 vm.runInContext(`
 globalThis.controls={query:{value:'旅遊'},scenario:{value:'生活'},kind:{value:'case'},tool:{value:'Grok Bot'},category:{value:'旅行'},proof:{value:'作者報告／示範'},sort:{value:'reviewed'}};
 globalThis.document={getElementById:id=>controls[id]};activeScenario='生活';globalThis.beforeScenario=activeScenario;
 globalThis.calls=[];render=()=>calls.push('render');focusResults=()=>calls.push('focus');
 resetSort();globalThis.afterScenario=activeScenario;
 `,c);
 assert.equal(c.controls.sort.value,'');
 assert.deepEqual(JSON.parse(JSON.stringify(c.controls)),{query:{value:'旅遊'},scenario:{value:'生活'},kind:{value:'case'},tool:{value:'Grok Bot'},category:{value:'旅行'},proof:{value:'作者報告／示範'},sort:{value:''}});
 assert.equal(c.afterScenario,c.beforeScenario);
 assert.deepEqual(Array.from(c.calls),['render','focus']);
});
