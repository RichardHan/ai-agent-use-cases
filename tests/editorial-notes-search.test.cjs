'use strict';
// The library's own editing notes — （翻譯改寫）, （本庫設計，未實測）, （依來源整理；本庫未實測）
// — say how a page was written, not what the case does. They used to be indexed
// with the body, so 「翻譯」 matched 186 of 515 entries while one entry is about
// translation, and the homepage's 「文件翻譯」 entry returned 77 cases.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
class Node{constructor(tag,text=''){this.tagName=tag.toUpperCase();this.children=[];this.textContent=text;}append(...nodes){this.children.push(...nodes);}setAttribute(name,value){this[name]=value;}}
const context=vm.createContext({URL,Discovery:require(path.join(root,'assets/discovery.js')),document:{createElement:tag=>new Node(tag),createTextNode:text=>new Node('#text',text)}});
vm.runInContext(fs.readFileSync(process.env.EDITORIAL_SOURCE||path.join(root,'assets/app.js'),'utf8').split('/* Browser event bindings. */')[0]
  +'\nthis.api={metadata,parseFile,filterEntries,norm,tokenize,withoutEditorialNotes,EDITORIAL_LABEL,EDITORIAL_WORD};',context);
const api=context.api;
vm.runInContext('displayCopy='+fs.readFileSync(path.join(root,'assets/copy.json'),'utf8'),context);
const files=['cases','evidence'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.md')).map(x=>dir+'/'+x)).concat('sources/pending.md');
const entries=files.flatMap(file=>Array.from(api.parseFile(file,fs.readFileSync(path.join(root,file),'utf8'))));
const search=(query,scope)=>api.filterEntries(entries,Array.from(api.tokenize(query)),scope?{scope}:{});
const strip=text=>api.withoutEditorialNotes(text);

test('a short note that opens with an editorial label and carries an editing word is not indexed',()=>{
  for(const note of ['（翻譯改寫）','（翻譯摘要，非全文）','（本庫設計，未實測）','（本庫原創設計，未實跑）','（自行設計，未測）','（依來源整理；本庫未實測）','（未實測，可修改後貼上）']){
    assert.equal(strip(`- 作者自述${note}：內容`),'- 作者自述 ：內容',`${note} must leave the index`);
  }
});

test('a note that holds case content, or a label without an editing word, stays searchable',()=>{
  // （依來源整理） and （本庫已看） describe a source or a reading, and 整理 is a word
  // readers search for; dropping them would cost real hits without removing filler.
  for(const note of ['（依來源整理）','（本庫已看）','（本庫只看縮圖，畫面是作者穿著新鞋攀岩，不是購買紀錄）','（本庫 2026-10-14 20:55 讀取）']){
    assert.equal(strip(`## 建議操作流程${note}`),`## 建議操作流程${note}`,`${note} is not an editing note`);
  }
  // Text outside parentheses is never touched, even when it uses the same words.
  assert.equal(strip('本庫設計的流程尚未實測，翻譯由作者完成'),'本庫設計的流程尚未實測，翻譯由作者完成');
});

test('a note that reports a fact, or leaves a long tail, is not treated as an editing label',()=>{
  // A number means the note is reporting something about the case (a date, a price,
  // a source id), so removing it from the index would hide evidence.
  for(const note of ['（改寫：張三於 2026 年支付 100 元，翻譯費）','（本庫原創，未測；結構參考 S-061A 公開版本，非逐字翻譯）','（自設未測提示；只有 S-051A 的兩句英文是作者原話）']){
    assert.equal(strip(`- 作者流程${note}`),`- 作者流程${note}`,`${note} reports a fact`);
  }
  // A note whose remainder after the editing words is long is prose, not a label.
  const prose='（本庫原創，未測；結構參考作者簡化版，非逐字複製）';
  assert.equal(strip(`## 可貼指令${prose}`),`## 可貼指令${prose}`,'a long remainder is content');
  // Removal leaves a separator, so two words never fuse into a term nobody wrote.
  assert.equal(strip('A（未實測）B'),'A B');
  assert.doesNotMatch(strip('前（翻譯改寫）後'),/前後/,'no new compound term appears');
});

test('the note stays visible on the page a reader opens; only the index drops it',()=>{
  const item=entries.find(x=>x.id==='UC-001');
  assert.match(item.markdown,/（翻譯改寫）/,'the reading view still shows the note verbatim');
  assert.doesNotMatch(item.search,/翻譯改寫/,'the note is not searchable text');
  assert.doesNotMatch(item.search,/(?:^|\s)翻譯(?:\s|$)/,'翻譯 from the note no longer indexes UC-001');
  // Header fields the site derives itself are untouched.
  assert.equal(item.title,entries.find(x=>x.id==='UC-001').title);
  assert.ok(item.summary&&item.tags.length,'a case keeps its declared fields');
});

test('translation queries keep the cases that are about translation and drop the note-only ones',()=>{
  const translate=search('翻譯');
  assert.ok(translate.length<=25,`翻譯 must stop matching three quarters of the corpus, got ${translate.length}`);
  for(const id of ['UC-144','UC-452'])assert.ok(translate.some(x=>x.id===id),`${id} is about translation and must still match`);
  assert.ok(!translate.some(x=>x.id==='UC-001'),'UC-001 only carried the note and must not match');
  const rejections=search('翻譯改寫');
  assert.ok(rejections.length<=5,`翻譯改寫 was a pure note, got ${rejections.length}`);
  for(const item of rejections){
    assert.match(api.withoutEditorialNotes(item.markdown),/翻譯改寫/,`${item.id} keeps 翻譯改寫 in its own prose`);
  }
  assert.equal(search('翻譯摘要').length,0,'翻譯摘要 is only ever a note');
  const documentTranslation=search('文件翻譯');
  assert.ok(documentTranslation.length<=20,`文件翻譯 was 77 before the change, got ${documentTranslation.length}`);
  assert.ok(documentTranslation.some(x=>x.id==='UC-144'),'文件翻譯 keeps the translation case');
});

test('no case loses the words its own prose declares',()=>{
  // Case 511 describes meeting notes; 整理 came only from a 建議操作流程 qualifier that
  // is now skipped, so the remaining tokens must still find it.
  const meeting=search('怎麼整理會議記錄').map(x=>x.id);
  assert.ok(meeting.includes('UC-511'),'a meeting-notes case stays findable by 會議 and 筆記');
  for(const query of ['會議','收件匣','報表','客服','代碼審查','比價','權限','來源','提示詞']){
    assert.ok(search(query).length>0,`${query} still returns the cases that discuss it`);
  }
  // Nothing was over-stripped into an empty index.
  const empty=entries.filter(x=>!String(x.search||'').trim()).map(x=>x.id);
  assert.deepEqual(empty,[],'every entry keeps searchable text');
});

test('the split count the results line reports is computed from the same text',()=>{
  // The overview scope never reads the body, so dropping notes cannot change how
  // many cases describe themselves with the words — only how many merely mention them.
  const overview=search('翻譯',true).map(x=>x.id), total=search('翻譯').map(x=>x.id);
  assert.deepEqual(overview.filter(id=>!total.includes(id)),[],'an overview hit stays inside the full hit list');
  assert.ok(overview.includes('UC-410'),'UC-410 names 意圖翻譯卡 in its own title');
  assert.ok(search('改寫',true).length>0,'改寫 still answers cases that rewrite something');
});
