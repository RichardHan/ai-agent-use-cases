'use strict';
// A first-time visitor types their problem as one everyday Chinese phrase.
// tokenize() keeps that run whole, so an AND on one literal substring returns
// nothing even when each term exists on its own. These tests pin the recovery
// rule and, just as important, the cases where it must stay silent.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').split("/* Browser event bindings. */")[0];
class Node {constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.textContent='';} append(...children){this.children.push(...children);} setAttribute(name,value){this[name]=value;} }
const context=vm.createContext({URL,Discovery:require('../assets/discovery.js'),document:{createElement:tag=>new Node(tag),createTextNode:text=>({textContent:text})}});
vm.runInContext(source+'\nthis.api={parseFile,filterEntries,tokenize,compoundQuerySplit};',context);
const api=context.api;
const files=['cases','evidence'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.md')).map(x=>dir+'/'+x)).concat('sources/pending.md');
const entries=files.flatMap(file=>Array.from(api.parseFile(file,fs.readFileSync(path.join(root,file),'utf8'))));

// The defect itself: the phrase is one token and no case contains it verbatim.
assert.equal(api.tokenize('客戶抱怨').join('|'),'客戶抱怨','the phrase is one token');
assert.equal(api.filterEntries(entries,api.tokenize('客戶抱怨'),{}).length,0,'the everyday phrase has no literal match');
assert(api.filterEntries(entries,api.tokenize('客戶'),{}).length>0,'each part does exist on its own');

const split=api.compoundQuerySplit(entries,api.tokenize('客戶抱怨'),{});
assert.ok(split,'a fully covered phrase is read as adjacent terms');
assert.equal(split.segments.join('|'),'客戶|抱怨');
assert.equal(split.source,'客戶抱怨');
assert.equal(split.count,api.filterEntries(entries,split.terms,{}).length,'the reported count is the real conjunction');
assert(split.count>0&&split.count<api.filterEntries(entries,[],{}).length/2,'the split narrows the library');
assert(split.segments.every(segment=>api.filterEntries(entries,[segment],{}).length>0),'every segment exists alone');
assert.equal(split.segments.join(''),split.source,'the segments cover every character');
assert.equal(split.terms.join('|'),split.segments.join('|'),'the conjunction is the segments themselves');

// Longer phrases pick the narrowing segmentation, not merely the longest first one.
const contract=api.compoundQuerySplit(entries,api.tokenize('合約到期提醒'),{});
assert.equal(contract.segments.join('|'),'合約|到期|提醒','prefers a segmentation whose conjunction has results');
assert.equal(contract.count,api.filterEntries(entries,['合約','到期','提醒'],{}).length);
assert(contract.count>0);

const letters=api.compoundQuerySplit(entries,api.tokenize('回覆客戶信件'),{});
assert(api.filterEntries(entries,letters.terms,{}).length>0,'a three-term phrase stays a real narrowing');
assert(letters.count<40,'broad-but-real narrowing still beats an empty page');

// Silence where the library has no term: never invent a match for the visitor.
for(const phrase of ['員工請假','發票對獎','想省錢','帳單看不懂']){
  assert.equal(api.compoundQuerySplit(entries,api.tokenize(phrase),{}),null,phrase+' has no full-coverage conjunction');
}
assert.equal(api.filterEntries(entries,api.tokenize('員工請假'),{}).length,0);

// Existing queries keep their result sets: the rule only runs on an empty match.
const existing=['客服','發票','記帳','代碼審查','旅遊','UC-024','pr','旅遊 收件匣'];
for(const query of existing){
  const terms=api.tokenize(query);
  const count=api.filterEntries(entries,terms,{}).length;
  assert(count>0,query+' still matches');
  assert.equal(api.compoundQuerySplit(entries,terms,{}),null,query+' is left untouched');
}

// A facet that already excludes everything is the visitor's own narrowing: the
// empty state names the facet to remove instead of re-reading the wording.
for(const filters of [{scenario:'生活'},{difficulty:'入門對話'},{kind:'pending'},{scope:'overview'}]){
  assert.equal(api.compoundQuerySplit(entries,api.tokenize('客戶抱怨'),filters),null,JSON.stringify(filters)+' keeps the facet explanation');
}
assert.equal(api.compoundQuerySplit(entries,api.tokenize('代碼審查'),{scenario:'生活',difficulty:'入門對話'}),null,'a filtered code-review query is not re-read as 代碼+審查');

// Guards: short runs, several tokens, ASCII, and non-narrowing conjunctions.
assert.equal(api.compoundQuerySplit(entries,api.tokenize('看不懂'),{}),null,'three-character runs are not split');
assert.equal(api.compoundQuerySplit(entries,api.tokenize('客戶抱怨 發票'),{}),null,'multi-token queries keep their own AND');
assert.equal(api.compoundQuerySplit(entries,api.tokenize('customer complaint'),{}),null,'latin text is untouched');
const wide=Array.from({length:10},(_,index)=>({id:'UC-9'+index,search:'客戶 抱怨',tools:[],tags:[]}));
assert.equal(api.filterEntries(wide,['客戶抱怨'],{}).length,0);
assert.equal(api.compoundQuerySplit(wide,['客戶抱怨'],{}),null,'a conjunction covering half the library is not a narrowing');

console.log('compound query split: '+entries.length+' entries checked');
