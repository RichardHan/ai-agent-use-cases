'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({URL,URLSearchParams,AbortController,setTimeout,clearTimeout,Response,Blob,console:{warn(){}},Discovery:require('../assets/discovery.js')});
vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.api={loadInitialCorpus:typeof loadInitialCorpus==="function"?loadInitialCorpus:loadCorpus};',context);
const load=context.api.loadInitialCorpus;
const paths=['cases/001-one.md','cases/002-two.md','sources/pending.md'];
const texts=['one','two','pending'];
const json=(sources=paths.map((path,i)=>({path,markdown:texts[i]})),revision='r1')=>({version:1,revision,sources});
const response=value=>({ok:true,json:async()=>value,text:async()=>value,clone(){return response(value);}});
const parse=(path,text)=>[{path,text,id:text}];
const options=extra=>({bundleRevision:'r1',parseFile:parse,budget:1000,...extra});
const stalled=signal=>new Promise((resolve,reject)=>{if(signal.aborted)reject(Error('abort'));else signal.addEventListener('abort',()=>reject(Error('abort')),{once:true});});

test('one bundle replaces every source request without altering source text or order',async()=>{
 const calls=[],progress=[];const result=await load(paths,options({fetch:async path=>{calls.push(path);return response(json());},onProgress:p=>progress.push({...p})}));
 assert.deepEqual(calls,['corpus.json']);assert.deepEqual(Array.from(result.entries,e=>[e.path,e.text]),paths.map((p,i)=>[p,texts[i]]));assert.deepEqual(Array.from(result.failed),[]);assert.equal(progress.at(-1).succeeded,3);
});
test('a slow but successful bundle avoids a costly per-source fallback',async()=>{
 const calls=[];
 const result=await load(paths,{bundleRevision:'r1',parseFile:parse,budget:8000,fetch:async(path,opt)=>{
  calls.push(path);
  if(path!=='corpus.json')return response(texts[paths.indexOf(path)]);
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(resolve,2700);
   opt.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(Error('abort'));},{once:true});
  });
  return response(json());
 }});
 assert.deepEqual(calls,['corpus.json']);
 assert.deepEqual(Array.from(result.entries,e=>e.text),texts);
 assert.deepEqual(Array.from(result.failed),[]);
});
test('validated corpus is reused on same-revision reload and never across revisions',async()=>{
 const stored=new Map(),calls=[];
 context.location={href:'https://example.test/ai-agent-use-cases/'};
 context.caches={open:async()=>({
  match:async key=>stored.get(key),
  put:async(key,value)=>{stored.set(key,value);},
  keys:async()=>[...stored.keys()].map(key=>({url:new URL(key,context.location.href).href,key})),
  delete:async key=>stored.delete(key.key||key)
 })};
 const fetchBundle=async path=>{calls.push(path);return response({...json(undefined,'r1'),sourceRevision:'source-1'});};
 try {
  await load(paths,options({sourceRevision:'source-1',fetch:fetchBundle}));
  await load(paths,options({sourceRevision:'source-1',fetch:fetchBundle}));
  assert.deepEqual(calls,['corpus.json'],'reload should not request the unchanged bundle');
  const changed=await load(paths,options({bundleRevision:'r2',sourceRevision:'source-2',fetch:async path=>{calls.push(path);return response({...json(undefined,'r2'),sourceRevision:'source-2'});}}));
  assert.deepEqual(calls,['corpus.json','corpus.json']);
  assert.deepEqual(Array.from(changed.entries,e=>e.text),texts);
  await load(paths,options({bundleRevision:'r3',sourceRevision:'source-3',fetch:async()=>response({...json(undefined,'r3'),sourceRevision:'source-3'})}));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(stored.size,2,'older revisions must not accumulate without bound');
 } finally {delete context.caches;delete context.location;}
});
test('corrupt cached corpus is discarded and network bundle restores the search corpus',async()=>{
 const stored=new Map(),calls=[];
 context.caches={open:async()=>({
  match:async key=>stored.get(key),
  put:async(key,value)=>{stored.set(key,value);},
  delete:async key=>stored.delete(key)
 })};
 try {
  await load(paths,options({sourceRevision:'source-1',fetch:async path=>{calls.push(path);return response({...json(),sourceRevision:'source-1'});}}));
  const key=[...stored.keys()][0];
  stored.set(key,response({...json([], 'r1'),sourceRevision:'source-1'}));
  const result=await load(paths,options({sourceRevision:'source-1',fetch:async path=>{calls.push(path);return response({...json(),sourceRevision:'source-1'});}}));
  assert.deepEqual(calls,['corpus.json','corpus.json']);
  assert.deepEqual(Array.from(result.entries,e=>e.text),texts);
 } finally {delete context.caches;}
});
test('stalled cache access and persistence cannot delay a readable bundle',async()=>{
 const never=new Promise(()=>{});
 for(const mode of ['open','match','put']){
  context.caches={open:()=>mode==='open'?never:Promise.resolve({
   match:()=>mode==='match'?never:Promise.resolve(),
   put:()=>mode==='put'?never:Promise.resolve(),
   keys:async()=>[],
   delete:async()=>true
  })};
  try {
   const started=Date.now();
   const result=await load(paths,options({bundleTimeout:300,budget:500,sourceRevision:'source-1',fetch:async()=>response({...json(),sourceRevision:'source-1'})}));
   assert.equal(result.entries.length,3,mode);
   assert(Date.now()-started<450,mode+' delayed the bundle');
  } finally {delete context.caches;}
 }
});
test('cache wait cannot extend a short whole-load budget',async()=>{
 context.caches={open:()=>new Promise(()=>{})};
 try {
  const started=Date.now();
  await load(paths,options({budget:30,bundleTimeout:100,fetch:async()=>response(json())}));
  assert(Date.now()-started<90,'cache read outlived whole-load deadline');
 } finally {delete context.caches;}
});
test('only version-matched bundled sources claim the publication commit',async()=>{
 const sha='a'.repeat(40);
 for(const bundleSha of [sha,'b'.repeat(40),'']){
  vm.runInContext('pinnedSources.clear()',context);
  await load(paths,options({sourceRevision:sha,fetch:async()=>response({...json(),sourceRevision:bundleSha})}));
  assert.equal(context.sourceRevisionFor(paths[0]),bundleSha===sha?sha:'');
 }
 vm.runInContext('pinnedSources.clear()',context);
 let release;const gate=new Promise(resolve=>release=resolve);
 await load(paths,options({sourceRevision:sha,sharedPath:paths[0],fetch:async path=>path==='corpus.json'?(await gate,response({...json(),sourceRevision:sha})):response('newer text'),onSource:items=>{if(items[0].path===paths[0])release();}}));
 assert.equal(context.sourceRevisionFor(paths[0]),'','early independent source cannot claim the bundle revision');
 assert.equal(context.sourceRevisionFor(paths[1]),sha);
 vm.runInContext('pinnedSources.clear()',context);
 let finish;const waiting=new Promise(resolve=>finish=resolve);
 const same=await load(paths,options({sourceRevision:sha,sharedPath:paths[0],parseFile:(path,text)=>[{path,markdown:text}],fetch:async path=>path==='corpus.json'?(await waiting,response({...json(),sourceRevision:sha})):response(texts[0]),onSource:items=>{if(items[0].path===paths[0])finish();}}));
 assert.equal(same.entries[0].markdown,texts[0]);
 assert.equal(context.sourceRevisionFor(paths[0]),sha,'same early source can be pinned once bundle confirms its bytes');
 vm.runInContext('pinnedSources.clear()',context);
 await load(paths,options({sourceRevision:sha,fetch:async path=>path==='corpus.json'?{ok:false,status:503}:response('later deployment')}));
 assert.equal(context.sourceRevisionFor(paths[1]),'','per-file recovery cannot claim an older commit');
});
for(const mode of ['http','bad-json','revision','missing','duplicate','unsafe','bad-text','parse'])test('unusable bundle falls back without publishing untrusted content: '+mode,async()=>{
 const calls=[];const result=await load(paths,options({parseFile:(path,text)=>{if(text==='bad-parse')throw Error('parse');return parse(path,text);},fetch:async path=>{calls.push(path);if(path!=='corpus.json')return response(texts[paths.indexOf(path)]);
 if(mode==='http')return {ok:false,status:404};if(mode==='bad-json')return {ok:true,json:async()=>{throw Error('json');}};
 const b=json();if(mode==='revision')b.revision='old';if(mode==='missing')b.sources.pop();if(mode==='duplicate')b.sources[1]=b.sources[0];if(mode==='unsafe')b.sources[0].path='../secret';if(mode==='bad-text')b.sources[0].markdown=null;if(mode==='parse')b.sources[1].markdown='bad-parse';return response(b);
 }}));assert.deepEqual(Array.from(result.entries,e=>e.text),texts);assert.equal(calls.length,4);assert.deepEqual(Array.from(result.failed),[]);
});
test('shared source opens before a delayed bundle and successful source is not fetched again on fallback',async()=>{
 let release;const gate=new Promise(r=>release=r),seen=[],calls=[];
 const promise=load(paths,options({sharedPath:paths[0],fetch:async path=>{calls.push(path);if(path==='corpus.json'){await gate;return {ok:false,status:404};}return response(texts[paths.indexOf(path)]);},onSource:items=>{seen.push(items[0].text);if(items[0].text==='one')release();}}));
 const result=await promise;assert.equal(seen[0],'one');assert.equal(calls.filter(p=>p===paths[0]).length,1);assert.equal(result.entries.length,3);
});
test('bundle completion cancels a stalled shared request without waiting for its source timeout',async()=>{
 let signal;const result=await load(paths,options({sharedPath:paths[0],fetch:async(path,opt)=>{if(path!=='corpus.json'){signal=opt.signal;return stalled(signal);}return response(json());}}));
 assert(signal.aborted);assert.equal(result.entries.length,3);assert.deepEqual(Array.from(result.failed),[]);
});
test('bundle timeout leaves a budget for fallback, individual failures stay retryable',async()=>{
 const result=await load(paths,options({bundleTimeout:10,timeout:20,fetch:async(path,opt)=>{if(path==='corpus.json')return stalled(opt.signal);if(path===paths[1])return {ok:false,status:404};return response(texts[paths.indexOf(path)]);}}));
 assert.deepEqual(Array.from(result.failed),[paths[1]]);assert.deepEqual(Array.from(result.entries,e=>e.text),['one','pending']);
});
test('stopping while bundle waits retains the already readable shared source and exact missing paths',async()=>{
 const stop=new AbortController();const result=await load(paths,options({signal:stop.signal,sharedPath:paths[0],fetch:async(path,opt)=>path==='corpus.json'?stalled(opt.signal):response('one'),onSource:()=>stop.abort()}));
 assert.equal(result.entries.length,1);assert.deepEqual(Array.from(result.failed),paths.slice(1));
});
test('old catalogs keep the existing per-file loader and pending one-file/multiple-entry behavior',async()=>{
 const calls=[];const result=await load(paths,{parseFile:(path,text)=>path===paths[2]?[{path,id:'P-1'},{path,id:'P-2'}]:parse(path,text),fetch:async path=>{calls.push(path);return response('original');}});
 assert.deepEqual(calls,paths);assert.equal(result.entries.length,4);
});
test('fallback progress includes source failures and counts an empty but successfully fetched source',async()=>{
 const progress=[];const result=await load(paths,options({sharedPath:paths[0],parseFile:(path,text)=>path===paths[2]?[]:parse(path,text),fetch:async path=>path==='corpus.json'||path===paths[1]?{ok:false,status:404}:response('original'),onProgress:p=>progress.push({...p})}));
 assert.deepEqual(Array.from(result.failed),[paths[1]]);assert.equal(result.entries.length,1);assert.deepEqual(progress.at(-1),{completed:3,succeeded:2,entryCount:1,total:3});for(const p of progress){assert(p.succeeded<=p.completed);assert(p.completed<=p.total);}
});
test('whole-load deadline bounds bundle plus fallback, keeping every completed source exactly once',async()=>{
 const progress=[];const result=await load(paths,options({budget:30,bundleTimeout:10,timeout:100,sharedPath:paths[0],fetch:async(path,opt)=>path===paths[0]?response('one'):stalled(opt.signal),onProgress:p=>progress.push({...p})}));
 assert.deepEqual(Array.from(result.entries,e=>e.text),['one']);assert.deepEqual(Array.from(result.failed),paths.slice(1));assert.equal(progress.at(-1).succeeded,1);
});
test('a bundled pending source keeps all entries and fires one source callback for the whole file',async()=>{
 const calls=[];const result=await load(paths,options({parseFile:(path,text)=>path===paths[2]?[{path,id:'P-001'},{path,id:'P-002'}]:parse(path,text),fetch:async()=>response(json()),onSource:items=>calls.push(items)}));
 assert.equal(result.entries.length,4);assert.equal(calls.length,3);assert.equal(calls[2].length,2);
});
test('simultaneous shared and fallback sources never report more successes than completions',async()=>{
 const racePaths=['shared','other'];let release;
 const gate=new Promise(resolve=>release=resolve),progress=[];
 const pending=load(racePaths,options({sharedPath:racePaths[0],fetch:async path=>{
  if(path==='corpus.json')return {ok:false,status:404};
  await gate;return response(path);
 },onProgress:p=>progress.push({...p})}));
 await new Promise(resolve=>setImmediate(resolve));release();
 const result=await pending;assert.equal(result.entries.length,2);assert.equal(result.failed.length,0);
 let last=0;for(const p of progress){assert(p.succeeded<=p.completed,JSON.stringify(p));assert(p.completed>=last);assert(p.completed<=p.total);last=p.completed;}
});

