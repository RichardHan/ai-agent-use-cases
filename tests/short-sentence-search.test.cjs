'use strict';
// Everyday Chinese task questions are shorter than full sentences: "每月信用卡
// 帳單整理" (9 characters), "找便宜的機票" (6), "整理履歷表" (5). tokenize() keeps
// a CJK run whole and filterEntries() ANDs literal substrings, so these found
// nothing at all — and the sentence re-read refused them because a flat
// 10-character gate only called ≥10 characters prose. One filler character
// flipped the same question from 0 results to an explained answer. These tests
// pin the shorter boundary, and every guard that must still keep the site exact.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').split("/* Browser event bindings. */")[0];
class Node {constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.textContent='';} append(...children){this.children.push(...children);} setAttribute(name,value){this[name]=value;} }
const context=vm.createContext({URL,Discovery:require('../assets/discovery.js'),document:{createElement:tag=>new Node(tag),createTextNode:text=>({textContent:text})}});
vm.runInContext(source+'\nthis.api={parseFile,filterEntries,tokenize,norm,searchExpansion,sentenceQueryFallback,compoundQuerySplit,termVariants};',context);
const api=context.api;
const files=['cases','evidence'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.md')).map(x=>dir+'/'+x)).concat('sources/pending.md');
const entries=files.flatMap(file=>Array.from(api.parseFile(file,fs.readFileSync(path.join(root,file),'utf8'))));
const total=entries.length;

// The defect, as a visitor sees it: six real task questions, six zero-result pages.
const phrases=['每月信用卡帳單整理','整理家族旅遊行程','小孩的作業檢查','找便宜的機票','整理履歷表','自動回覆客人訊息'];
for(const phrase of phrases){
  const terms=api.tokenize(phrase);
  assert.equal([...phrase.replace(/\s+/g,'')].length<10,true,phrase+' is shorter than the old prose gate');
  assert.equal(api.filterEntries(entries,terms,{}).length,0,phrase+' has no literal conjunction in the library');
  const expansion=api.searchExpansion(entries,phrase,terms,{});
  assert.ok(expansion,phrase+' is still re-read with the library\'s own words');
  assert.equal(expansion.mode,'words',phrase+' is a prose re-read, not the fused-phrase split');
  assert.equal(expansion.count,api.filterEntries(entries,expansion.terms,{}).length,phrase+' reports the real intersection');
  assert(expansion.count>0,phrase+' answers with cases, not an empty page');
  assert(expansion.count*3<total,phrase+' narrows the library instead of restating it ('+expansion.count+'/'+total+')');
  for(const term of expansion.terms){
    assert(phrase.replace(/\s+/g,'').includes(term),phrase+' only uses a word the visitor actually typed: '+term);
    assert(api.filterEntries(entries,[term],{}).length>0,phrase+' only uses a word that exists on its own: '+term);
  }
}

// The guards that must survive the lower boundary, unchanged.
assert.equal(api.sentenceQueryFallback(entries,'照片 旅行',api.tokenize('照片 旅行'),{}),null,'two short keywords are a lookup, not prose');
assert.equal(api.sentenceQueryFallback(entries,'旅遊 xyz987',api.tokenize('旅遊 xyz987'),{}),null,'a task word plus a typed token stays an exact lookup');
assert.equal(api.sentenceQueryFallback(entries,'整理履歷表 2025',api.tokenize('整理履歷表 2025'),{}),null,'a number the visitor typed is a constraint, not a word to drop');
assert.equal(api.sentenceQueryFallback(entries,'每月信用卡帳單整理 v2',api.tokenize('每月信用卡帳單整理 v2'),{}),null,'a short query with a version stays exact');
assert.equal(api.sentenceQueryFallback(entries,'整理履歷表 GPT',api.tokenize('整理履歷表 GPT'),{}),null,'a tool name the visitor typed is not dropped from a short query');
assert.equal(api.sentenceQueryFallback(entries,'整理履歷表 x',api.tokenize('整理履歷表 x'),{}),null,'an extra token the visitor typed keeps the short query exact');
assert.equal(api.sentenceQueryFallback(entries,'比價',api.tokenize('比價'),{}),null,'a single keyword is never re-read');
const fused=api.searchExpansion(entries,'客戶抱怨',api.tokenize('客戶抱怨'),{});
assert.ok(fused,'the fused everyday phrase still recovers');
assert.equal(fused.mode,undefined,'the adjacent-term split keeps its own copy and toggle');
assert.equal(api.sentenceQueryFallback(entries,'「整理家族旅遊行程」',api.tokenize('「整理家族旅遊行程」'),{}),null,'quoted wording stays exact');
assert.equal(api.sentenceQueryFallback(entries,'整理家族旅遊行程',api.tokenize('整理家族旅遊行程'),{scenario:'生活'}),null,'a selected facet is the visitor\'s own narrowing');
for(const query of ['UC-012 整理家族旅遊行程','整理家族旅遊行程 #314']){
  assert.equal(api.sentenceQueryFallback(entries,query,api.tokenize(query),{}),null,query+' keeps its explicit case number');
}

// A query the library already matches is never reinterpreted, short or long.
const matching='整理會議紀錄';
assert(api.filterEntries(entries,api.tokenize(matching),{}).length>0,'the matching control query has literal results');
assert.equal(api.searchExpansion(entries,matching,api.tokenize(matching),{}),null,matching+' keeps its literal results unexplained');

// The long-sentence behaviour this round must not regress.
const sentence='怎麼讓 AI 幫我檢查合約有沒有問題';
const long=api.sentenceQueryFallback(entries,sentence,api.tokenize(sentence),{});
assert.ok(long,'a full sentence is still re-read');
assert.equal(long.terms.join('|'),'合約','the long sentence keeps its chosen word');
assert.equal(api.sentenceQueryFallback(entries,'我想要找一個可以幫我整理照片的工具',api.tokenize('我想要找一個可以幫我整理照片的工具'),{}).mode,'words','a 10+ character question keeps its prose re-read');
console.log('Short sentence search: boundary, guards and long-sentence regression passed');
