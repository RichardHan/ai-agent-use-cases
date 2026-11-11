'use strict';
const {execFileSync}=require('node:child_process');

function shouldCheckPublishedSha(ref,checkoutSha,mainSha){
 if(ref!=='refs/heads/main')return true;
 return Boolean(checkoutSha&&mainSha&&checkoutSha===mainSha);
}

function isCurrentMainCommit(checkoutSha,getMainSha=getRemoteMainSha){
 if(process.env.GITHUB_REF!=='refs/heads/main')return true;
 if(!checkoutSha)throw Error('GITHUB_SHA is required for a published asset check');
 let mainSha;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   mainSha=getMainSha();
   break;
  }catch(error){
   if(error.code==='ETIMEDOUT'&&attempt<3){
    console.warn(`Main tip lookup timed out (attempt ${attempt}/3); retrying`);
    continue;
   }
   throw Error('Cannot confirm the main tip for published verification: '+error.message,{cause:error});
  }
 }
 if(!mainSha){
  throw Error('Cannot confirm the main tip for published verification: origin returned no commit');
 }
 return shouldCheckPublishedSha(process.env.GITHUB_REF,checkoutSha,mainSha);
}

function getRemoteMainSha(){
 const output=execFileSync('git',['ls-remote','origin','refs/heads/main'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:10000});
 return output.trim().split(/\s+/)[0];
}

function skipIfSupersededPublishedUrl(url,isCurrent=isCurrentMainCommit){
 if(!url)return false;
 let hostname;
 try{hostname=new URL(url).hostname;}catch{return false;}
 if(hostname!=='richardhan.github.io')return false;
 return !isCurrent(process.env.GITHUB_SHA);
}

// Files whose exact bytes a visitor can receive. When main has already moved on
// to a newer commit, these are the only bytes this push can still be judged on.
const PUBLISHABLE_FILE=/^(?:assets\/[A-Za-z0-9._-]+\.(?:js|css|json)|index\.html|cases\/[A-Za-z0-9_-]+\.md|evidence\/[A-Za-z0-9_-]+\.md|sources\/pending\.md)$/;

// `git diff --name-status` uses tabs and prints two paths for copies and renames.
// The old path left the site, so a rename is verified as "new bytes present, old
// bytes gone" rather than only checking the destination.
function parseNameStatus(output){
 const entries=[];
 for(const line of output.split('\n')){
  const parts=line.split('\t').map(part=>part.trim()).filter(Boolean);
  if(parts.length<2)continue;
  const status=parts[0];
  if(/^[RC]/.test(status)&&parts.length>=3){entries.push({status:'D',path:parts[1]});entries.push({status,path:parts[2]});continue;}
  entries.push({status,path:parts[parts.length-1]});
 }
 return entries;
}

// A push event's `before` SHA is the only reliable description of what this push
// published. `known:false` means the gate cannot tell whether anything published
// changed, which must never be treated as "nothing changed".
function publicationChangeList(baseSha,headSha,exec=execFileSync){
 const valid=sha=>typeof sha==='string'&&/^[0-9a-f]{40}$/.test(sha)&&!/^0+$/.test(sha);
 if(!valid(baseSha)||!valid(headSha))return {known:false,entries:[]};
 if(baseSha===headSha)return {known:true,entries:[]};
 let output;
 try{
  output=exec('git',['diff','--name-status',baseSha,headSha],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:20000});
 }catch(error){
  throw Error('Cannot list the files this push published: '+error.message,{cause:error});
 }
 return {known:true,entries:parseNameStatus(String(output)).filter(entry=>PUBLISHABLE_FILE.test(entry.path))};
}

// A newer published build only speaks for this push if it descends from it.
// Every publication workflow checks out the full history, so the live revision's
// own parent chain is enough: a shallow fetch would cut that chain and report a
// real ancestor as unrelated.
function isDescendantOf(ancestor,descendant,exec=execFileSync){
 const valid=sha=>typeof sha==='string'&&/^[0-9a-f]{40}$/.test(sha);
 if(!valid(ancestor)||!valid(descendant))throw Error('Published revision is not a commit SHA: '+descendant);
 try{
  exec('git',['fetch','--no-tags','origin',descendant],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:60000});
 }catch(error){
  throw Error('Cannot fetch the published revision '+descendant+': '+error.message,{cause:error});
 }
 try{
  exec('git',['merge-base','--is-ancestor',ancestor,descendant],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:20000});
 }catch(error){
  if(error.status===1)throw Error('Published revision '+descendant+' does not contain this push '+ancestor,{cause:error});
  throw Error('Cannot compare published revision '+descendant+' with this push: '+error.message,{cause:error});
 }
 return true;
}

// What one revision actually contains, as blob hashes, so a served file can be
// compared with the revision the live build claims to be without fetching the file
// again. One tree read answers for every path: a whole-corpus check costs one git
// call instead of one per source.
// isDescendantOf() already fetched the revision, so this reads local objects.
function treeAtRevision(revision,exec=execFileSync){
 const valid=value=>typeof value==='string'&&/^[0-9a-f]{40}$/.test(value);
 if(!valid(revision))throw Error('Published revision is not a commit SHA: '+revision);
 let output;
 try{
  output=exec('git',['ls-tree','-r',revision],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000,maxBuffer:64*1024*1024});
 }catch(error){
  throw Error('Cannot list the published revision '+revision+': '+error.message,{cause:error});
 }
 const tree=new Map();
 for(const line of String(output).split('\n')){
  const entry=/^\d+ (\w+) ([0-9a-f]{40,64})\t(.+)$/.exec(line);
  if(entry)tree.set(entry[3],entry[2]);
 }
 return tree;
}

// The blob hash git would give these bytes, so a comparison against treeAtRevision()
// is the same question as "is this the file that revision contains" — byte equality,
// without a second git read.
function blobHash(bytes){
 const buffer=Buffer.isBuffer(bytes)?bytes:Buffer.from(String(bytes),'utf8');
 return require('node:crypto').createHash('sha1').update('blob '+buffer.length+'\0').update(buffer).digest('hex');
}

module.exports={isCurrentMainCommit,shouldCheckPublishedSha,skipIfSupersededPublishedUrl,publicationChangeList,parseNameStatus,isDescendantOf,treeAtRevision,blobHash,PUBLISHABLE_FILE};
