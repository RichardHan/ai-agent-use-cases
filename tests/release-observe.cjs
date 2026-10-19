'use strict';
// Diagnostic preload only: observe the original tests without changing assertions,
// source deadlines, network responses, retry behavior, or application assets.
const fs=require('node:fs'),crypto=require('node:crypto');
const {chromium,firefox,webkit}=require('playwright');
const label=process.env.DIAG_LABEL||'release',root='qa-artifacts/diagnostics/'+label;
fs.mkdirSync(root,{recursive:true});
const origin='https://richardhan.github.io/ai-agent-use-cases/';
const started=Date.now(),report={label,started:new Date().toISOString(),pages:[],holds:[]},pages=[];
let saveTimer=null;
const flush=()=>fs.writeFileSync(root+'/network-state.json',JSON.stringify(report,null,2));
const save=()=>{if(saveTimer===null){saveTimer=setTimeout(()=>{saveTimer=null;flush();},1000);saveTimer.unref();}};
const path=url=>url.startsWith(origin)?url.slice(origin.length):null;
async function snapshot(page,reason){
 const row=pages.find(x=>x.page===page);if(!row||page.isClosed())return;
 try{row.record.snapshots.push({at:Date.now()-started,reason,state:await page.evaluate(()=>({url:location.href,expectedDocument:!!document.getElementById('detail'),ready:typeof discoveryReady==='undefined'?null:discoveryReady,loading:typeof initialLoading==='undefined'?null:initialLoading,entries:typeof entries==='undefined'?null:entries.length,failedPaths:typeof failedPaths==='undefined'?null:[...failedPaths],target:new URLSearchParams(location.search).get('case'),targetParsed:typeof entries==='undefined'?null:entries.some(e=>e.id===new URLSearchParams(location.search).get('case')),dialog:document.getElementById('detail')?.open,errorVisible:document.getElementById('error')?!document.getElementById('error').hidden:null,partialVisible:document.getElementById('partial-load')?!document.getElementById('partial-load').hidden:null,missingVisible:document.getElementById('missing-case')?!document.getElementById('missing-case').hidden:null,loadStatus:document.querySelector('.detail-load-status')?.textContent,partialMessage:document.getElementById('partial-message')?.textContent,loadingSummary:document.getElementById('loading-summary')?.textContent}))});
 await page.screenshot({path:root+'/page-'+row.record.id+'-'+reason.replace(/[^a-z0-9-]/gi,'-')+'.jpg',type:'jpeg',quality:75});
 }catch(e){row.record.snapshotError=e.message;}save();
}
globalThis.releaseObserve={capture:async reason=>{await Promise.all(pages.map(x=>snapshot(x.page,reason)));save();},hold:event=>{report.holds.push({at:Date.now()-started,...event});save();}};
for(const launcher of [chromium,firefox,webkit]){
 const launch=launcher.launch.bind(launcher);launcher.launch=async(...args)=>{
  const browser=await launch(...args),newContext=browser.newContext.bind(browser),close=browser.close.bind(browser);
  browser.newContext=async(...args)=>{
   const context=await newContext(...args),newPage=context.newPage.bind(context);
   context.newPage=async(...args)=>{
    const page=await newPage(...args),record={id:report.pages.length,engine:launcher.name(),viewport:page.viewportSize(),navigations:[],responses:[],failures:[],errors:[],snapshots:[]};
    report.pages.push(record);pages.push({page,record});let navigation=0;const requests=new WeakMap();
    page.on('request',r=>requests.set(r,{navigation,at:Date.now()-started}));
    page.on('requestfailed',r=>{if(path(r.url())!==null){record.failures.push({...requests.get(r),path:path(r.url()),failure:r.failure()});save();}});
    page.on('response',async r=>{const p=path(r.url());if(p===null)return;const entry={...requests.get(r),received:Date.now()-started,path:p,status:r.status(),type:r.headers()['content-type']};record.responses.push(entry);
     if(r.request().isNavigationRequest())try{const text=await r.text();entry.sha256=crypto.createHash('sha256').update(text).digest('hex');entry.hasDetail=text.includes('id="detail"');entry.prefix=text.slice(0,240);}catch(e){entry.bodyError=e.message;}save();});
    page.on('pageerror',e=>{record.errors.push({at:Date.now()-started,message:e.message});save();});
    const goto=page.goto.bind(page);page.goto=async(...args)=>{navigation++;const n={navigation,url:args[0],at:Date.now()-started};record.navigations.push(n);save();try{const response=await goto(...args);n.status=response?.status();return response;}catch(e){n.error=e.message;throw e;}finally{save();}};
    return page;
   };return context;
  };
  browser.close=async(...args)=>{await Promise.all(pages.filter(x=>!x.page.isClosed()).map(x=>snapshot(x.page,'before-browser-close')));return close(...args);};
  return browser;
 };
}
process.on('exit',flush);
