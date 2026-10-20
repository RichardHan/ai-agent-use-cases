'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Node{constructor(tag,text=''){this.tagName=tag.toUpperCase();this.children=[];this.textContent=text;}append(...nodes){this.children.push(...nodes);}}
const context=vm.createContext({URL,document:{createElement:tag=>new Node(tag),createTextNode:text=>new Node('#text',text)}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0]+'\nthis.render=renderMarkdown;',context);
const render=text=>context.render('# heading\n'+text,'cases/161-cross-model-response-dataset-audit.md');
const walk=node=>[node,...node.children.flatMap(walk)];
const text=node=>node.textContent+node.children.map(text).join('');
const links=node=>walk(node).filter(n=>n.tagName==='A');
test('real UC-161 evidence links keep the full distinct filenames and no destination residue',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../cases/161-cross-model-response-dataset-audit.md'),'utf8');
 const row=source.split('\n').find(l=>l.includes('[公開CSV]'));
 const result=render(row),actual=links(result);
 const prefix='https://github.com/jojowanuby/LLM-Alignment-Atlas/blob/main/GrokBot%20Workspace%20(copied%20from%20VM)/';
 assert.equal(actual.find(n=>n.textContent==='公開CSV').href,prefix+'llm-alignment-summary-long.csv');
 assert.equal(actual.find(n=>n.textContent==='補檔紀錄').href,prefix+'llm-alignment-summary_README.md');
 assert(!text(result).includes('llm-alignment-summary'));
});
test('nested, encoded and escaped parentheses keep adjacent text and independent links',()=>{
 const result=render('[one](https://example.org/a(b(c)d)/file?q=(x)#part)；[two](../sources/file%28x%29.md) [escaped](https://example.org/a\\(b\\)/file)');
 assert.deepEqual(links(result).map(n=>n.href),['https://example.org/a(b(c)d)/file?q=(x)#part','https://github.com/RichardHan/ai-agent-use-cases/blob/main/sources/file%28x%29.md','https://example.org/a(b)/file']);
 assert.equal(text(result),'one；two escaped');
});
test('unsafe schemes stay text, code stays literal, malformed destinations preserve source text',()=>{
 const result=render('[bad](javascript:alert(1)) [data](data:text/html,hello) [ok](https://example.org/) `[literal](https://example.org/a(b))` [unfinished](folder(a)');
 assert.deepEqual(links(result).map(n=>n.href),['https://example.org/']);
 assert(text(result).includes('[literal](https://example.org/a(b))'));
 assert(text(result).endsWith('[unfinished](folder(a)'));
 assert(walk(result).every(n=>!['SCRIPT','IMG'].includes(n.tagName)));
 for(const link of links(result)){assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');}
});
test('ordinary relative and bare sources retain their existing destinations',()=>{
 const result=render('[source](../sources/README.md#s-001) https://example.org/source');
 assert.deepEqual(links(result).map(n=>n.href),['https://github.com/RichardHan/ai-agent-use-cases/blob/main/sources/README.md#s-001','https://example.org/source']);
});