// Streaming bundles let the loader judge a live download by its measured rate,
// so a slow-but-finishing bundle is kept and a hopeless one yields early.
const encoder=new TextEncoder();
const chunksOf=(value,count)=>{
 const bytes=encoder.encode(JSON.stringify(value)),size=Math.ceil(bytes.length/count),out=[];
 for(let i=0;i<bytes.length;i+=size)out.push(bytes.slice(i,i+size));
 return out;
};
const streamResponse=(chunks,{delay=10,total,hangAfter=Infinity,signal}={})=>({
 ok:true,
 headers:{get:name=>name==='content-length'?String(total??chunks.reduce((n,c)=>n+c.byteLength,0)):null},
 body:{getReader(){let index=0;return {read:async()=>{
  if(signal?.aborted)throw Error('abort');
  if(index>=chunks.length)return {done:true};
  if(index>=hangAfter)return new Promise((resolve,reject)=>{signal?.addEventListener('abort',()=>reject(Error('abort')),{once:true});});
  await new Promise(resolve=>setTimeout(resolve,delay));
  return {done:false,value:chunks[index++]};
 }}}},
 clone(){return this;}
});

test('a slow bundle the measured rate can finish outlives the first-response guard',async()=>{
 const calls=[],chunks=chunksOf(json(),8),started=Date.now();
 const result=await load(paths,options({budget:3000,bundleTimeout:100,fetch:async(path,opt)=>{calls.push(path);return path==='corpus.json'?streamResponse(chunks,{delay:20,signal:opt.signal}):response(texts[paths.indexOf(path)]);}}));
 assert.deepEqual(calls,['corpus.json'],'a finishing bundle must not fall back to per-source reads');
 assert.deepEqual(Array.from(result.entries,e=>e.text),texts);
 assert(Date.now()-started>140,'the 100ms guard must not cut a bundle that is still arriving');
});

