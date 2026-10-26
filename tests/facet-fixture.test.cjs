'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {zeroChoice,representativeChoices}=require('./facet-fixture.cjs');
test('empty recovery uses a live zero option even when travel plus development has matches',()=>{
 const choices={scenario:[{value:'',text:'10 · 全部'},{value:'開發',text:'2 · 開發'},{value:'創作',text:'0 · 創作'}]};
 assert.deepEqual(zeroChoice(choices),{key:'scenario',value:'創作'});
});
test('empty recovery falls back explicitly when every real combination is populated',()=>{
 assert.equal(zeroChoice({scenario:[{value:'',text:'10 · 全部'},{value:'開發',text:'10 · 開發'}]}),null);
 assert.equal(zeroChoice({scenario:[{value:'',text:'0 · 全部'}]}),null);
});
test('cross-browser samples include all, positive, zero and current without duplicates',()=>{
 const choices=[{value:'',text:'12 · 全部'},{value:'a',text:'4 · A'},{value:'b',text:'3 · B'},{value:'c',text:'2 · C'},{value:'zero',text:'0 · Zero'}];
 assert.deepEqual(representativeChoices(choices,'c').map(x=>x.value),['','a','zero','c']);
 assert.deepEqual(representativeChoices(choices,'a').map(x=>x.value),['','a','zero']);
 assert.deepEqual(representativeChoices([],''),[]);
});
