'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({});
vm.runInContext(source+'\nthis.related=typeof relatedEntries === "function" ? relatedEntries : null;',context);
const item={id:'UC-001',kind:'case',category:'旅遊',scenario:'生活'};
const candidate=(id,extra={})=>({...item,id,...extra});
const plain=x=>JSON.parse(JSON.stringify(x));
test('reading suggestions exist and use only other main cases in the same topic and current results',()=>{
 assert.equal(typeof context.related,'function','reader needs a purposeful next reading choice');
 const filtered=[item,candidate('UC-002'),candidate('P-001',{kind:'pending'}),candidate('UC-003',{category:'開發'}),candidate('E-001',{kind:'evidence'}),candidate('UC-004')];
 const before=JSON.stringify(filtered);
 assert.deepEqual(plain(context.related(item,filtered)).map(x=>x.id),['UC-002','UC-004']);
 assert.equal(JSON.stringify(filtered),before);
});
test('at most three suggestions, deterministic order, no invented fallback for sparse or unknown topics',()=>{
 assert.equal(typeof context.related,'function');
 const all=Array.from({length:6},(_,i)=>candidate('UC-00'+(i+2)));
 assert.deepEqual(plain(context.related(item,all)).map(x=>x.id),['UC-002','UC-003','UC-004']);
 assert.deepEqual(plain(context.related(item,[])),[]);
 assert.deepEqual(plain(context.related({...item,category:''},all)),[]);
 assert.deepEqual(plain(context.related({...item,category:'未分類'},all)),[]);
 assert.deepEqual(plain(context.related(item,[item])),[]);
});
test('shared task tags surface cross-category cases before broad same-category matches',()=>{
 const current={...item,tags:['旅遊','比價','付款前確認']};
 const photo=candidate('UC-099',{tags:['照片','旅遊']});
 const train=candidate('UC-286',{category:'旅遊預訂',tags:['旅遊','比價','監看']});
 const single=candidate('UC-140',{category:'其他',tags:['旅遊','旅遊']});
 const pending=candidate('P-001',{kind:'pending',category:'其他',tags:['旅遊','比價']});
 assert.deepEqual(plain(context.related(current,[current,photo,single,pending,train])).map(x=>x.id),['UC-286','UC-099']);
});
test('keyboard neighbours never escape an empty or unrelated search result',()=>{
 vm.runInContext('this.neighbours=detailNeighbours;',context);
 const ids=x=>({prev:x.prev?.id||null,next:x.next?.id||null});
 assert.deepEqual(ids(context.neighbours(item,[])),{prev:null,next:null});
 assert.deepEqual(ids(context.neighbours(item,[candidate('UC-002')])),{prev:null,next:null});
 assert.deepEqual(ids(context.neighbours(item,[candidate('UC-003'),item,candidate('UC-002')])),{prev:'UC-003',next:'UC-002'});
});
