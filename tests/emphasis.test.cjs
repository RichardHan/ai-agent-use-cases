'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Node{constructor(tag,text=''){this.tagName=tag.toUpperCase();this.children=[];this.textContent=text;}append(...nodes){this.children.push(...nodes);}setAttribute(name,value){this[name]=value;}}
const context=vm.createContext({URL,document:{createElement:tag=>new Node(tag),createTextNode:text=>new Node('#text',text)}});
vm.runInContext(fs.readFileSync(process.env.EMPHASIS_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.render=renderMarkdown;',context);
const render=s=>context.render('# title\n'+s,'cases/313-example.md'),walk=n=>[n,...n.children.flatMap(walk)],text=n=>n.textContent+n.children.map(text).join('');
test('source emphasis conveys the original action and evidence boundaries',()=>{
 for(const prefix of ['089-','313-','372-']){
  const path='cases/'+fs.readdirSync('cases').find(p=>p.startsWith(prefix)),source=fs.readFileSync(path,'utf8'),root=render(source);
  const expected=[...source.matchAll(/\*\*([^*\n]+)\*\*/g)].map(m=>m[1]);
  assert.deepEqual(walk(root).filter(n=>n.tagName==='STRONG').map(text),expected,path);
 }
});
test('strong spans keep surrounding text and permit existing safe inline code and links',()=>{
 const root=render('前 **不得 `delete`，先[核對](https://example.org/a_(b))**；**未驗證** 後');
 assert.equal(text(root),'前 不得 delete，先核對；未驗證 後');
 assert.equal(walk(root).filter(n=>n.tagName==='STRONG').length,2);
 const strong=walk(root).find(n=>n.tagName==='STRONG');assert(walk(strong).some(n=>n.tagName==='CODE'));
 const link=walk(strong).find(n=>n.tagName==='A');assert.equal(link.href,'https://example.org/a_(b)');assert.equal(link.rel,'noopener noreferrer');
});
test('code blocks, inline code and URL destinations retain literal asterisks',()=>{
 const root=render('`**literal**` [來源](https://example.org/**path**)\n\n```text\n**not emphasis**\n```');
 assert.equal(walk(root).filter(n=>n.tagName==='STRONG').length,0);
 assert.equal(walk(root).find(n=>n.tagName==='CODE').textContent,'**literal**');
 assert.equal(walk(root).find(n=>n.tagName==='A').href,'https://example.org/**path**');
 assert.equal(walk(root).find(n=>n.tagName==='PRE').textContent,'**not emphasis**\n');
});
test('unsupported or incomplete emphasis remains literal and source HTML stays inert',()=>{
 for(const s of ['**未完成','***複合語法***','** 留白 **','\\**跳脫**'])assert.equal(text(render(s)),s);
 const root=render('**<img src=x onerror=alert(1)>** [壞連結](javascript:alert(1))');
 assert.equal(walk(root).filter(n=>['IMG','SCRIPT','A'].includes(n.tagName)).length,0);assert(text(root).includes('<img src=x onerror=alert(1)>'));
});
test('headings, nested lists, quotes and tables share the safe emphasis rendering',()=>{
 const root=render('## **限制**\n- **先核准**\n  - **再執行**\n\n> **未驗證**\n\n| **欄位** | 說明 |\n| --- | --- |\n| **約數** | 作者自述 |');
 assert.deepEqual(walk(root).filter(n=>n.tagName==='STRONG').map(text),['限制','先核准','再執行','未驗證','欄位','約數']);
});

test('nested code and destinations cannot terminate source emphasis or truncate links',()=>{
 const root=render('**含 `a**b` 程式碼**；**[來源](https://example.org/a**b)**');
 assert.equal(walk(root).find(n=>n.tagName==='CODE').textContent,'a**b');
 assert.equal(walk(root).find(n=>n.tagName==='A').href,'https://example.org/a**b');
 assert.deepEqual(walk(root).filter(n=>n.tagName==='STRONG').map(text),['含 a**b 程式碼','來源']);
 assert.equal(text(root),'含 a**b 程式碼；來源');
 for(const s of ['**未核***','**未核****','**未核 *其他* **'])assert.equal(text(render(s)),s);
});
