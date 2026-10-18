'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({URL,AbortController,setTimeout,clearTimeout,Discovery:require('../assets/discovery.js')});
vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.api={mergeCorpus,loadCorpus}',context);
test('recovery merges by source path and retains all pending items in stable order',()=>{
 const current=[{path:'cases/a.md',id:'UC-001',kind:'case'},{path:'sources/pending.md',id:'P-001',kind:'pending'}];
 const incoming=[{path:'sources/pending.md',id:'P-002',kind:'pending'},{path:'sources/pending.md',id:'P-001',kind:'pending'},{path:'cases/b.md',id:'UC-002',kind:'case'}];
 const merged=context.api.mergeCorpus(current,incoming);
 assert.deepEqual(Array.from(merged,x=>x.id),['UC-001','UC-002','P-001','P-002']);
 assert.equal(current.length,2);
 assert.deepEqual(Array.from(context.api.mergeCorpus(merged,[]),x=>x.id),Array.from(merged,x=>x.id));
});
test('timed-out source fails independently without losing completed content',async()=>{
 const result=await context.api.loadCorpus(['fast','stalled'],{
  timeout:10,concurrency:2,parseFile:(path,text)=>[{path,text}],
  fetch:async(path,{signal})=>{
   if(path==='fast')return {ok:true,text:async()=>'kept'};
   return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout'))));
  }
 });
 assert.deepEqual(Array.from(result.failed),['stalled']);
 assert.equal(result.entries[0].text,'kept');
});