test('a bundle whose measured rate cannot finish before the deadline yields early',async()=>{
 const calls=[],chunks=chunksOf(json(),8),started=Date.now();
 const result=await load(paths,options({budget:900,bundleTimeout:5000,fetch:async(path,opt)=>{calls.push(path);return path==='corpus.json'?streamResponse(chunks,{delay:200,signal:opt.signal}):response(texts[paths.indexOf(path)]);}}));
 const elapsed=Date.now()-started;
 assert(elapsed<800,'hopeless bundle must not consume the whole budget, elapsed='+elapsed);
 assert.deepEqual(Array.from(result.entries,e=>e.text),texts);
 assert(calls.includes(paths[0]),'per-source reads must start with the remaining budget');
});

test('a bundle that stops arriving is abandoned after the stall window',async()=>{
 const calls=[],chunks=chunksOf(json(),8),started=Date.now();
 const result=await load(paths,options({budget:4000,bundleStall:150,fetch:async(path,opt)=>{calls.push(path);return path==='corpus.json'?streamResponse(chunks,{delay:10,hangAfter:1,signal:opt.signal}):response(texts[paths.indexOf(path)]);}}));
 const elapsed=Date.now()-started;
 assert(elapsed<1200,'stalled bundle must be abandoned near its stall window, elapsed='+elapsed);
 assert.deepEqual(Array.from(result.entries,e=>e.text),texts);
});

