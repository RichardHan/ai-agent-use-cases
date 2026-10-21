'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {selectSearchSections}=require('../assets/reader.js');
const terms=(term,variants=[term])=>[{term,variants}];
test('search route preserves a negative source section and the matched synonym',()=>{
 const sections=[{title:'方法',text:'先交草稿'},{title:'自設只讀驗收（未實跑）',text:'不登入系統、改派車、算薪資或付款。'}];
 assert.deepEqual(selectSearchSections(sections,terms('薪水',['薪水','薪資'])),[{index:1,term:'薪水',variant:'薪資',title:'自設只讀驗收（未實跑）'}]);
});
test('routes use section indices even when original headings repeat',()=>{
 const sections=[{title:'來源',text:'公開摘要'},{title:'來源',text:'附錄特殊詞'}];
 assert.equal(selectSearchSections(sections,terms('特殊詞'))[0].index,1);
});
test('literal Unicode and href matches use the same normalized variants without regex',()=>{
 const sections=[{title:'來源 <img src=x>',text:'ＡＰＩ ﬃ [a+b] https://example.org/payroll'}];
 assert.equal(selectSearchSections(sections,terms('api'))[0].variant,'api');
 assert.equal(selectSearchSections(sections,terms('ffi'))[0].index,0);
 assert.equal(selectSearchSections(sections,terms('[a+b]'))[0].index,0);
 assert.equal(selectSearchSections(sections,terms('薪水',['薪水','payroll']))[0].title,sections[0].title);
});
test('routes are bounded, deduplicate sections and keep term order',()=>{
 const sections=[{title:'甲',text:'alpha beta'},{title:'乙',text:'gamma'},{title:'丙',text:'delta'}];
 const result=selectSearchSections(sections,['alpha','beta','gamma','delta'].map(term=>({term,variants:[term]})));
 assert.deepEqual(result.map(x=>x.index),[0,1]);
 assert.deepEqual(result.map(x=>x.term),['alpha','gamma']);
});
test('empty, missing and metadata-only terms never invent original matches',()=>{
 assert.deepEqual(selectSearchSections([],terms('word')),[]);
 assert.deepEqual(selectSearchSections([{title:'資料',text:'沒有命中'}],[]),[]);
 assert.deepEqual(selectSearchSections([{title:'資料',text:'內容'}],terms('uc-999')),[]);
});
test('body matches take readers beyond repeated leading tags, retaining original section indices',()=>{
 const sections=[{title:'',text:'標籤：旅遊、比價',isMetadata:true},{title:'方法',text:'比較交通與住宿'},{title:'媒體實測與限制',text:'作者無法訂旅遊；需本人核對預算。'}];
 assert.deepEqual(selectSearchSections(sections,terms('旅遊')),[{index:2,term:'旅遊',variant:'旅遊',title:'媒體實測與限制'}]);
});
test('metadata-only terms still route to original metadata, while synonyms prefer a body section',()=>{
 const sections=[{title:'',text:'頁首特有詞；薪水',isMetadata:true},{title:'限制',text:'沒有薪資計算結果。'}];
 assert.equal(selectSearchSections(sections,terms('頁首特有詞'))[0].index,0);
 assert.deepEqual(selectSearchSections(sections,terms('薪水',['薪水','薪資'])),[{index:1,term:'薪水',variant:'薪資',title:'限制'}]);
});
