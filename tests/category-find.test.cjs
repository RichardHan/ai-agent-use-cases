'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.CATEGORY_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({});vm.runInContext(source+'\nthis.findCategories=findCategories',context);
const find=(...args)=>JSON.parse(JSON.stringify(context.findCategories(...args)));
test('find category names without inventing new labels or searching case content',()=>{
 const values=[{value:'旅遊／消費研究',count:2},{value:'資料研究',count:5},{value:'旅遊／規劃',count:0}];
 assert.deepEqual(find(values,'旅遊').matches, [values[0],values[2]]);
 assert.equal(find(values,'資料 研究').total,1);
 assert.equal(find(values,'不存在').total,0);
 assert.equal(find(values,'  ').total,0);
 assert.equal(find(values,'消費研究 旅遊').total,1);
 assert.deepEqual(values[0],{value:'旅遊／消費研究',count:2});
});
test('normalize full-width Latin and case, retain zero-result alternatives and limit previews',()=>{
 const values=Array.from({length:12},(_,i)=>({value:`AI 研究 ${String(i).padStart(2,'0')}`,count:i===0?0:1}));
 const result=find(values,'ａｉ',8);assert.equal(result.total,12);assert.equal(result.matches.length,8);
 assert(result.matches.every(x=>x.count>0));
 assert.equal(find(values,'AI',20).matches.at(-1).count,0);
 assert.equal(find([],'AI').total,0);
});
