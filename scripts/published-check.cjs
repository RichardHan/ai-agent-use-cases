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

module.exports={isCurrentMainCommit,shouldCheckPublishedSha,skipIfSupersededPublishedUrl};
