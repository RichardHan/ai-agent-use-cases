'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.HISTORY_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({URL,URLSearchParams,Discovery:require('../assets/discovery.js')});
vm.runInContext(source+'\nthis.create=typeof createReadingHistory==="function"?createReadingHistory:null;',context);
const create=limit=>{assert.equal(typeof context.create,'function','Reading history must retain separate bounded visits');return context.create(limit);};
const a={id:'UC-005',markdown:'Original public text'},b={id:'UC-006',markdown:'Different text'};
test('separate history visits to the same case never overwrite one another',()=>{
 const h=create(12),first={top:3000},second={top:500};h.save('a1',a,'',first);h.save('b1',b,'',{top:100});h.save('a2',a,'',second);
 assert.equal(h.read('a1',a,''),first);assert.equal(h.read('a2',a,''),second);
});
test('changed source, query or case cannot restore a stale reading anchor',()=>{
 const h=create(12);h.save('a1',a,'審查',{top:3000});
 for(const [key,item,query] of [['missing',a,'審查'],['a1',b,'審查'],['a1',{...a,markdown:'Revised source'},'審查'],['a1',a,'旅遊']])assert.equal(h.read(key,item,query),null);
});
test('history stays bounded and a revisited snapshot stays among recent entries',()=>{
 const h=create(2);h.save('a1',a,'',{top:1});h.save('b1',b,'',{top:2});h.save('a1',a,'',{top:3});h.save('a2',a,'',{top:4});
 assert.equal(h.read('b1',b,''),null);assert.equal(h.read('a1',a,'').top,3);assert.equal(h.read('a2',a,'').top,4);
});
test('a new page session has no stored reading state',()=>{
 const h=create(12);h.save('old',a,'',{top:3000});assert.equal(create(12).read('old',a,''),null);
});
