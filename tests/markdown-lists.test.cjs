'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Node{constructor(tag,text=''){this.tagName=tag.toUpperCase();this.children=[];this.textContent=text;}append(...nodes){this.children.push(...nodes);}setAttribute(name,value){this[name]=value;}}
const context=vm.createContext({URL,document:{createElement:tag=>new Node(tag),createTextNode:text=>new Node('#text',text)}});
vm.runInContext(fs.readFileSync(process.env.LIST_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.render=renderMarkdown;',context);
const render=text=>context.render('# heading\n'+text,'cases/001-travel.md');
const text=n=>n.textContent+n.children.map(text).join('');
const walk=n=>[n,...n.children.flatMap(walk)];
test('nested methods stay under their parent and return to the correct sibling',()=>{
 const root=render('- 作者限制\n  1. 人工確認\n     - 不得付款\n  2. 核對來源\n- 下一位作者');
 assert.equal(root.children.length,1);
 const list=root.children[0];assert.equal(list.tagName,'UL');assert.equal(list.children.length,2);
 const steps=list.children[0].children.find(n=>n.tagName==='OL');assert(steps,'numbered steps belong inside their original parent item');
 assert.equal(steps.children.length,2);assert.equal(steps.children[0].children.at(-1).tagName,'UL');
 assert.equal(text(list.children[1]),'下一位作者');
});
test('explicit numbering, mixed sibling list types and paragraph boundaries remain faithful',()=>{
 const root=render('3. 第三步\n7. 第七步\n- 限制\n\n段落\n\n9. 第九步');
 assert.deepEqual(root.children.map(n=>n.tagName),['OL','UL','P','OL']);
 assert.deepEqual(root.children[0].children.map(n=>n.value),[3,7]);
 assert.equal(root.children.at(-1).children[0].value,9);
});
test('real UC-001 interpretation keeps four numbered requirements inside the author limitation',()=>{
 const file=fs.readdirSync('cases').find(p=>p.startsWith('001-'));
 const root=render(fs.readFileSync('cases/'+file,'utf8'));
 const parent=walk(root).find(n=>n.tagName==='LI'&&text(n).startsWith('本庫判讀：這是單一作者'));
 assert(parent);const children=parent.children.find(n=>n.tagName==='OL');assert(children,'UC-001 interpretation must own its four substeps');
 assert.equal(children.children.length,4);assert.deepEqual(children.children.map(n=>n.value),[1,2,3,4]);
});
test('continuations keep source text and safe links without treating fenced lists as markup',()=>{
 const root=render('- 父項\n  補充 [來源](https://example.org/report)\n  - 子項 `<script>`\n\n```text\n- literal\n  1. literal\n```');
 assert.equal(root.children.length,2);assert.equal(root.children[1].tagName,'PRE');
 assert.equal(root.children[0].children[0].children.find(n=>n.tagName==='UL')?.children.length,1);
 assert(text(root).includes('補充 來源'));assert.equal(walk(root).find(n=>n.tagName==='A').href,'https://example.org/report');
 assert.equal(walk(root).filter(n=>n.tagName==='SCRIPT').length,0);
 assert.equal(root.children[1].textContent,'- literal\n  1. literal\n');
});
const {readingPassages,selectSearchPassage}=require(process.env.LIST_READER||'../assets/reader.js');
test('nested list search targets each own row without joining parent and child text',()=>{
 const leaf=(tag,text)=>({tagName:tag,textContent:text,children:[],childNodes:[]});
 const child=leaf('LI','子項限制');child.childNodes=[leaf('#TEXT','子項限制')];
 const nested={tagName:'OL',children:[child]};
 const parent={tagName:'LI',childNodes:[leaf('#TEXT','父項限定'),nested],children:[nested]};
 assert.equal(typeof readingPassages,'function','reader must collect distinct nested list passages');
 const passages=readingPassages({tagName:'UL',children:[parent]});
 assert.deepEqual(passages.map(p=>p.text),['父項限定','子項限制']);
 assert.equal(selectSearchPassage(passages.map(p=>p.text),'限定子項'),null);
 const hit=selectSearchPassage(passages.map(p=>p.text),'子項限制');
 assert.equal(passages[hit.index].node,child);
});
test('an initially indented list has no fabricated parent; boundaries do not swallow following prose',()=>{
 const root=render('  - 第一項\n  - 第二項\n\n## 新段落\n文字\n\n> 限定');
 assert.deepEqual(root.children.map(n=>n.tagName),['UL','H2','P','BLOCKQUOTE']);assert.equal(root.children[0].children.length,2);
});

test('parent continuation after a child list cannot fabricate a contiguous quote',()=>{
 const leaf=text=>({tagName:'#TEXT',textContent:text});
 const child={tagName:'LI',childNodes:[leaf('中段子項')]};
 const parent={tagName:'LI',childNodes:[leaf('父項前段'),{tagName:'UL',children:[child]},leaf('父項後段')]};
 const passages=readingPassages({tagName:'UL',children:[parent]});
 assert.deepEqual(passages.map(p=>p.text),['父項前段','中段子項','父項後段']);
 assert.equal(selectSearchPassage(passages.map(p=>p.text),'前段父項後段'),null);
});
