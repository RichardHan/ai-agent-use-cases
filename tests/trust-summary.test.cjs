'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {parseSummary}=require('../assets/audit.js');
const batch=(count=336,remaining=664,heading='2026-10-20 20:00 台灣時間增量核對')=>({latestBatch:heading+'\n\n- 承接335，嚴格合格 **'+count+'／1,000，尚差'+remaining+'**。未獨立重現。'});
test('current batch supplies counts and its own timestamp without equating catalog size or success',()=>{
 assert.deepEqual(parseSummary(batch()),{count:336,remaining:664,date:'2026-10-20',time:'20:00'});
 assert.equal(parseSummary(batch(0,1000)).count,0);
 assert.equal(parseSummary(batch(1000,0)).count,1000);
 assert.equal(parseSummary(batch(300,700,'2026-10-19 台灣時間核對')).time,'');
});
test('malformed current batch never borrows a historical count or coerces invalid values',()=>{
 const invalid=[null,{},[],{latestBatch:null},{latestBatch:3},{latestBatch:''},
  batch(-1,1001),batch(336,665),batch('336<script>',664),batch('3.36',664),
  batch(1001,-1),batch(336,664,'2026-02-30 20:00 核對'),batch(336,664,'2026-10-20 24:00 核對'),
  {latestBatch:'沒有當前數字\n## 2026-10-19 核對\n嚴格合格 **335／1,000，尚差665**'},
  {latestBatch:batch().latestBatch+'\n## 舊批次\n嚴格合格 **335／1,000，尚差665**'},
  {latestBatch:batch().latestBatch+'\n嚴格合格 **335／1,000，尚差665**'},
  {latestBatch:'x'.repeat(20000)}];
 for(const value of invalid)assert.equal(parseSummary(value),null,JSON.stringify(value).slice(0,120));
});
test('current repository batch parses without consulting INDEX or hardcoding a historical minimum',()=>{
 const source=fs.readFileSync('sources/qualification-audit-2026-10-16.md','utf8');
 const latestBatch=source.split(/^## /m)[1];
 const result=parseSummary({latestBatch});assert(result);
 assert(result.count<=fs.readdirSync('cases').filter(f=>f.endsWith('.md')).length);
 assert.equal(result.count+result.remaining,1000);
});
