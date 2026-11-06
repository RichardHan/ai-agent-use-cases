'use strict';
const fs=require('node:fs');
const {isCurrentMainCommit}=require('./published-check.cjs');

const PUBLICATION_TIMEOUT_MS=60*60*1000;

// Best-effort evidence only: never turn a publication mismatch into a pass.
async function pagesDeploymentDiagnostic({repository=process.env.GITHUB_REPOSITORY,sha,fetchApi=fetch}){
 if(!/^[\w.-]+\/[\w.-]+$/.test(repository||'')||!/^[a-f0-9]{40}$/i.test(sha))return '';
 const root='https://api.github.com/repos/'+repository+'/deployments';
 const signal=AbortSignal.timeout(5000);
 try{
  const response=await fetchApi(root+'?sha='+sha+'&environment=github-pages&per_page=10',{signal,headers:{Accept:'application/vnd.github+json'}});
  if(!response.ok)return 'Pages deployment diagnostic unavailable (HTTP '+response.status+')';
  const deployments=await response.json();
  const deployment=Array.isArray(deployments)&&deployments.find(item=>item.sha===sha&&item.environment==='github-pages'&&Number.isSafeInteger(item.id));
  if(!deployment)return 'No Pages deployment found for '+sha;
  const statuses=await fetchApi(root+'/'+deployment.id+'/statuses?per_page=1',{signal,headers:{Accept:'application/vnd.github+json'}});
  if(!statuses.ok)return 'Pages deployment '+deployment.id+' status unavailable (HTTP '+statuses.status+')';
  const data=await statuses.json(),state=Array.isArray(data)&&data[0]?.state;
  return 'Pages deployment '+deployment.id+' for '+sha+': '+(/^(success|failure|error|pending|queued|in_progress|inactive)$/.test(state)?state:'unknown');
 }catch{return 'Pages deployment diagnostic unavailable (request failed or timed out)';}
}

async function waitForPublishedAssets({base,sha,files,fetchAsset=fetch,isCurrent=isCurrentMainCommit,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=Infinity,interval=5000,maxDuration=PUBLICATION_TIMEOUT_MS,now=()=>performance.now(),verify,diagnose=pagesDeploymentDiagnostic}){
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
 const diagnostic=await diagnose({sha});
 if(!isCurrent(sha))return 'superseded';
 throw Error('Published assets do not match checkout after '+Math.round(now()-started)+'ms ('+count+' attempts; deadline '+maxDuration+'ms)'+(lastFailures.length?'; last attempt: '+lastFailures.join(', '):'')+(diagnostic?'; '+diagnostic:''),{cause:lastError});
}
module.exports={waitForPublishedAssets,pagesDeploymentDiagnostic,PUBLICATION_TIMEOUT_MS};
