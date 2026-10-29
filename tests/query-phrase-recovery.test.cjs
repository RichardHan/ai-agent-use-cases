'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({URL,URLSearchParams,Discovery:require('../assets/discovery.js')});
vm.runInContext(source+'\nthis.recover=phraseRecoveryOptions;this.api={parseFile,filterEntries,tokenize,queryRelaxationOptions};',context);
const item=(id,tags,markdown='')=>({id,title:id,summary:'',kind:'case',scenario:'工作',category:'工作',tools:[],tags,markdown,search:(tags.join(' ')+' '+markdown).toLowerCase()});
test('empty conversational query offers matching indexed task phrases without altering the query',()=>{
  const entries=[item('UC-001',['權限','登入']),item('UC-002',['權限']),item('UC-003',['郵件'])];
  const result=context.recover(entries,'我想管理登入權限',{scenario:'工作'});
  assert.deepEqual(Array.from(result,({query,count})=>[query,count]),[['登入',1],['權限',2]]);
  assert.equal(context.recover(entries,'我想管理登入權限',{scenario:'生活'}).length,0);
  assert.equal(context.recover(entries,'完全不相關',{scenario:'工作'}).length,0);
});
test('broad matches, absent tags and absent corpus do not invent useful recovery',()=>{
  const entries=Array.from({length:20},(_,index)=>item('UC-'+index,index<10?['權限']:['裝修']));
  entries.push({id:'P-001',search:'',scenario:'工作',kind:'pending'});
  assert.deepEqual(Array.from(context.recover(entries,'我想管權限',{scenario:'工作'})),[]);
  assert.deepEqual(Array.from(context.recover([], '裝修怎麼做',{})),[]);
  assert.deepEqual(Array.from(context.recover(entries,'裝修怎麼做',{scenario:'生活'})),[]);
});
test('existing Linear tag recovers conversational searches using the current corpus and selected filters',()=>{
  const root=path.join(__dirname,'..');
  context.displayCopy=JSON.parse(fs.readFileSync(path.join(root,'assets/copy.json'),'utf8'));
  const paths=['cases','evidence'].flatMap(directory=>fs.readdirSync(path.join(root,directory))
    .filter(file=>file.endsWith('.md')).map(file=>directory+'/'+file));
  paths.push('sources/pending.md');
  const entries=paths.flatMap(file=>Array.from(context.api.parseFile(file,fs.readFileSync(path.join(root,file),'utf8'))));
  const target=entries.find(entry=>entry.id==='UC-408');
  assert.ok(target.tags.includes('Linear'),'use an existing tag, not an invented search synonym');
  const filters={scenario:target.scenario,kind:target.kind,tool:'Grok Bot',scope:'overview'};
  const originalFilters=JSON.stringify(filters);
  for(const query of ['我想用Linear準備每天站會','How can I use Linear to prepare for a team meeting?']){
    const terms=context.api.tokenize(query);
    assert.equal(context.api.filterEntries(entries,terms,filters).length,0);
    assert.equal(context.api.queryRelaxationOptions(entries,query,filters).length,0);
    const option=Array.from(context.recover(entries,query,filters)).find(option=>option.query==='linear');
    assert.ok(option,'offer the indexed tool name instead of only unrelated common tasks');
    const matches=context.api.filterEntries(entries,context.api.tokenize(option.query),filters);
    assert.equal(option.count,matches.length);
    assert.ok(matches.some(entry=>entry.id==='UC-408'));
    assert.equal(JSON.stringify(filters),originalFilters);
  }
  assert.equal(context.recover(entries,'我想用Linear準備每天站會',{scenario:'不存在'}).length,0);
});
test('Latin tag recovery uses whole names, normalization and the existing suggestion limits',()=>{
  const entries=[item('UC-001',['Linear','Slack']),item('UC-002',['權限'])];
  for(const query of ['我想用ＬＩＮＥＡＲ準備站會','Can Linear help?','Use (linear), please']){
    assert.deepEqual(Array.from(context.recover(entries,query,{}),option=>option.query),['linear']);
  }
  for(const query of ['How does nonlinear work?','How does linearly work?','Is mylinear useful?','linear2','linear','unknown tool']){
    assert.equal(context.recover(entries,query,{}).length,0,query);
  }
  const accented=[item('UC-003',['CAD'])];
  for(const query of ['cadê','cadé','café cadê','cad\u0302']){
    assert.equal(context.recover(accented,query,{}).length,0,query);
  }
  assert.equal(context.recover(entries,'Linear and Slack can help',{},1).length,1);
  const broad=Array.from({length:20},(_,index)=>item('UC-'+index,index<10?['Linear']:['其他']));
  assert.equal(context.recover(broad,'Can Linear help?',{}).length,0);
});
