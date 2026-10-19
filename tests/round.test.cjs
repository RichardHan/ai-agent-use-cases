'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(process.env.ROUND_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({URL,AbortController,setTimeout,clearTimeout,console:{warn(){}},Discovery:require('../assets/discovery.js')});
vm.runInContext(source+'\nthis.api={loadCorpus,prioritizeSharedSource}',context);
test('a successful shared source is published before an unrelated request finishes',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve);const published=[];
 const loading=context.api.loadCorpus(['shared','unrelated'],{concurrency:2,parseFile:(path,text)=>[{id:path,markdown:text}],fetch:async path=>{
  if(path==='unrelated')await gate;return {ok:true,text:async()=>path+' original'};
 },onSource:items=>published.push(...items)});
 try{
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(published.length,1,'shared source should be available while another source is still waiting');
  assert.equal(published[0].markdown,'shared original');
 }finally{release();await loading;}
 assert.deepEqual(published.map(i=>i.id),['shared','unrelated']);
});
test('failed and aborted sources never publish invented or duplicate entries',async()=>{
 const published=[];const controller=new AbortController();
 const result=await context.api.loadCorpus(['shared','failed','queued'],{concurrency:1,signal:controller.signal,parseFile:(path,text)=>[{id:path,markdown:text}],fetch:async path=>({ok:path!=='failed',status:404,text:async()=>path}),onSource:items=>{published.push(...items);controller.abort();}});
 assert.deepEqual(published.map(i=>i.id),['shared']);
 assert.deepEqual(Array.from(result.failed),['failed','queued']);
 assert.equal(result.entries.length,1);
});

test('share scheduling supports existing ID aliases without treating filenames as evidence',()=>{
 const paths=['cases/001-one.md','evidence/008-report.md','cases/359-latest.md','sources/pending.md'];
 for(const target of ['359','UC359','uc-359','#359'])assert.equal(context.api.prioritizeSharedSource(paths,target)[0],'cases/359-latest.md');
 assert.equal(context.api.prioritizeSharedSource(paths,'P-003')[0],'sources/pending.md');
 assert.equal(context.api.prioritizeSharedSource(paths,'UC-008')[0],'evidence/008-report.md');
 for(const target of ['',null,'UC-9999','https://example.com/private','<img>'])assert.deepEqual(Array.from(context.api.prioritizeSharedSource(paths,target)),paths);
 assert.equal(paths[0],'cases/001-one.md','source catalog must remain unchanged');
});
