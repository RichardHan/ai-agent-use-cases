'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({});
vm.runInContext(source+'\nthis.related=typeof relatedEntries === "function" ? relatedEntries : null;',context);
const item={id:'UC-001',kind:'case',category:'旅遊',scenario:'生活',tags:[]};
const candidate=(id,extra={})=>({...item,id,...extra});
const plain=x=>JSON.parse(JSON.stringify(x));
const ids=list=>plain(list).map(row=>row.item.id);
const reasons=list=>plain(list).map(row=>row.reason);
// 200 pages is enough for the 2% rule to be observable: a tag used by 200 pages is
// template-wide, a tag used by 2 pages is specific.
const crowd=(prefix,count,tags)=>Array.from({length:count},(_,i)=>candidate(prefix+String(i).padStart(3,'0'),{tags,category:''}));
test('reading suggestions exist and use only other main cases in the same topic and current results',()=>{
 assert.equal(typeof context.related,'function','reader needs a purposeful next reading choice');
 const filtered=[item,candidate('UC-002'),candidate('P-001',{kind:'pending'}),candidate('UC-003',{category:'開發'}),candidate('E-001',{kind:'evidence'}),candidate('UC-004')];
 const before=JSON.stringify(filtered);
 assert.deepEqual(ids(context.related(item,filtered)),['UC-002','UC-004']);
 assert.deepEqual(reasons(context.related(item,filtered)),['同分類：旅遊','同分類：旅遊']);
 assert.equal(JSON.stringify(filtered),before);
});
test('at most three suggestions, deterministic order, no invented fallback for sparse or unknown topics',()=>{
 assert.equal(typeof context.related,'function');
 const all=Array.from({length:6},(_,i)=>candidate('UC-00'+(i+2)));
 assert.deepEqual(ids(context.related(item,all)),['UC-002','UC-003','UC-004']);
 assert.deepEqual(plain(context.related(item,[])),[]);
 assert.deepEqual(plain(context.related({...item,category:''},all)),[]);
 assert.deepEqual(plain(context.related({...item,category:'未分類'},all)),[]);
 assert.deepEqual(plain(context.related(item,[item])),[]);
});
test('shared task tags surface cross-category cases before a weaker single tag',()=>{
 const current={...item,tags:['旅遊','比價','付款前確認']};
 const photo=candidate('UC-099',{tags:['照片','旅遊']});
 const train=candidate('UC-286',{category:'旅遊預訂',tags:['旅遊','比價','監看']});
 const single=candidate('UC-140',{category:'其他',tags:['旅遊','旅遊']});
 const pending=candidate('P-001',{kind:'pending',category:'其他',tags:['旅遊','比價']});
 const related=context.related(current,[current,photo,single,pending,train]);
 assert.deepEqual(ids(related),['UC-286','UC-099']);
 assert.deepEqual(reasons(related),['共同標籤：旅遊、比價','同分類：旅遊'],'a two-tag match is followed by the declared theme, never a single generic tag');
});
test('one shared tag counts only when few case pages use it, never a template-wide tag',()=>{
 const current=candidate('UC-001',{tags:['記帳','驗收']});
 const crowdPages=crowd('UC-8',200,['驗收']);
 // 200 pages share 驗收 with the page, so that single tag is not a topic here.
 assert.deepEqual(plain(context.related(current,[current,...crowdPages])),[]);
 // 記帳 is used by three pages, so it is specific enough to suggest.
 const ledgers=[candidate('UC-002',{tags:['記帳'],category:''}),candidate('UC-003',{tags:['記帳'],category:''})];
 const suggested=context.related(current,[current,...crowdPages,...ledgers]);
 assert.deepEqual(ids(suggested),['UC-002','UC-003']);
 assert.deepEqual(reasons(suggested),['相關標籤：記帳','相關標籤：記帳']);
});
test('a single specific tag fills the list after a two-tag match and never replaces it',()=>{
 const current=candidate('UC-001',{tags:['旅遊','比價','記帳']});
 const strong=candidate('UC-002',{tags:['旅遊','比價'],category:''});
 const specific=candidate('UC-003',{tags:['記帳'],category:''});
 const crowdPages=crowd('UC-9',200,['驗收']);
 const related=context.related(current,[current,strong,specific,...crowdPages]);
 assert.deepEqual(ids(related),['UC-002','UC-003']);
 assert.deepEqual(reasons(related),['共同標籤：旅遊、比價','相關標籤：記帳']);
});
test('keyboard neighbours never escape an empty or unrelated search result',()=>{
 vm.runInContext('this.neighbours=detailNeighbours;',context);
 const ids=x=>({prev:x.prev?.id||null,next:x.next?.id||null});
 assert.deepEqual(ids(context.neighbours(item,[])),{prev:null,next:null});
 assert.deepEqual(ids(context.neighbours(item,[candidate('UC-002')])),{prev:null,next:null});
 assert.deepEqual(ids(context.neighbours(item,[candidate('UC-003'),item,candidate('UC-002')])),{prev:'UC-003',next:'UC-002'});
});
