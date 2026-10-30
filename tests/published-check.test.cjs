'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {isCurrentMainCommit,shouldCheckPublishedSha,skipIfSupersededPublishedUrl}=require('../scripts/published-check.cjs');

test('published asset check runs for the current main commit',()=>{
 assert.equal(shouldCheckPublishedSha('refs/heads/main','current','current'),true);
});

test('published asset check skips a superseded main commit',()=>{
 assert.equal(shouldCheckPublishedSha('refs/heads/main','older','current'),false);
});

test('published asset check remains enabled for explicit non-main verification branches',()=>{
 assert.equal(shouldCheckPublishedSha('refs/heads/verify/site','branch','current'),true);
});

test('published asset check fails closed when the main tip cannot be read',()=>{
 const previous=process.env.GITHUB_REF;
 process.env.GITHUB_REF='refs/heads/main';
 try{
  assert.throws(()=>isCurrentMainCommit('current',()=>''),/Cannot confirm the main tip/);
  assert.throws(()=>isCurrentMainCommit('current',()=>{throw Error('network unavailable');}),/Cannot confirm the main tip.*network unavailable/);
 }finally{
  if(previous===undefined)delete process.env.GITHUB_REF;
  else process.env.GITHUB_REF=previous;
 }
});

test('published check retries a timed out main-tip lookup without accepting an unknown revision',()=>{
 const previous=process.env.GITHUB_REF;
 process.env.GITHUB_REF='refs/heads/main';
 try{
  let attempts=0;
  assert.equal(isCurrentMainCommit('current',()=>{
   if(++attempts===1)throw Object.assign(Error('network timeout'),{code:'ETIMEDOUT'});
   return 'current';
  }),true);
  assert.equal(attempts,2);
  attempts=0;
  assert.throws(()=>isCurrentMainCommit('current',()=>{
   attempts++;
   throw Object.assign(Error('network timeout'),{code:'ETIMEDOUT'});
  }),/Cannot confirm the main tip.*network timeout/);
  assert.equal(attempts,3);
 }finally{
  if(previous===undefined)delete process.env.GITHUB_REF;else process.env.GITHUB_REF=previous;
 }
});

test('published browser runs skip only stale main runs targeting this Pages site',()=>{
 const previous={ref:process.env.GITHUB_REF,sha:process.env.GITHUB_SHA};
 process.env.GITHUB_REF='refs/heads/main';
 process.env.GITHUB_SHA='older';
 try{
  assert.equal(skipIfSupersededPublishedUrl('https://richardhan.github.io/ai-agent-use-cases/',()=>false),true);
  assert.equal(skipIfSupersededPublishedUrl('http://127.0.0.1:8080/ai-agent-use-cases/'),false);
 }finally{
  if(previous.ref===undefined)delete process.env.GITHUB_REF;else process.env.GITHUB_REF=previous.ref;
  if(previous.sha===undefined)delete process.env.GITHUB_SHA;else process.env.GITHUB_SHA=previous.sha;
 }
});

test('every workflow with an exact published asset assertion checks commit freshness first',()=>{
 const workflows=path.join(__dirname,'..','.github','workflows');
 const all=fs.readdirSync(workflows).filter(file=>file.endsWith('.yml'));
 const signatures=[/Published assets mismatch/i,/Pages assets did not match/i,/PUBLISHED_ASSETS_MATCH/i,/match checkout/i,/read_bytes\(\)==pathlib\.Path/i];
 const checked=all.filter(file=>signatures.some(signature=>signature.test(fs.readFileSync(path.join(workflows,file),'utf8'))));
 const missing=checked.filter(file=>!fs.readFileSync(path.join(workflows,file),'utf8').includes('isCurrentMainCommit'));
 assert.deepEqual(missing,[],'missing freshness guard: '+missing.join(', '));
 assert.ok(checked.length>=22,'workflow audit should cover the known published asset checks');
});

