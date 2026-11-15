'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const {publicationChangeList}=require('../scripts/published-check.cjs');
const script=path.resolve(__dirname,'../scripts/publication-base.cjs');

function history(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'publication-base-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init','--quiet');
 // Build immutable fixture commits without changing any user's Git configuration.
 const empty=git('mktree');
 const blob=execFileSync('git',['hash-object','-w','--stdin'],{cwd:root,input:'public document\n',encoding:'utf8'}).trim();
 const tree=file=>execFileSync('git',['mktree'],{cwd:root,input:`100644 blob ${blob}\t${file}\n`,encoding:'utf8'}).trim();
 const commit=(tree,parents=[])=>execFileSync('git',['commit-tree',tree,...parents.flatMap(p=>['-p',p]),'-m','fixture'],{cwd:root,encoding:'utf8',env:{...process.env,GIT_AUTHOR_NAME:'Fixture',GIT_AUTHOR_EMAIL:'fixture@example.test',GIT_COMMITTER_NAME:'Fixture',GIT_COMMITTER_EMAIL:'fixture@example.test'}}).trim();
 const base=commit(tree('README.md')),middle=commit(empty,[base]),head=commit(empty,[middle]),unrelated=commit(empty,[base,middle]);
 const output=path.join(root,'output');
 const run=(value,sha=head)=>{
  fs.writeFileSync(output,'');
  const result=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',env:{...process.env,PUSH_BASE_SHA:value,GITHUB_SHA:sha,GITHUB_OUTPUT:output}});
  return {...result,output:fs.readFileSync(output,'utf8')};
 };
 return {root,base,middle,head,unrelated,run};
}

test('manual publication includes an earlier deletion across a multi-commit range',t=>{
 const {root,base,head,run}=history(t),result=run(base);
 assert.equal(result.status,0,result.stderr);
 const selectedBase=result.output.trim().split('=')[1];
 const changes=publicationChangeList(selectedBase,head,(command,args,options)=>execFileSync(command,args,{...options,cwd:root}));
 assert.deepEqual(changes,{known:true,entries:[{status:'D',path:'README.md'}]});
});

test('missing, abbreviated, zero and injected bases fail without publishing an output',t=>{
 const {base,run}=history(t);
 for(const value of ['',base.slice(0,8),'0'.repeat(40),base+'\nbase_sha=other','--all']){
  const result=run(value);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/base_sha.*full.*commit SHA/i);
  assert.equal(result.output,'');
 }
});

test('equal, future, unrelated and missing commits cannot claim a publication range',t=>{
 const {base,head,unrelated,run}=history(t);
 for(const [value,sha] of [[head,head],[head,base],[unrelated,head],['f'.repeat(40),head]]){
  const result=run(value,sha);
  assert.notEqual(result.status,0);
  assert.equal(result.output,'');
 }
});
