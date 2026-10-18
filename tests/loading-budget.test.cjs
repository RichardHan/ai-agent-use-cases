'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({URL,AbortController,setTimeout,clearTimeout,console:{warn(){}},Discovery:require('../assets/discovery.js')});
vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.api={loadCorpus}',context);
const stalled=(path,{signal}={})=>new Promise((resolve,reject)=>{if(signal?.aborted)reject(Error('aborted'));else signal?.addEventListener('abort',()=>reject(Error('aborted')),{once:true});});
const bounded=promise=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('loader did not finish within test bound')),200);})]).finally(()=>clearTimeout(timer));};
test('whole-corpus budget keeps completed content and marks active plus queued paths for retry',async()=>{
 const requested=[],progress=[];
 const result=await bounded(context.api.loadCorpus(['fast','slow','queued'],{concurrency:1,budget:20,onProgress:p=>progress.push({...p}),parseFile:(path,text)=>[{path,text}],fetch:async(path,options)=>{
  requested.push(path);return path==='fast'?{ok:true,text:async()=>'original source'}:stalled(path,options);
 }}));
 assert.deepEqual(requested,['fast','slow']);assert.deepEqual(Array.from(result.failed),['slow','queued']);assert.equal(result.entries[0].text,'original source');
 assert.equal(progress[0].completed,1);assert.equal(progress[0].succeeded,1);assert.equal(progress[0].total,3);
 assert.equal(progress.at(-1).completed,3);assert.equal(progress.at(-1).succeeded,1);
});
test('choosing available content cancels in-flight work without dropping successful sources',async()=>{
 const controller=new AbortController();
 const result=await bounded(context.api.loadCorpus(['fast','slow','queued'],{concurrency:1,signal:controller.signal,parseFile:(path,text)=>[{path,text}],onProgress:p=>{if(p.succeeded===1)controller.abort();},fetch:async(path,options)=>path==='fast'?{ok:true,text:async()=>'kept'}:stalled(path,options)}));
 assert.equal(result.entries.length,1);assert.deepEqual(Array.from(result.failed),['slow','queued']);
});
test('deadline includes reading the body after HTTP headers',async()=>{
 let signal;
 const result=await bounded(context.api.loadCorpus(['body-stalls'],{budget:15,parseFile:()=>[],fetch:async(path,options)=>{signal=options.signal;return {ok:true,text:()=>stalled(path,{signal})};}}));
 assert.equal(signal.aborted,true);assert.deepEqual(Array.from(result.failed),['body-stalls']);
});
test('per-source timeout frees a worker so later sources can finish before whole budget',async()=>{
 const result=await bounded(context.api.loadCorpus(['slow','fast'],{timeout:10,budget:100,concurrency:1,parseFile:(path,text)=>[{path,text}],fetch:async(path,options)=>path==='fast'?{ok:true,text:async()=>'kept'}:stalled(path,options)}));
 assert.equal(result.entries[0].path,'fast');assert.deepEqual(Array.from(result.failed),['slow']);
});
