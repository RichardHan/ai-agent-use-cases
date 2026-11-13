'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const {spawn}=require('node:child_process');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
function run(origin){
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(__dirname,'deployed-browser.cjs')],{
   cwd:root,env:{...process.env,DEPLOYED_URL:origin,GITHUB_SHA:sha,PUBLICATION_MODE:'superseded',PUBLICATION_LIVE_REVISION:sha}
  });
  let output='';
  child.stdout.on('data',data=>{output+=data;});
  child.stderr.on('data',data=>{output+=data;});
  const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Superseded browser walk exceeded 120s\n'+output));},120000);
  child.on('error',error=>{clearTimeout(timer);reject(error);});
  child.on('close',code=>{clearTimeout(timer);resolve({code,output});});
 });
}
(async()=>{
 // Real HTTP failure, real subprocess and Chromium: a green early return must fail
 // this regression even if the publication gate has already accepted the revision.
 const unavailable=http.createServer((request,response)=>{response.writeHead(503);response.end('Unavailable');});
 await new Promise(resolve=>unavailable.listen(0,'127.0.0.1',resolve));
 try{
  const broken=await run('http://127.0.0.1:'+unavailable.address().port+'/ai-agent-use-cases/');
  assert.notEqual(broken.code,0,'A superseded publication must not pass when the live site returns HTTP 503');
  assert.match(broken.output,/Pages response 503/,'The browser must observe the HTTP failure, not fail during setup');
  console.log('PASS SUPERSEDED REGRESSION: HTTP 503 fails the real browser walk');
 }finally{await new Promise(resolve=>unavailable.close(resolve));}
 const healthy=await run(process.env.ROUND_URL||'http://127.0.0.1:8081/ai-agent-use-cases/');
 assert.equal(healthy.code,0,healthy.output);
 assert.match(healthy.output,/PASS LIVE SUPERSEDED: desktop/);
 assert.match(healthy.output,/PASS LIVE SUPERSEDED: mobile/);
 console.log(healthy.output.trim());
})().catch(error=>{console.error(error);process.exitCode=1;});
