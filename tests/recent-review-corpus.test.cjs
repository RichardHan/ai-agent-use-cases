'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'recent-review-browser.cjs'),'utf8');
const implementation=source.slice(source.indexOf('async function verifyCorpus'),source.indexOf('async function ready'));
function fixture(){
 const markdown='# UC-001：原始案例';
 const pending=['001','002','003'].map(id=>'## P-'+id+'：待查\n來源與限制 '+id);
 const expected=new Map([['cases/001-example.md',markdown]]);
 const actual=[{id:'UC-001',path:'cases/001-example.md',markdown},...pending.map((markdown,i)=>({id:'P-00'+(i+1),path:'sources/pending.md',markdown}))];
 const verify=new Function('assert','sourceFiles','pending',implementation+';return verifyCorpus;')(assert,expected,pending);
 return {actual,verify:items=>verify({evaluate:async()=>items})};
}
test('served corpus validation accepts the complete source set in any reading order',async()=>{
 const {actual,verify}=fixture();await verify(actual.slice().reverse());
});
test('served corpus validation rejects a duplicated pending ID replacing another, even with equal counts and paths',async()=>{
 const {actual,verify}=fixture();actual[3]={...actual[2]};await assert.rejects(verify(actual));
});
test('served corpus validation rejects stale original text and missing sources',async()=>{
 const {actual,verify}=fixture();await assert.rejects(verify(actual.slice(1)));
 actual[0]={...actual[0],markdown:'舊快取'};await assert.rejects(verify(actual));
});
