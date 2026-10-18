'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {selectReadingSection}=require('../assets/reader.js');
const root=path.resolve(__dirname,'..');
function sections(markdown){
 return [...markdown.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(m=>({title:m[1],text:m[2].trim()}));
}
test('UC-313 promotes the entire report including uncertainty and unexecuted proposal',()=>{
 const file=fs.readdirSync(path.join(root,'cases')).find(p=>p.startsWith('313-'));
 const parts=sections(fs.readFileSync(path.join(root,'cases',file),'utf8'));
 const selected=selectReadingSection(parts,'case');
 assert.equal(parts[selected].title,'問題、實作與具體結果');
 assert.match(parts[selected].text,/未證實實際重複寄送/);
 assert.match(parts[selected].text,/明示未執行/);
});
test('source versions retain every list item and are not called verified results',()=>{
 const file=fs.readdirSync(path.join(root,'cases')).find(p=>p.startsWith('338-'));
 const parts=sections(fs.readFileSync(path.join(root,'cases',file),'utf8'));
 const selected=selectReadingSection(parts,'case');
 assert.equal(parts[selected].title,'來源版本');
 assert.match(parts[selected].text,/證據缺口/);
 assert.match(parts[selected].text,/沒有截圖、紀錄表/);
});
test('report takes precedence over source directory and excludes designed, expected and supplementary outcomes',()=>{
 const parts=['來源','輸入與預期輸出','本庫設計的實作與結果','補充：作者實作','來源報告與限制','建議操作流程'].map(title=>({title,text:'完整原文'}));
 assert.equal(selectReadingSection(parts,'case'),4);
 assert.equal(selectReadingSection(parts,'pending'),-1);
 assert.equal(selectReadingSection(parts.slice(1,4),'case'),-1);
 assert.equal(selectReadingSection([],'case'),-1);
 assert.equal(selectReadingSection([{title:'來源版本',text:''}],'case'),-1);
});
test('long and unknown original sections remain available through research, never silently truncated',()=>{
 assert.equal(selectReadingSection([{title:'作者實作與結果',text:'長'.repeat(3201)}],'case'),-1);
 assert.equal(selectReadingSection([{title:'不明章節',text:'資料'}],'case'),-1);
});
