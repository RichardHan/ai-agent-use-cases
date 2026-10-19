'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {selectSearchPassage}=require(process.env.PASSAGE_SOURCE||'../assets/reader.js');
test('passage points to the actual late block, preserving its negative source text',()=>{
 const blocks=['來源背景與作者報告。','作者未核前後帳單、是否有新綁約或服務降級。','不能保證長期結果。'];
 assert.deepEqual(selectSearchPassage(blocks,'服務降級'),{index:1,excerpt:blocks[1],partial:false});
});
test('passage never joins list rows, invents href quotes, or matches empty input',()=>{
 assert.equal(selectSearchPassage(['跨列','命中'],'跨列命中'),null);
 assert.equal(selectSearchPassage(['公開來源'],'payroll'),null);
 assert.equal(selectSearchPassage(['內容'],''),null);
 assert.equal(selectSearchPassage([],'word'),null);
});
test('literal excerpts retain original Unicode, punctuation and unsafe-looking text',()=>{
 for(const [text,query] of [['ＡＰＩ ﬃ e\u0301 👩🏽‍💻','api'],['ＡＰＩ ﬃ e\u0301 👩🏽‍💻','ffi'],['ＡＰＩ ﬃ e\u0301 👩🏽‍💻','é'],['<img src=x onerror=alert(1)> [a+b]','[a+b]']]){
  const result=selectSearchPassage([text],query);assert.equal(result.excerpt,text);assert.equal(result.index,0);
 }
});
test('long excerpts are continuous original text around the match with explicit omission',()=>{
 const text='背景。'.repeat(200)+'尚未驗證服務降級、優惠到期後價格及實際結果。'+'補充。'.repeat(200);
 const result=selectSearchPassage([text],'服務降級');
 assert.equal(result.partial,true);assert(result.excerpt.includes('尚未驗證服務降級'));assert(text.includes(result.excerpt.replace(/^…|…$/g,'')));assert(Array.from(result.excerpt).length<=242);
});
test('normalization length changes near a distant hit keep the matching original letters',()=>{
 const text='👩🏽‍💻前文'.repeat(80)+'ＡＰＩ 尚未驗證。'+'後文'.repeat(80);
 const result=selectSearchPassage([text],'api');assert(result.excerpt.includes('ＡＰＩ'));assert(!result.excerpt.includes('\ufffd'));assert(text.includes(result.excerpt.replace(/^…|…$/g,'')));
});
test('first actual text match wins, and an oversized keyword is never falsely excerpted',()=>{
 assert.equal(selectSearchPassage(['薪資未測','薪資已測'],'薪資').index,0);
 const query='長'.repeat(300);const result=selectSearchPassage(['前'+query+'後'],'長'.repeat(300));assert.equal(result.index,0);assert.equal(result.excerpt,null);
});
