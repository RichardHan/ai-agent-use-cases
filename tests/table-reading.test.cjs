'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Node{constructor(tag,text=''){this.tagName=tag.toUpperCase();this.children=[];this.textContent=text;}append(...nodes){this.children.push(...nodes);}setAttribute(key,value){this[key]=value;}}
const context=vm.createContext({URL,document:{createElement:tag=>new Node(tag),createTextNode:text=>new Node('#text',text)}});
vm.runInContext(fs.readFileSync(process.env.TABLE_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.render=renderMarkdown;',context);
const render=text=>context.render('# heading\n'+text,'cases/400-cost.md');
const text=n=>n.textContent+n.children.map(text).join(''),walk=n=>[n,...n.children.flatMap(walk)];
const table='| 名稱 | 頻率 | 作者報的成本 |\n| --- | :---: | ---: |\n| Bot A | 每天 | 未獨立驗證 |\n| Bot B | 每週 | 約0.20美元 |';
test('source table keeps real column headers, row boundaries and qualified costs',()=>{
 const root=render('## 輸入與預期輸出\n\n'+table+'\n\n限制未核對');
 const semantic=walk(root).find(n=>n.tagName==='TABLE');assert(semantic,'comparison must be a semantic table');
 assert.equal(semantic.children[0].tagName,'THEAD');assert.equal(semantic.children[1].tagName,'TBODY');
 assert.deepEqual(semantic.children[0].children[0].children.map(n=>[n.tagName,n.scope,text(n)]),[['TH','col','名稱'],['TH','col','頻率'],['TH','col','作者報的成本']]);
 assert.deepEqual(semantic.children[1].children.map(row=>row.children.map(text)),[['Bot A','每天','未獨立驗證'],['Bot B','每週','約0.20美元']]);
 assert.equal(root.children.at(-1).tagName,'P');assert.equal(text(root.children.at(-1)),'限制未核對');
});
test('real UC-400 preserves all six bots and every literal source cell',()=>{
 const md=fs.readFileSync('cases/400-x-api-read-only-creator-bots-cost-estimate-vs-bill.md','utf8');
 const root=render(md),semantic=walk(root).find(n=>n.tagName==='TABLE');assert(semantic);
 const rows=semantic.children.flatMap(group=>group.children).map(row=>row.children.map(text));
 const original=md.split('\n').filter(line=>line.startsWith('|')&&!/^\| ---/.test(line)).map(line=>line.slice(1,-1).split('|').map(s=>s.trim()));
 assert.deepEqual(rows,original);assert.equal(rows.length,7);
});
test('pipes in escaped cells and inline code remain content; links stay text-safe',()=>{
 const root=render('| 名稱 | 限制 |\n| --- | --- |\n| A \\| B | `x|y` [來源](https://example.org/report) |\n| <img onerror=alert(1)> | [危險](javascript:alert(1)) |');
 const semantic=walk(root).find(n=>n.tagName==='TABLE');assert(semantic);const rows=semantic.children[1].children;
 assert.equal(text(rows[0].children[0]),'A | B');assert.equal(text(rows[0].children[1]),'x|y 來源');
 assert.equal(walk(root).filter(n=>n.tagName==='A').length,1);assert.equal(walk(root).find(n=>n.tagName==='A').href,'https://example.org/report');assert.equal(walk(root).filter(n=>n.tagName==='IMG').length,0);
});
test('literal pipes and malformed or fenced tables keep the original text',()=>{
 for(const source of ['ordinary | prose\nnot a table','| A | B |\n| --- |\n| a | b |','| A | B |\n| --x | --- |\n| a | b |','```text\n'+table+'\n```']){
  const root=render(source);assert.equal(walk(root).filter(n=>n.tagName==='TABLE').length,0);assert(text(root).includes(source.startsWith('```')?'| 名稱 | 頻率 | 作者報的成本 |':source.split('\n')[0]));
 }
});
test('optional edge pipes render; inconsistent rows stay literal without dropping cells',()=>{
 const root=render('名稱 | 限制\n--- | ---\nA | B');const semantic=walk(root).find(n=>n.tagName==='TABLE');assert(semantic);
 assert.deepEqual(semantic.children[1].children.map(row=>row.children.map(text)),[['A','B']]);
 for(const row of ['A | B | C','A |']){
  const root=render('| 名稱 | 限制 |\n| --- | --- |\n'+row);assert.equal(walk(root).filter(n=>n.tagName==='TABLE').length,0);assert(text(root).includes(row));
 }
});
const {readingPassages,selectSearchPassage}=require(process.env.TABLE_READER||'../assets/reader.js');
test('search passages target literal table cells without joining different columns',()=>{
 const a={tagName:'TD',textContent:'成本未核'},b={tagName:'TD',textContent:'每週一次'},table={tagName:'TABLE',children:[{tagName:'TBODY',children:[{tagName:'TR',children:[a,b]}]}]};
 const passages=readingPassages({tagName:'DIV',className:'markdown-table',children:[table]});
 assert.deepEqual(passages.map(p=>p.text),['成本未核','每週一次']);assert.equal(selectSearchPassage(passages.map(p=>p.text),'未核每週'),null);assert.equal(passages[selectSearchPassage(passages.map(p=>p.text),'每週').index].node,b);
});
