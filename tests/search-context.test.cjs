'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
function api(){
 const c=vm.createContext({URL,URLSearchParams});
 vm.runInContext(source+'\nthis.api={searchContext,contextExcerpt,tokenize};',c);
 return c.api;
}
const entry=(markdown,extra={})=>({id:'UC-999',title:'測試案例',summary:'整理資料',kind:'case',category:'工作',scenario:'工作',tools:[],tags:[],markdown,...extra});
test('context explains deep synonym matches without turning a prohibition into a claim',()=>{
 const {searchContext}=api();
 const r=searchContext(entry('# 標題\n## 限制與權限\n先交草稿，不登入系統、改派車、算薪資、寄信或付款。'),['薪水']);
 assert.equal(r.matches[0].term,'薪水');assert.equal(r.matches[0].variant,'薪資');
 assert.equal(r.matches[0].label,'原文 · 限制與權限');
 assert.match(r.matches[0].excerpt,/不登入系統、改派車、算薪資/);
});
test('context distinguishes visible fields, source URLs, original titles and ID aliases',()=>{
 const {searchContext}=api();
 assert.equal(searchContext(entry('',{title:'整理試算表'}),['spreadsheet']).matches[0].label,'標題');
 const r=searchContext(entry('# 舊標題\n## 來源\n[公開文章](https://example.org/payroll-guide)'),['薪水']).matches[0];
 assert.equal(r.variant,'payroll');assert.match(r.excerpt,/https:\/\/example.org\/payroll-guide/);
 assert.equal(searchContext(entry('# 依薪資找職缺'),['薪水']).matches[0].label,'原文 · 標題');
 assert.equal(searchContext(entry(''),['uc999']).matches[0].label,'案例編號');
});
test('context explains separate query terms, bounds density, and omits empty searches',()=>{
 const {searchContext}=api(),e=entry('# 標題\n## 限制\n不使用薪資資料\n## 方法\n整理郵件和附件');
 const r=searchContext(e,['薪水','email','attachment']);
 assert.equal(r.matches.length,2);assert.equal(r.remaining,1);
 assert.equal(r.matches[0].label,'原文 · 限制');assert.equal(r.matches[1].label,'原文 · 方法');
 assert.equal(searchContext(e,[]).matches.length,0);
 assert.equal(searchContext(e,['不存在']).matches.length,0);
});
test('excerpt preserves original Unicode, markup as text, and a bounded window around a late match',()=>{
 const {contextExcerpt}=api();
 const input='🙂'.repeat(300)+'不要把ＡＰＩ或ﬃ當成果。<img src=x onerror=alert(1)>'+'尾'.repeat(200);
 const excerpt=contextExcerpt(input,'api');
 assert.match(excerpt,/不要把ＡＰＩ或ﬃ當成果/);
 assert.match(excerpt,/<img src=x onerror=alert\(1\)>/);
 assert([...excerpt].length<=162);assert(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(excerpt));
 assert.match(contextExcerpt('長'.repeat(300)+'ﬃ end','ffi'),/ﬃ end/);
});
