'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({URL,URLSearchParams,AbortController,setTimeout,clearTimeout,console:{warn(){}},Discovery:require('../assets/discovery.js')});
vm.runInContext(fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0]+'\nthis.api={loadInitialCorpus:typeof loadInitialCorpus==="function"?loadInitialCorpus:loadCorpus};',context);
const load=context.api.loadInitialCorpus;
const paths=['cases/001-one.md','cases/002-two.md','sources/pending.md'];
const texts=['one','two','pending'];
const json=(sources=paths.map((path,i)=>({path,markdown:texts[i]})),revision='r1')=>({version:1,revision,sources});
const response=value=>({ok:true,json:async()=>value,text:async()=>value});
const parse=(path,text)=>[{path,text,id:text}];
const options=extra=>({bundleRevision:'r1',parseFile:parse,budget:1000,...extra});
const stalled=signal=>new Promise((resolve,reject)=>{if(signal.aborted)reject(Error('abort'));else signal.addEventListener('abort',()=>reject(Error('abort')),{once:true});});

test('one bundle replaces every source request without altering source text or order',async()=>{
 const calls=[],progress=[];const result=await load(paths,options({fetch:async path=>{calls.push(path);return response(json());},onProgress:p=>progress.push({...p})}));
 assert.deepEqual(calls,['corpus.json']);assert.deepEqual(Array.from(result.entries,e=>[e.path,e.text]),paths.map((p,i)=>[p,texts[i]]));assert.deepEqual(Array.from(result.failed),[]);assert.equal(progress.at(-1).succeeded,3);
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
