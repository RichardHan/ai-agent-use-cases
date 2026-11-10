'use strict';
const {isDescendantOf}=require('./published-check.cjs');

// Step 17 of Website QA walks the published site in Chromium. It used to gate that
// walk on the 60-minute byte comparison from step 15 (`waitForPublishedAssets`), so
// a merge that was published and then immediately replaced by a newer merge could
// never satisfy it: run 42820349847 polled the whole hour and failed with
// PUBLISHED assets mismatch for a site that was healthy. Bytes are step 15's job.
// What step 17 needs is only one answer: which build is the live site serving?
//   * this push's revision -> walk it;
//   * a newer build that contains this push -> somebody else's walk covers it;
//   * anything else after the window -> a real failure, with the revision named.
const DEFAULT_INTERVAL_MS=5000;
const DEFAULT_MAX_DURATION_MS=120000;
const REVISION_TIMEOUT_MS=15000;

// `catalog.json` names the commit Pages built, so one request answers the gate's
// whole question. The query string keeps the CDN and the browser cache out of it.
function liveCatalogUrl(base,sha,attempt){
 const url=new URL('catalog.json',base);
 url.searchParams.set('publication',sha+'-'+attempt+'-revision');
 return url;
}

async function readLiveRevision({base,sha,attempt,fetchAsset=fetch,timeout=REVISION_TIMEOUT_MS}){
 const signal=typeof AbortSignal!=='undefined'&&AbortSignal.timeout?AbortSignal.timeout(timeout):undefined;
 const response=await fetchAsset(liveCatalogUrl(base,sha,attempt),{cache:'no-store',signal});
 if(!response.ok){
  await response.body?.cancel?.();
  throw Object.assign(Error('HTTP '+(response.status||'error')),{status:response.status});
 }
 const catalog=JSON.parse(Buffer.from(await response.arrayBuffer()).toString('utf8'));
 return String(catalog.sourceRevision||'');
}

// isDescendantOf answers in two different ways, and only one of them is a fact:
// "this revision does not contain that push" is stable for a commit pair, while a
// failed fetch says nothing and must be retried on the next poll.
function isNotDescendant(error){
 return /does not contain this push/.test(String(error&&error.message));
}

async function waitForLiveRevision({base,sha,mode='',liveRevision='',fetchAsset=fetch,isDescendant=isDescendantOf,now=()=>Date.now(),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),interval=DEFAULT_INTERVAL_MS,maxDuration=DEFAULT_MAX_DURATION_MS}){
 if(!sha)throw Error('GITHUB_SHA is required to compare the published revision');
 if(mode==='superseded'){
  // Step 15 already compared this push's changed bytes against the live site, so a
  // superseded verdict needs no network at all: the walk belongs to the newer build
  // and to the main run of the commit that published it.
  return {mode:'superseded',liveRevision:String(liveRevision||''),attempts:0,reason:'declared by the publication gate'};
 }
 const started=now(),deadline=started+maxDuration;
 // A revision pair is answered once; a repeated poll asks the same commit question.
 // Only definitive answers are cached, so one transient git/network failure cannot
 // outlive every later retry.
 const ancestry=new Map();
 let attempts=0,observed='',problem='';
 const newerBuild=live=>{
  if(ancestry.has(live))return ancestry.get(live);
  let verdict;
  try{
   verdict={newer:Boolean(isDescendant(sha,live))};
  }catch(error){
   if(isNotDescendant(error))verdict={newer:false,note:'the live revision does not contain this push'};
   else return {newer:false,note:'cannot compare revisions: '+(error&&error.message?error.message:error)};
  }
  ancestry.set(live,verdict);
  return verdict;
 };
 for(;;){
  // The deadline covers the request, not just the pause between requests: a request
  // that may wait its full 15s timeout would otherwise push a "120s" gate past its
  // window, which is the same class of overrun this module exists to remove.
  const budget=deadline-now();
  if(budget<=0)break;
  attempts++;
  try{
   observed=await readLiveRevision({base,sha,attempt:attempts,fetchAsset,timeout:Math.max(1,Math.min(REVISION_TIMEOUT_MS,budget))});
   problem=observed?'':'catalog.json carries no sourceRevision';
  }catch(error){
   observed='';
   problem='request failed'+(error&&error.status?' (HTTP '+error.status+')':error&&error.code?' ('+error.code+')':'');
  }
  if(observed&&observed===sha)return {mode:'exact',liveRevision:observed,attempts,reason:'the live build is this push'};
  if(observed){
   const verdict=newerBuild(observed);
   if(verdict.newer)return {mode:'superseded',liveRevision:observed,attempts,reason:'the live build is a newer build that contains this push'};
   problem=verdict.note||problem;
  }
  const remaining=deadline-now();
  if(remaining<=0)break;
  await sleep(Math.min(interval,remaining));
 }
 throw Error('The published site did not serve this push within '+Math.round(now()-started)+'ms ('+attempts+' attempts); live catalog.json sourceRevision was '+(observed||'unreadable')+(problem?'; last problem: '+problem:''));
}

module.exports={waitForLiveRevision,readLiveRevision,liveCatalogUrl,DEFAULT_INTERVAL_MS,DEFAULT_MAX_DURATION_MS};
