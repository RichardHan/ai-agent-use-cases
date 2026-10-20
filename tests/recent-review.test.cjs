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
 for(const [id,expected] of [['028','2026-10-19'],['074','2026-10-16'],['082','2026-10-19'],['233','2026-10-17'],['239','']]){
  const file=fs.readdirSync(path.join(__dirname,'../cases')).find(f=>f.startsWith(id+'-'));
  const markdown=fs.readFileSync(path.join(__dirname,'../cases',file),'utf8');
  const item=metadata(markdown,'cases/'+file,'case');
  assert.equal(item.reviewedDate,expected,file);assert.equal(item.markdown,markdown);
 }
});
