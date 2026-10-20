/* The audit report is the count source; catalog size is a different measure. */
(function(root){
  'use strict';
  function parseSummary(value){
    const text=value?.latestBatch;
    if(typeof text!=='string'||text.length>16000||/^## /m.test(text))return null;
    const heading=text.split('\n')[0].trim();
    const date=heading.match(/^(\d{4}-\d{2}-\d{2})(?:[ \t]+(\d{2}:\d{2}))?(?:\s|$)/);
    if(!date)return null;
    const parsed=new Date(date[1]+'T00:00:00Z');
    if(Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date[1])return null;
    if(date[2]&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(date[2]))return null;
    const matches=[...text.matchAll(/嚴格合格\s*\*\*(\d+)[／/]1,000，尚差\s*(\d+)\*\*/g)];
    if(matches.length!==1)return null;
    const count=Number(matches[0][1]),remaining=Number(matches[0][2]);
    if(!Number.isSafeInteger(count)||!Number.isSafeInteger(remaining)||count<0||remaining<0||count+remaining!==1000)return null;
    return {count,remaining,date:date[1],time:date[2]||''};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={parseSummary};
  if(typeof document==='undefined')return;
  const count=document.getElementById('audit-count'),status=document.getElementById('audit-status'),retry=document.getElementById('audit-retry');
  if(!count||!status||!retry)return;
  let busy=false;
  async function loadSummary(){
    if(busy)return;
    busy=true;retry.disabled=true;count.textContent='—';
    status.textContent='正在讀取核對批次…';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch('audit-summary.json',{cache:'no-cache',signal:controller.signal});
      if(!response.ok)throw Error('Audit unavailable');
      const summary=parseSummary(await response.json());
      if(!summary)throw Error('Audit format unavailable');
      count.textContent=String(summary.count);
      status.textContent='核對批次：'+summary.date+(summary.time?' '+summary.time:'')+'（台灣時間）。不是全庫重新驗證日期。';
      // A focused retry remains a stable control after success.
      retry.hidden=document.activeElement!==retry;
    }catch{
      status.textContent='核對摘要暫時無法讀取，請重試或查看完整報告。';retry.hidden=false;
    }finally{clearTimeout(timer);busy=false;retry.disabled=false;}
  }
  retry.addEventListener('click',loadSummary);
  retry.addEventListener('blur',()=>{if(count.textContent!=='—')retry.hidden=true;});
  loadSummary();
})(typeof globalThis!=='undefined'?globalThis:this);
