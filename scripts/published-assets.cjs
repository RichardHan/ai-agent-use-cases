'use strict';
const fs=require('node:fs');
const {isCurrentMainCommit}=require('./published-check.cjs');

const PUBLICATION_TIMEOUT_MS=60*60*1000;

async function waitForPublishedAssets({base,sha,files,fetchAsset=fetch,isCurrent=isCurrentMainCommit,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=Infinity,interval=5000,maxDuration=PUBLICATION_TIMEOUT_MS,now=()=>performance.now(),verify}){
 const started=now(),deadline=started+maxDuration;
 if(!isCurrent(sha))return 'superseded';
 const expected=files.map(file=>fs.readFileSync(file));
 let count=0,lastError,lastFailures=[];
 for(;count<attempts&&now()<deadline;count++){
  if(count>0&&!isCurrent(sha))return 'superseded';
  const remaining=deadline-now();
  if(remaining<=0)break;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),Math.min(15000,remaining));
  const options={cache:'no-store',signal:controller.signal};
  const failures=[];
  const check=async (label,operation)=>{
   try{
    const failure=await operation();
    if(failure)failures.push(label+': '+failure);
    return !failure;
   }catch(error){
    lastError=error;
    failures.push(label+': request failed');
    return false;
   }
  };
  let matches;
  try{
   // Await the whole round, including response bodies, before retrying.
   matches=await Promise.all([
    ...files.map((file,index)=>check(file,async()=>{
     const url=new URL(file,base);
     url.searchParams.set('publication',sha+'-'+count);
     const response=await fetchAsset(url,options);
     if(!response.ok){await response.body?.cancel();return 'HTTP '+(response.status||'error');}
     return Buffer.from(await response.arrayBuffer()).equals(expected[index])?'':'byte mismatch';
    })),
    ...(verify?[check('additional verification',async()=>await verify({base,sha,attempt:count,...options})?'':'mismatch')]:[])
   ]);
   lastFailures=failures;
  }finally{clearTimeout(timer);}
  if(matches.every(Boolean)&&!controller.signal.aborted&&now()<deadline){
   return isCurrent(sha)?'matched':'superseded';
  }
  if(count<attempts-1&&now()<deadline)await sleep(Math.min(interval,deadline-now()));
 }
 if(!isCurrent(sha))return 'superseded';
 throw Error('Published assets do not match checkout after '+Math.round(now()-started)+'ms ('+count+' attempts; deadline '+maxDuration+'ms)'+(lastFailures.length?'; last attempt: '+lastFailures.join(', '):''),{cause:lastError});
}
module.exports={waitForPublishedAssets,PUBLICATION_TIMEOUT_MS};
