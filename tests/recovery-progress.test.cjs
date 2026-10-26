'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{id,hidden:false,textContent:'',value:0,setAttribute(){},scrollIntoView(){},querySelector(){return null;},focus(){document.activeElement=this;}});return nodes.get(id);};
 const document={activeElement:node('retry-failed'),getElementById:node};
 const ctx=vm.createContext({AbortController,URLSearchParams,setTimeout,clearTimeout,console:{warn(){},error(){}},document,location:{search:'?q=旅遊&scenario=生活'},Discovery:require('../assets/discovery.js')});
 vm.runInContext(fs.readFileSync(process.env.RECOVERY_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0],ctx);

 vm.runInContext(`discoveryReady=true;entries=[{path:'kept',id:'UC-001',kind:'case'}];failedPaths=['fast','slow'];updateMissingCase=()=>{};refreshCorpusMetadata=()=>{};render=()=>{};updateModalNav=()=>{};refreshRelated=()=>{};preserveRecoveryFocus=()=>()=>{};`,ctx);
 let calls=0,aborted=false,release;
 ctx.fetch=async(path,{signal}={})=>{calls++;if(path==='fast')return {ok:true,text:async()=>'recovered'};return new Promise((resolve,reject)=>{release=()=>resolve({ok:true,text:async()=>'late'});signal?.addEventListener('abort',()=>{aborted=true;reject(Error('aborted'));},{once:true});});};
 vm.runInContext(`parseFile=(path,text)=>[{path,text,id:path==='fast'?'UC-002':'UC-003',kind:'case'}];`,ctx);
 return {ctx,node,document,state:()=>vm.runInContext('({recoveringSources,entries,failedPaths})',ctx),run:()=>vm.runInContext('retryFailedSources()',ctx),stop:()=>vm.runInContext('stopSourceRecovery()',ctx),release:()=>release(),calls:()=>calls,aborted:()=>aborted};
}
async function settle(){await new Promise(resolve=>setTimeout(resolve,0));}
test('slow recovery reports successful progress while keeping existing results usable',async()=>{
 const f=fixture(),done=f.run();await settle();try{assert.match(f.node('partial-message').textContent,/已處理 1 \/ 2 個來源，成功讀取 1 個/);assert.equal(f.node('recovery-progress').value,1);assert.equal(f.node('recovery-progress').max,2);assert.equal(f.node('stop-recovery').hidden,false);assert.equal(f.state().entries[0].path,'kept');await f.run();assert.equal(f.calls(),2);}finally{f.release();await done;}
 assert.equal(f.node('recovery-progress').hidden,true);assert.equal(f.node('stop-recovery').hidden,true);
});
test('stop keeps completed recovery and exact failed paths, then permits another retry',async()=>{
 const f=fixture(),done=f.run();await settle();f.document.activeElement=f.node('stop-recovery');f.stop();f.stop();await f.run();assert.equal(f.calls(),2);await done;
 assert(f.aborted());assert.deepEqual(Array.from(f.state().entries,x=>x.path),['kept','fast']);assert.deepEqual(Array.from(f.state().failedPaths),['slow']);assert.equal(f.state().recoveringSources,false);assert.match(f.node('load-status').textContent,/已停止等待/);assert.equal(f.document.activeElement.id,'retry-failed');
 const second=f.run();await settle();f.release();await second;assert.equal(f.state().failedPaths.length,0);assert.equal(f.state().entries.length,3);assert.equal(f.node('partial-load').hidden,true);assert.equal(f.document.activeElement.id,'results-count');
});
test('completion and stop do not steal focus from a reader who moved elsewhere',async()=>{
 const f=fixture(),done=f.run();await settle();f.document.activeElement=f.node('query');f.stop();await done;assert.equal(f.document.activeElement.id,'query');assert.equal(f.state().entries.length,2);
 f.stop();assert.equal(f.state().entries.length,2);
});

test('stop before any successful recovery retains the entire existing corpus',async()=>{
 const f=fixture();f.ctx.fetch=async(path,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));
 const done=f.run();await settle();f.stop();await done;assert.deepEqual(Array.from(f.state().entries,x=>x.path),['kept']);assert.deepEqual(Array.from(f.state().failedPaths),['fast','slow']);assert.match(f.node('load-status').textContent,/已補回 0 筆/);
});

test('a recovered pending source keeps every item and is not requested on the next retry',async()=>{
 const f=fixture();vm.runInContext("failedPaths=['fast','slow'];parseFile=(path,text)=>path==='fast'?[{path,id:'P-001',kind:'pending'},{path,id:'P-002',kind:'pending'}]:[{path,id:'UC-003',kind:'case'}];",f.ctx);
 const done=f.run();await settle();f.stop();await done;assert.deepEqual(Array.from(f.state().entries,x=>x.id),['UC-001','P-001','P-002']);
 const calls=f.calls(),next=f.run();await settle();assert.equal(f.calls(),calls+1);f.release();await next;assert.equal(f.state().entries.length,4);assert.equal(new Set(Array.from(f.state().entries,x=>x.id)).size,4);
});
