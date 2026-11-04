'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({URL,Discovery:require('../assets/discovery.js')});
vm.runInContext(source+'\nthis.api={parseFile,filterEntries};',context);
test('resolved pending source stays findable without appearing as an unresolved lead',()=>{
  const items=Array.from(context.api.parseFile('sources/pending.md',fs.readFileSync('sources/pending.md','utf8')));
  const resolved=items.find(x=>x.id==='P-002');
  assert.equal(resolved.mergedInto,'UC-028');
  assert.notEqual(resolved.kind,'pending');
  assert.deepEqual(Array.from(context.api.filterEntries(items,[],{kind:'pending'}),x=>x.id),['P-001','P-003']);
  assert(context.api.filterEntries(items,['P-002'],{}).some(x=>x.id==='P-002'));
});
