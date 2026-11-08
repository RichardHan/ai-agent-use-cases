'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {isCurrentMainCommit,shouldCheckPublishedSha,skipIfSupersededPublishedUrl,publicationChangeList,parseNameStatus,isDescendantOf}=require('../scripts/published-check.cjs');

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

test('only files a visitor can receive count as published changes',()=>{
 const before='a'.repeat(40),after='b'.repeat(40);
 const calls=[];
 const exec=(command,args)=>{calls.push(args);return [
  'M\tassets/app.js',
  'M\tassets/copy.json',
  'A\tcases/511-grok-bot-zoom-meet-teams-structured-notes.md',
  'D\tevidence/old-note.md',
  'M\tINDEX.md',
  'M\tSITE.md',
  'M\tdocs/qa/2026-11-09-round/README.md',
  'M\ttests/published-version.cjs',
  'R100\tcases/001-travel-checkout.md\tcases/001-travel.md',
  'M\tindex.html',
  'M\tsources/pending.md'
 ].join('\n');};
 const {known,entries}=publicationChangeList(before,after,exec);
 assert.equal(known,true);
 assert.deepEqual(entries,[
  {status:'M',path:'assets/app.js'},
  {status:'M',path:'assets/copy.json'},
  {status:'A',path:'cases/511-grok-bot-zoom-meet-teams-structured-notes.md'},
  {status:'D',path:'evidence/old-note.md'},
  // a rename leaves the old path behind as a deletion and adds the new path
  {status:'D',path:'cases/001-travel-checkout.md'},
  {status:'R100',path:'cases/001-travel.md'},
  {status:'M',path:'index.html'},
  {status:'M',path:'sources/pending.md'}
 ]);
 assert.deepEqual(calls,[['diff','--name-status',before,after]]);
});

test('an unknown push base is reported as unknown, never as an empty diff',()=>{
 for(const [base,head] of [['', 'b'.repeat(40)],['0'.repeat(40),'b'.repeat(40)],[undefined,'b'.repeat(40)],['not-a-sha','b'.repeat(40)]])
  assert.deepEqual(publicationChangeList(base,head,()=>assert.fail('no git call without a real base')),{known:false,entries:[]});
 assert.deepEqual(publicationChangeList('a'.repeat(40),'a'.repeat(40),()=>assert.fail('no diff for an unchanged tip')),{known:true,entries:[]});
 assert.throws(()=>publicationChangeList('a'.repeat(40),'b'.repeat(40),()=>{throw Error('not a git repository');}),/Cannot list the files this push published.*not a git repository/);
});

test('a newer published revision must descend from this push',()=>{
 const calls=[];
 const exec=(command,args)=>{calls.push(args);return '';};
 assert.equal(isDescendantOf('a'.repeat(40),'b'.repeat(40),exec),true);
 assert.deepEqual(calls,[['fetch','--no-tags','origin','b'.repeat(40)],['merge-base','--is-ancestor','a'.repeat(40),'b'.repeat(40)]]);
 let fetched=0;
 const notAncestor=(command,args)=>{if(args[0]==='fetch'){fetched++;return '';}throw Object.assign(Error('exit 1'),{status:1});};
 assert.throws(()=>isDescendantOf('a'.repeat(40),'b'.repeat(40),notAncestor),/does not contain this push/);
 assert.equal(fetched,1,'the live revision is fetched before the comparison');
 assert.throws(()=>isDescendantOf('a'.repeat(40),'not-a-sha',exec),/not a commit SHA/);
 assert.throws(()=>isDescendantOf('a'.repeat(40),'b'.repeat(40),()=>{throw Error('authentication failed');}),/Cannot fetch the published revision.*authentication failed/);
});

test('the pull-request gate never asserts the published site and no branch trigger duplicates pull requests',()=>{
 const workflows=path.join(__dirname,'..','.github','workflows');
 const load=fs.readFileSync(path.join(workflows,'load-recovery-qa.yml'),'utf8');
 assert.match(load,/on:\s*\n\s*workflow_dispatch:/,'the production walk stays runnable by hand');
 assert.match(load,/- name: Walk the current published website\s+if: \$\{\{ github\.event_name == 'workflow_dispatch' \}\}/,'production walk must not run from a pull request');
 // source-guide-qa.yml has a pull_request trigger, so its fix/** push trigger only
 // ran the same commit twice. reader-context-round.yml has no pull_request trigger
 // at all, so its fix/** branch stays.
 const guarded=fs.readFileSync(path.join(workflows,'source-guide-qa.yml'),'utf8');
 assert.doesNotMatch(guarded,/fix\/\*\*/,'duplicate push trigger removed: source-guide-qa.yml');
 assert.match(guarded,/pull_request:/,'source-guide-qa.yml still covers pushed commits through its pull request');
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

test('published browser entrypoints skip stale main SHAs before comparing Pages assets',()=>{
 const names=[
  // published-version.cjs is deliberately absent: it now verifies a newer build
  // instead of skipping it, so it no longer carries the stale-SHA escape hatch.
  'card-refinement-browser.cjs','corpus-browser.cjs','load-recovery-live.cjs',
  'reader-browser.cjs','reader-controls-browser.cjs','reading-flow-browser.cjs','related-browser.cjs',
  'return-visibility-browser.cjs','search-context-live.cjs','transient-loading-published.cjs','trust-published.cjs'
 ];
 const missing=names.filter(name=>!fs.readFileSync(path.join(__dirname,name),'utf8').includes('skipIfSupersededPublishedUrl'));
 assert.deepEqual(missing,[],'missing published browser guard: '+missing.join(', '));
 const workflows=path.join(__dirname,'..','.github','workflows');
 const source=fs.readdirSync(workflows).map(file=>fs.readFileSync(path.join(workflows,file),'utf8')).join('\n');
 for(const name of ['published-version.cjs','transient-loading-published.cjs','reading-flow-browser.cjs','related-browser.cjs','reader-browser.cjs','return-visibility-browser.cjs','trust-published.cjs'])
  assert(source.includes('tests/'+name),'workflow coverage must retain '+name);
 for(const [workflow,testFile] of [['round-qa.yml','round-browser.cjs'],['print-reading-qa.yml','print-browser.cjs']]){
  const text=fs.readFileSync(path.join(workflows,workflow),'utf8');
  assert(text.includes('node tests/'+testFile),workflow+' must retain its public browser journey');
  assert(text.includes('SKIP_PUBLISHED_BROWSER_CHECK superseded or unverifiable'),workflow+' must gate the complete live browser step');
 }
});
