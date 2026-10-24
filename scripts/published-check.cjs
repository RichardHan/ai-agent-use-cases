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
 try{
  mainSha=getMainSha();
 }catch(error){
  console.warn('Could not confirm the main tip; skipping the published asset check. '+error.message);
  return false;
 }
 if(!mainSha){
  console.warn('Could not read the current main commit from origin; skipping the published asset check.');
  return false;
 }
 return shouldCheckPublishedSha(process.env.GITHUB_REF,checkoutSha,mainSha);
}

function getRemoteMainSha(){
 const output=execFileSync('git',['ls-remote','origin','refs/heads/main'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 return output.trim().split(/\s+/)[0];
}

function skipIfSupersededPublishedUrl(url,isCurrent=isCurrentMainCommit){
 if(!url)return false;
 let hostname;
 try{hostname=new URL(url).hostname;}catch{return false;}
 if(hostname!=='richardhan.github.io')return false;
 return !isCurrent(process.env.GITHUB_SHA);
}

module.exports={isCurrentMainCommit,shouldCheckPublishedSha,skipIfSupersededPublishedUrl};
