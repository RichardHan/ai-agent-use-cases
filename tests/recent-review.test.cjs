'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function api(){
 const context=vm.createContext({URL,URLSearchParams,Discovery:require('../assets/discovery.js')});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0]+'\nthis.api={reviewDate,orderEntries,searchLink,hasSearchArrival,metadata};',context);
 return context.api;
}
test('review date uses explicit lead verification fields, takes latest valid date and never borrows source dates',()=>{
 const {reviewDate}=api();
 assert.equal(reviewDate('# 案例\n- 首次收錄、最近查證：2026-10-13／2026-10-20\n## 作者補充\n- 查證日期：2026-10-21'),'2026-10-20');
 for(const label of ['查證日期','查閱日期','核對日期','研究核對日','查證','首次收錄／查證','首次收錄／最近查證'])assert.equal(reviewDate('# 案例\n- '+label+'：2026-10-19（台灣時間）'),'2026-10-19');
 for(const text of ['- 發布日期：2026-10-20','- 日期：2026-10-20','- 核心目標：查證日期：2026-10-20','- 查證日期：2026-02-30','- 查證日期：2026-13-01','## 來源\n- 查證日期：2026-10-20'])assert.equal(reviewDate('# 案例\n'+text),'');
 assert.equal(reviewDate('# 案例\n- 查證日期：2024-02-29'),'2024-02-29');
 // Older leads record the review inside a dated line; the same line must name it.
 assert.equal(reviewDate('# 案例\n- 日期：實機紀錄2026-10-16；原貼文時間未取得。查閱2026-10-16 UTC。'),'2026-10-16');
 assert.equal(reviewDate('# 案例\n- 日期：可核實作紀錄2026-09-26至10-11；查證2026-10-16 UTC'),'2026-10-16');
 for(const text of ['- 日期：發布2026-10-20','- 日期：2026-10-20','- 日期：原文2026-08-23；作者自記','- 日期：2026-10-16（發布日）；查證日期未取得'])assert.equal(reviewDate('# 案例\n'+text),'');
 // A date in a clause without the verification action is not a review date.
 assert.equal(reviewDate('# 案例\n- 日期：2026-10-16（發布日）；查證 2026-10-17 UTC'),'2026-10-17');
 // A clause that names the action but denies it is not a review.
 for(const text of ['- 日期：作者發布2026-10-16，查證日期未取得','- 日期：作者發布2026-10-16（本站尚未查證）','- 日期：作者發布2026-10-16（查證尚未完成）','- 日期：作者發布2026-10-16（查證日期不詳）','- 日期：作者發布2026-10-16（查證結果不確定）'])assert.equal(reviewDate('# 案例\n'+text),'');
});
test('a review written inside another dated lead field is still that page’s review',()=>{
 const {reviewDate}=api();
 // The corpus writes the same sentence shape under keys other than 日期. The key
 // only says which date the line is about; the review clause still decides.
 for(const [text,expected] of [
  ['- 發布日期：原文精確時間未核；查閱2026-10-16 UTC','2026-10-16'],
  ['- 發布日期：精確日期未核；查閱2026-10-16 UTC','2026-10-16'],
  ['- 實作日期：2026-09-24；查證2026-10-16 UTC','2026-10-16'],
  ['- 開始日期：2026-10-08，根README採台北時間；查證2026-10-16 UTC','2026-10-16'],
  ['- 作者／日期／語言：George Liu（@george_sl_liu），英文。發布日未核；2026-10-16 UTC查閱原貼及附圖。','2026-10-16'],
  ['- 發文日期：頁面只呈現相對時間，絕對發文時間未核；查閱2026-10-23 Asia/Taipei。','2026-10-23']
 ])assert.equal(reviewDate('# 案例\n'+text),expected,text);
 // The author's own post date in the same field is not a review.
 assert.equal(reviewDate('# 案例\n- 作者／日期／語言：Ben Newton；2026-09-02T02:54:00Z；英文'),'');
 // A dated key whose clause only says the date is still not a review.
 for(const text of ['- 發布日期：2026-10-20','- 原文日期：2026-10-10 發表及更新','- 發文日期：2026-10-08 03:28','- 原文日期：2026-10-10；未查證','- 發布日期：2026-10-20（查證日期不詳）'])assert.equal(reviewDate('# 案例\n'+text),'',text);
 // A source line records when that source was checked, not when the page was reviewed.
 assert.equal(reviewDate('# 案例\n- 補充來源：[Meet dots](https://learn.chatgpt.com/docs/dots)，OpenAI；未標發布日；2026-10-13 查核；英文'),'');
 // …and the same rule holds when that source's check shares a dated field line.
 assert.equal(reviewDate('# 案例\n- 發布日期：2026-10-10 發表；補充來源 2026-10-23 查核'),'');
 assert.equal(reviewDate('# 案例\n- 發布日期：2026-10-10；查證2026-10-20 UTC；其他來源 2026-10-23 查核'),'2026-10-20');
 // A field named after the check time is a page-level review.
 assert.equal(reviewDate('# 案例\n- 查閱時間：2026-10-16 UTC'),'2026-10-16');
});
test('every published case states a lead review date the site can read',()=>{
 // Seven pages wrote it under 發布日期／實作日期／開始日期／作者／日期／語言 while the
 // card and detail still printed 「頁首未提供核對日」 and ?sort=reviewed pushed them
 // to the end. Read the real corpus so the parser cannot silently lose them again.
 const {reviewDate,metadata}=api();
 const dir=path.join(__dirname,'../cases');
 const files=fs.readdirSync(dir).filter(f=>f.endsWith('.md'));
 const undated=[];
 for(const file of files){
  const markdown=fs.readFileSync(path.join(dir,file),'utf8');
  const item=metadata(markdown,'cases/'+file,'case');
  if(!item.reviewedDate)undated.push(item.id||file);
 }
 assert.deepEqual(undated,[],'every case page must state a review date the site reads');
 for(const [id,expected] of [['218','2026-10-16'],['220','2026-10-16'],['221','2026-10-16'],['222','2026-10-16'],['223','2026-10-16'],['224','2026-10-16'],['434','2026-10-23']]){
  const file=files.find(f=>f.startsWith(id+'-'));
  const item=metadata(fs.readFileSync(path.join(dir,file),'utf8'),'cases/'+file,'case');
  assert.equal(item.reviewedDate,expected,file);
 }
});
test('recent review order preserves exact matches, sorts known dates first, retains stable relevance ties and never mutates entries',()=>{
 const {orderEntries}=api();
 const entries=[{id:'UC-001',title:'旅遊',summary:'',reviewedDate:'2026-10-13'},{id:'UC-002',title:'旅遊',summary:'',reviewedDate:'2026-10-20'},{id:'UC-003',title:'其他',summary:'旅遊',reviewedDate:'2026-10-20'},{id:'UC-004',title:'旅遊',summary:'',reviewedDate:''}];
 const original=JSON.stringify(entries);
 assert.deepEqual(Array.from(orderEntries(entries,['旅遊'],'reviewed'),e=>e.id),['UC-002','UC-003','UC-001','UC-004']);
 assert.deepEqual(Array.from(orderEntries(entries,['旅遊'],''),e=>e.id),['UC-001','UC-002','UC-004','UC-003']);
 assert.deepEqual(Array.from(orderEntries(entries,[],'unrecognized'),e=>e.id),entries.map(e=>e.id));
 assert.deepEqual(Array.from(orderEntries([],[],'reviewed')),[]);
 assert.equal(JSON.stringify(entries),original);
});
test('review sorting survives shared search URLs and is search arrival, without sharing unrelated or invalid state',()=>{
 const {searchLink,hasSearchArrival}=api();
 const href='https://example.org/ai-agent-use-cases/?case=UC-001&token=private#other';
 const url=new URL(searchLink(href,'旅遊',{scenario:'生活',proof:'作者報告／示範'},'reviewed'));
 assert.equal(url.pathname,'/ai-agent-use-cases/');assert.equal(url.searchParams.get('sort'),'reviewed');assert.equal(url.searchParams.get('q'),'旅遊');assert.equal(url.searchParams.get('scenario'),'生活');
 assert.equal(url.searchParams.has('token'),false);assert.equal(url.searchParams.has('case'),false);assert.equal(url.hash,'#explore');
 assert.equal(new URL(searchLink(href,'',{},'other')).searchParams.has('sort'),false);
 assert.equal(hasSearchArrival(new URLSearchParams('sort=reviewed'),''),true);
 assert.equal(hasSearchArrival(new URLSearchParams('sort=other'),''),false);
 assert.equal(hasSearchArrival(new URLSearchParams('sort=reviewed'),'#discover'),false);
});
test('real records preserve paired dates and leave undocumented review dates unknown',()=>{
 const {metadata}=api();
 for(const [id,expected] of [['028','2026-10-19'],['074','2026-10-16'],['082','2026-10-19'],['233','2026-10-17'],['239','2026-10-16']]){
  const file=fs.readdirSync(path.join(__dirname,'../cases')).find(f=>f.startsWith(id+'-'));
  const markdown=fs.readFileSync(path.join(__dirname,'../cases',file),'utf8');
  const item=metadata(markdown,'cases/'+file,'case');
  assert.equal(item.reviewedDate,expected,file);assert.equal(item.markdown,markdown);
 }
});
