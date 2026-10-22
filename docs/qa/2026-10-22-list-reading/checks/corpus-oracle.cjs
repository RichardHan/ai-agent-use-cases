'use strict';
const fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
class Node{constructor(tag,text=''){this.tagName=tag.toUpperCase();this.children=[];this.textContent=text;}append(...nodes){this.children.push(...nodes);}}
function renderer(source){const c=vm.createContext({URL,document:{createElement:tag=>new Node(tag),createTextNode:text=>new Node('#text',text)}});vm.runInContext(source.split('/* Browser event bindings. */')[0]+'\nthis.render=renderMarkdown;',c);return c.render;}
const before=renderer(execFileSync('git',['show','61acdae:assets/app.js'],{encoding:'utf8'})),after=renderer(fs.readFileSync('assets/app.js','utf8'));
const files=fs.readdirSync('cases').filter(p=>p.endsWith('.md')).map(p=>'cases/'+p).concat(fs.readdirSync('evidence').filter(p=>p.endsWith('.md')).map(p=>'evidence/'+p),'sources/pending.md');
const walk=n=>[n,...n.children.flatMap(walk)],text=n=>n.textContent+n.children.map(text).join('');
const rows=[];
for(const file of files){const source=fs.readFileSync(file,'utf8'),a=before(source,file),b=after(source,file),aa=walk(a),bb=walk(b);
 assert.equal(text(a).replace(/\s/g,''),text(b).replace(/\s/g,''),file+' original text');
 assert.deepEqual(aa.filter(n=>n.tagName==='A').map(n=>({label:text(n),href:n.href,target:n.target,rel:n.rel})),bb.filter(n=>n.tagName==='A').map(n=>({label:text(n),href:n.href,target:n.target,rel:n.rel})),file+' links');
 assert.equal(aa.filter(n=>n.tagName==='LI').length,bb.filter(n=>n.tagName==='LI').length,file+' list items');
 rows.push({file,textHash:crypto.createHash('sha256').update(text(b).replace(/\s/g,'')).digest('hex'),links:bb.filter(n=>n.tagName==='A').length,listItems:bb.filter(n=>n.tagName==='LI').length});}
console.log(JSON.stringify({files:rows.length,allTextEqual:true,allLinksEqual:true,allItemCountsEqual:true,rows},null,2));
