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
const PUBLISHABLE_FILE=/^(?:assets\/[A-Za-z0-9._-]+\.(?:js|css)|index\.html|cases\/[A-Za-z0-9_-]+\.md|evidence\/[A-Za-z0-9_-]+\.md|sources\/pending\.md)$/;

function parseNameStatus(output){
 return output.split('\n').map(line=>line.trim()).filter(Boolean).map(line=>{
  const [status,...paths]=line.split(/\s+/);
  return {status,path:paths[paths.length-1]};
 });
}

// A push event's `before` SHA is the only reliable description of what this push
// published. Renames and deletions count as changed because the old bytes leaving
// the site is also something the visitor will see.
function changedPublicationPaths(baseSha,headSha,exec=execFileSync){
 const valid=sha=>typeof sha==='string'&&/^[0-9a-f]{40}$/.test(sha)&&!/^0+$/.test(sha);
 if(!valid(baseSha)||!valid(headSha)||baseSha===headSha)return [];
 let output;
 try{
  output=exec('git',['diff','--name-status',baseSha,headSha],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:20000});
 }catch(error){
  throw Error('Cannot list the files this push published: '+error.message,{cause:error});
 }
 return parseNameStatus(String(output)).filter(entry=>PUBLISHABLE_FILE.test(entry.path));
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

module.exports={isCurrentMainCommit,shouldCheckPublishedSha,skipIfSupersededPublishedUrl,changedPublicationPaths,isDescendantOf,PUBLISHABLE_FILE};
