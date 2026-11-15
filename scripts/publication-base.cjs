'use strict';
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');

// A manual run has no push event.before. The operator must choose the complete
// range; guessing HEAD^ can silently omit earlier deletions in a multi-commit push.
try{
 const base=process.env.PUSH_BASE_SHA,head=process.env.GITHUB_SHA;
 const valid=value=>typeof value==='string'&&/^[0-9a-f]{40}$/.test(value)&&!/^0+$/.test(value);
 if(!valid(base))throw Error('base_sha must be a full, nonzero 40-character commit SHA preceding the selected ref');
 if(!valid(head))throw Error('GITHUB_SHA must be a full commit SHA');
 if(base===head)throw Error('base_sha must precede the selected commit; an empty range cannot verify deletions');
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:20000}).trim();
 for(const revision of [base,head]){
  if(git('cat-file','-t',revision)!=='commit')throw Error('Publication endpoints must identify commits');
 }
 try{git('merge-base','--is-ancestor',base,head);}
 catch(error){throw Error('base_sha must be an ancestor of the selected commit and available in the checkout',{cause:error});}
 console.log('Publication comparison range: '+base+'..'+head);
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,'base_sha='+base+'\n');
}catch(error){
 console.error('Publication base validation failed: '+error.message);
 process.exitCode=1;
}