test('a chinese bundle split across chunks decodes without corrupting text',async()=>{
 const shared=json(paths.map((path,i)=>({path,markdown:'中文案例內容測試'.repeat(40)+i})));
 const calls=[];
 const result=await load(paths,{bundleRevision:'r1',parseFile:parse,budget:3000,bundleTimeout:200,fetch:async(path,opt)=>{calls.push(path);return path==='corpus.json'?streamResponse(chunksOf(shared,13),{delay:5,signal:opt.signal}):response('fallback');}});
 assert.deepEqual(calls,['corpus.json']);
 assert(result.entries[0].text.startsWith('中文案例內容測試'),result.entries[0].text.slice(0,40));
});

test('a bundle without a declared length leaves part of the window for per-source reads',async()=>{
 const calls=[],chunks=chunksOf(json(),6),started=Date.now();
 const result=await load(paths,options({budget:1000,bundleTimeout:5000,fetch:async(path,opt)=>{calls.push(path);return path==='corpus.json'?streamResponse(chunks,{delay:150,total:0,signal:opt.signal}):response(texts[paths.indexOf(path)]);}}));
 const elapsed=Date.now()-started;
 assert(elapsed<900,'elapsed='+elapsed);
 assert(calls.includes(paths[0]),'per-source reads must start before the whole-load deadline');
 assert.deepEqual(Array.from(result.entries,e=>e.text),texts);
});

test('compressed content-length is compared with decoded bytes before yielding',async()=>{
 // Browsers hand fetch() the decoded body while content-length counts compressed
 // bytes. Without translating that ratio the projection looks several times
 // faster than the transfer and a hopeless bundle keeps the whole window.
 const calls=[],chunks=chunksOf(json(),20),started=Date.now();
 const decodedBytes=chunks.reduce((n,c)=>n+c.byteLength,0),encodedBytes=Math.round(decodedBytes/4);
 const result=await load(paths,options({budget:3000,encodingRatio:4,bundleTimeout:5000,fetch:async(path,opt)=>{
  calls.push(path);
  return path==='corpus.json'?streamResponse(chunks,{delay:250,total:encodedBytes,signal:opt.signal}):response(texts[paths.indexOf(path)]);
 }}));
 const elapsed=Date.now()-started;
 assert(elapsed<900,'decoded/encoded mismatch must not delay the switch, elapsed='+elapsed);
 assert(calls.includes(paths[0]),'per-source reads must start before the deadline');
 assert.deepEqual(Array.from(result.entries,e=>e.text),texts);
});
