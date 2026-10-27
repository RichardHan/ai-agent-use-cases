'use strict';
const fs=require('node:fs');
const {isCurrentMainCommit}=require('./published-check.cjs');

async function waitForPublishedAssets({base,sha,files,fetchAsset=fetch,isCurrent=isCurrentMainCommit,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=301,interval=5000,maxDuration=25*60*1000}){
 const deadline=Date.now()+maxDuration;
 const expected=files.map(file=>fs.readFileSync(file));
 for(let attempt=0;attempt<attempts&&Date.now()<deadline;attempt++){
  if(!isCurrent(sha))return 'superseded';
  try{
   const matches=await Promise.all(files.map(async(file,index)=>{
    const response=await fetchAsset(new URL(file+'?publication='+encodeURIComponent(sha)+'-'+attempt,base),{cache:'no-store',signal:AbortSignal.timeout(Math.max(1,Math.min(15000,deadline-Date.now())))});
    return response.ok&&Buffer.from(await response.arrayBuffer()).equals(expected[index]);
   }));
   if(matches.every(Boolean))return 'matched';
  }catch(error){
   if(attempt===attempts-1)console.error('Last published asset attempt:',error);
  }
  if(attempt<attempts-1&&Date.now()<deadline)await sleep(Math.min(interval,deadline-Date.now()));
 }
 if(!isCurrent(sha))return 'superseded';
 throw Error('Published assets do not match checkout after '+attempts+' attempts');
}
module.exports={waitForPublishedAssets};
