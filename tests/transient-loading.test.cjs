'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({URL,AbortController,setTimeout,clearTimeout,console:{warn(){}}});
vm.runInContext(fs.readFileSync(process.env.LOADER_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.api={loadCorpus,sourceRetryDelay:typeof sourceRetryDelay==="function"?sourceRetryDelay:null};',context);
const {loadCorpus}=context.api,ok=()=>({ok:true,text:async()=>'原文'});
const options={retryTransient:true,retryDelay:5,timeout:200,parseFile:(path,text)=>[{path,text}]};
test('transient HTTP and network failures recover once without duplicate entries or progress',async()=>{
 for(const status of [408,429,500,502,503,504,'network','body']){
  let calls=0;const progress=[],sources=[];
  const result=await loadCorpus(['a'],{...options,onProgress:p=>progress.push({...p}),onSource:s=>sources.push(s),fetch:async()=>{
   if(++calls===2)return ok();if(status==='network')throw TypeError('connection reset');if(status==='body')return {ok:true,text:async()=>{throw TypeError('body interrupted');}};return {ok:false,status};
  }});
  assert.equal(calls,2,String(status));assert.equal(result.entries.length,1,String(status));assert.deepEqual(Array.from(result.failed),[]);assert.equal(progress.length,1);assert.equal(sources.length,1);assert.equal(progress[0].succeeded,1);
 }
});
test('persistent transient error retries at most once and retains exact failed path',async()=>{
 let calls=0;const r=await loadCorpus(['a'],{...options,fetch:async()=>{calls++;return {ok:false,status:503};}});assert.equal(calls,2);assert.deepEqual(Array.from(r.failed),['a']);
});
test('permanent HTTP and parse errors do not create extra requests',async()=>{
 for(const status of [400,401,403,404,410,501]){let calls=0;const r=await loadCorpus(['a'],{...options,fetch:async()=>{calls++;return {ok:false,status};}});assert.equal(calls,1);assert.equal(r.failed.length,1);}
 let calls=0;const r=await loadCorpus(['a'],{...options,fetch:async()=>{calls++;return ok();},parseFile:()=>{throw Error('invalid source');}});assert.equal(calls,1);assert.equal(r.failed.length,1);
});
test('Retry-After uses seconds or server date and never shortens server waiting time',()=>{
 const delay=context.api.sourceRetryDelay,now=Date.parse('2026-10-23T00:00:00Z');
 assert.equal(delay(null,500,now),500);assert.equal(delay('2',500,now),2000);assert.equal(delay('0',500,now),500);assert.equal(delay('Fri, 23 Oct 2026 00:00:03 GMT',500,now),3000);assert.equal(delay('malformed',500,now),500);
});
test('long Retry-After stays failed instead of delaying the queue or retrying early',async()=>{
 let calls=0;const start=Date.now();const r=await loadCorpus(['a'],{...options,fetch:async()=>{calls++;return {ok:false,status:429,headers:{get:()=> '120'}};}});assert.equal(calls,1);assert.equal(r.failed.length,1);assert(Date.now()-start<100);
});
test('abort during retry waiting cancels immediately without a second request',async()=>{
 const controller=new AbortController();let calls=0;const start=Date.now();const promise=loadCorpus(['a','queued'],{...options,retryDelay:500,timeout:2000,concurrency:1,signal:controller.signal,fetch:async()=>{calls++;setTimeout(()=>controller.abort(),10);return {ok:false,status:503};}});const r=await promise;assert.equal(calls,1);assert.deepEqual(Array.from(r.failed),['a','queued']);assert(Date.now()-start<150);
});
test('whole budget and per-source timeout include waiting; never retry a timed-out request',async()=>{
 for(const bound of [{budget:15,timeout:2000},{timeout:15}]){let calls=0;const r=await loadCorpus(['a'],{...options,...bound,retryDelay:300,fetch:async()=>{calls++;return {ok:false,status:503};}});assert.equal(calls,1);assert.equal(r.failed.length,1);}
 let calls=0;const r=await loadCorpus(['a'],{...options,timeout:10,fetch:async(path,{signal})=>{calls++;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout'))));}});assert.equal(calls,1);assert.equal(r.failed.length,1);
});
test('retry is opt-in and successful shared sources are emitted before another source recovers',async()=>{
 let calls=0;await loadCorpus(['a'],{...options,retryTransient:false,fetch:async()=>{calls++;return {ok:false,status:503};}});assert.equal(calls,1);
 const counts={},seen=[];const result=await loadCorpus(['slow','shared'],{...options,concurrency:2,onSource:items=>seen.push(items[0].path),fetch:async path=>{counts[path]=(counts[path]||0)+1;return path==='slow'&&counts[path]===1?{ok:false,status:503}:ok();}});assert.deepEqual(seen,['shared','slow']);assert.deepEqual(Array.from(result.entries,e=>e.path),['slow','shared']);
});
