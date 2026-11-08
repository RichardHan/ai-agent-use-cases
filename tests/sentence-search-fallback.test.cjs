'use strict';
// First-time visitors often ask in a full sentence ("怎麼讓 AI 幫我檢查合約有沒有
// 問題"). tokenize() keeps CJK runs whole and filterEntries() ANDs literal
// substrings, so a sentence matched nothing at all. These tests pin the rule that
// re-reads a sentence with the library's own vocabulary, and — just as important —
// every case where it must stay silent or refuse a half-library answer.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').split("/* Browser event bindings. */")[0];
class Node {constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.textContent='';} append(...children){this.children.push(...children);} setAttribute(name,value){this[name]=value;} }
const context=vm.createContext({URL,Discovery:require('../assets/discovery.js'),document:{createElement:tag=>new Node(tag),createTextNode:text=>({textContent:text})}});
vm.runInContext(source+'\nthis.api={parseFile,filterEntries,tokenize,norm,libraryVocabulary,sentenceQueryFallback,searchExpansion,compoundQuerySplit,SYNONYM_MAP,termVariants};',context);
const api=context.api;
const files=['cases','evidence'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.md')).map(x=>dir+'/'+x)).concat('sources/pending.md');
const entries=files.flatMap(file=>Array.from(api.parseFile(file,fs.readFileSync(path.join(root,file),'utf8'))));
const total=entries.length;

// The defect: a sentence is several tokens, and no case contains every one.
const sentence='怎麼讓 AI 幫我檢查合約有沒有問題';
assert(api.tokenize(sentence).length>1,'a sentence splits into several tokens');
assert.equal(api.filterEntries(entries,api.tokenize(sentence),{}).length,0,'the literal conjunction finds nothing');
assert(api.filterEntries(entries,['合約'],{}).length>0,'the task word itself is in the library');

const fallback=api.sentenceQueryFallback(entries,sentence,api.tokenize(sentence),{});
assert.ok(fallback,'a prose query is re-read with library vocabulary');
assert.equal(fallback.mode,'words');
assert.equal(fallback.terms.join('|'),'合約');
assert.equal(fallback.count,api.filterEntries(entries,fallback.terms,{}).length,'the reported count is the real conjunction');
assert(fallback.count<total/3,'the answer narrows the library instead of restating it');
for(const term of fallback.terms){
  assert((fallback.source||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'').includes(term.normalize('NFKC').toLowerCase()),'every chosen word literally appears in what the visitor typed');
  assert(api.filterEntries(entries,[term],{}).length>0,'every chosen word exists on its own');
}

// A sentence usually carries a second useful word; the narrower conjunction wins.
const bills=api.sentenceQueryFallback(entries,'我想把家裡的帳單自動記帳',api.tokenize('我想把家裡的帳單自動記帳'),{});
assert.equal(bills.terms.length,2,'two library words form a narrower answer');
assert.equal([...bills.terms].sort().join('|'),'帳單|記帳');
assert.equal(bills.count,api.filterEntries(entries,bills.terms,{}).length);
assert(bills.count<api.filterEntries(entries,['記帳'],{}).length,'the pair is narrower than its first word');

// Only a stricter narrowing decides which words are usable: a word that covers a
// third of the library never answers alone, but may help a pair.
for(const query of ['我想自動追蹤專案進度並提醒同事','我想讓 AI 幫我分析銷售報表','我想要找一個可以幫我整理照片的工具']){
  const option=api.sentenceQueryFallback(entries,query,api.tokenize(query),{});
  assert.ok(option,query+' is still re-read');
  assert(option.count*3<total,query+' stays a real narrowing ('+option.count+'/'+total+')');
}

// Words from one synonym group are the same search, so they never pair up.
// 分析 and 研究 share a synonym group and both appear in this sentence.
const sameGroup='我想用 AI 幫忙做市場研究與分析報告';
assert(api.filterEntries(entries,['分析'],{}).length>0&&api.filterEntries(entries,['研究'],{}).length>0,'both words exist on their own');
assert.equal(api.termVariants('分析').includes('研究'),true,'the two words really share one synonym group');
const grouped=api.sentenceQueryFallback(entries,sameGroup,api.tokenize(sameGroup),{});
if(grouped){
  const keys=grouped.terms.map(term=>api.termVariants(term).slice().sort().join('|'));
  assert.equal(new Set(keys).size,keys.length,'a pair never repeats one synonym group');
  assert(!(grouped.terms.includes('分析')&&grouped.terms.includes('研究')),'two words of one synonym group are not paired');
}

// Latin vocabulary matches whole words only: "ev" (電動車) must not be found
// inside "review", and whatever is chosen must be a token the visitor typed.
const mixed='我想用 AI 幫我 review pull request 並留下註解';
const mixedOption=api.sentenceQueryFallback(entries,mixed,api.tokenize(mixed),{});
if(mixedOption){
  const spaced=api.norm(mixed);
  for(const term of mixedOption.terms){
    if(!/[a-z0-9]/.test(term))continue;
    const whole=new RegExp('(^|[^a-z0-9])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z0-9]|$)');
    assert(whole.test(spaced),'a latin word must be a whole token in the query, not a fragment: '+term);
  }
  assert(!mixedOption.terms.includes('ev'),'a synonym fragment inside another word is not a match');
}

// A pair never restates one word inside another: that narrowing is the word itself.
const overlaps=api.sentenceQueryFallback(entries,mixed,api.tokenize(mixed),{});
if(overlaps&&overlaps.terms.length===2){
  assert(!overlaps.terms[0].includes(overlaps.terms[1])&&!overlaps.terms[1].includes(overlaps.terms[0]),'a pair does not repeat a contained word: '+overlaps.terms.join('+'));
}

// Stays silent when the visitor's own narrowing, or their literal wording, is the cause.
assert.equal(api.sentenceQueryFallback(entries,sentence,api.tokenize(sentence),{scenario:'生活'}),null,'a selected facet is the visitor\'s own narrowing');
assert.equal(api.sentenceQueryFallback(entries,sentence,api.tokenize(sentence),{kind:'case'}),null,'facet filtering disables the re-read');
assert.equal(api.sentenceQueryFallback(entries,'「怎麼讓 AI 幫我檢查合約有沒有問題」',api.tokenize('「怎麼讓 AI 幫我檢查合約有沒有問題」'),{}),null,'quoted wording stays exact');
// An explicit case number is never traded for a topic word.
for(const query of ['UC-012 請幫我檢查合約','UC 012 請幫我檢查合約','UC_012 請幫我檢查合約','UC:012 請幫我檢查合約','UC.012 請幫我檢查合約','UC  012 請幫我檢查合約','P 002 的合約','我想看 uc-012 這篇關於合約的案例','請幫我看 #314 的合約審查案例']){
  assert.equal(api.sentenceQueryFallback(entries,query,api.tokenize(query),{}),null,query+' keeps its explicit case number');
}
// A version number is not a case number: C# 12 must still be able to fall back.
const csharp='C# 12 想找到合約審查的方法';
assert.equal(api.tokenize(csharp).some(term=>/^(?:uc|p)-\d+$/.test(term)),false,'C# 12 is not tokenized as a case number');
assert.ok(api.sentenceQueryFallback(entries,csharp,api.tokenize(csharp),{}),'a language version does not disable the fallback');
assert.equal(api.sentenceQueryFallback(entries,'照片 旅行',api.tokenize('照片 旅行'),{}),null,'a short multi-keyword lookup is not prose');
assert.equal(api.sentenceQueryFallback(entries,'客戶抱怨',api.tokenize('客戶抱怨'),{}),null,'a short everyday phrase is handled by the adjacent-term split instead');
assert.equal(api.sentenceQueryFallback(entries,'我想要幫阿嬤把菜園的圍籬修好',api.tokenize('我想要幫阿嬤把菜園的圍籬修好'),{}),null,'a sentence with no library word is not invented into one');

// A sentence whose only words cover half the library keeps the empty state instead
// of presenting a near全庫 result as an answer.
for(const query of ['有沒有 AI 可以幫我檢查程式碼有沒有問題','有沒有 AI 工具可以幫我寫測試']){
  const option=api.sentenceQueryFallback(entries,query,api.tokenize(query),{});
  assert(option===null||option.count*3<total,query+' never answers with a half-library result');
}

// One decision point: a strict match is never re-read, and the adjacent-term
// split still wins for fused everyday phrases.
assert.equal(api.searchExpansion(entries,'我想用 AI 幫我寫社群貼文',api.tokenize('我想用 AI 幫我寫社群貼文'),{}),null,'a query that already matches is left alone');
assert.equal(api.searchExpansion(entries,'',[],{}),null,'an empty query has no expansion');
const fused=api.searchExpansion(entries,'客戶抱怨',api.tokenize('客戶抱怨'),{});
assert.ok(fused,'the fused phrase still recovers');
assert.equal(fused.mode,undefined,'the adjacent-term split keeps its own copy and toggle');
assert.equal(fused.segments.join('|'),'客戶|抱怨');

// Vocabulary is derived from the loaded corpus only, and rebuilt when it grows.
const vocabulary=api.libraryVocabulary(entries);
assert(vocabulary.length>100,'synonyms and indexed tags form the vocabulary');
assert(vocabulary.every(term=>term.length>=2&&term.length<=12),'no single characters or runaway labels');
assert(vocabulary.includes('排班'),'an indexed task tag is searchable vocabulary');
console.log('Sentence fallback: guards, narrowing and vocabulary invariants passed');
