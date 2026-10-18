'use strict';
const {firefox}=require('playwright'),fs=require('node:fs');
(async()=>{const browser=await firefox.launch(),reports=[];
try{
for(const variant of ['baseline','current']){
 const origin='http://127.0.0.1:'+(variant==='baseline'?'8093':'8094')+'/ai-agent-use-cases/';
 for(const settle of [false,true])for(let trial=0;trial<6;trial++){
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await page.addInitScript(()=>{
  Math.random=()=>0.5;window.trace=[];
  for(const name of ['scrollTo','scrollBy']){const original=window[name];window[name]=function(...args){trace.push({type:name,args,time:performance.now(),y:scrollY});return original.apply(this,args);};}
  const original=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(...args){trace.push({type:'scrollIntoView',id:this.id,args,time:performance.now(),y:scrollY});return original.apply(this,args);};
  addEventListener('scroll',()=>trace.push({type:'scroll',time:performance.now(),y:scrollY}));
 });
 let release;const gate=new Promise(r=>release=r);
 await page.route('**/catalog.json',async route=>{await gate;await route.continue();});
 await page.goto(origin+'?q=旅遊',{waitUntil:'domcontentloaded'});
 await page.addStyleTag({content:'html,body{overflow-anchor:none!important}'});
 await page.locator('#query').focus();await page.keyboard.press('Tab');
 if(settle)await page.evaluate(()=>new Promise((resolve,reject)=>{let prev='',stableSince=performance.now(),start=performance.now();function tick(){const rect=document.activeElement.getBoundingClientRect(),state=JSON.stringify([scrollY,rect.top,rect.bottom]),now=performance.now();if(state!==prev){prev=state;stableSince=now;}if(rect.top>=0&&rect.bottom<=innerHeight&&now-stableSince>=200)resolve();else if(now-start>5000)reject(Error('focus scroll never settled'));else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
 const focus=await page.evaluate(()=>document.activeElement.id);
 await page.evaluate(()=>scrollTo({top:100,behavior:'instant'}));
 const before=await page.evaluate(()=>({y:scrollY,focus:document.activeElement.id,behavior:getComputedStyle(document.documentElement).scrollBehavior}));
 release();await page.locator('#results-count').filter({hasText:'顯示'}).waitFor();
 await page.evaluate(()=>new Promise(r=>{let n=0;function tick(){if(++n===12)r();else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
 const after=await page.evaluate(()=>({y:scrollY,focus:document.activeElement.id,trace,allowAutomaticArrival,queryTop:document.getElementById('query').getBoundingClientRect().top}));
 const record={variant,settle,trial,focus,before,after,passed:before.y===100&&after.y===100&&after.focus===focus};reports.push(record);console.log('SCROLL_DIAGNOSTIC '+JSON.stringify(record));await page.close();
 }
}
fs.mkdirSync('qa-artifacts',{recursive:true});fs.writeFileSync('qa-artifacts/scroll-diagnostic.json',JSON.stringify(reports,null,2));
console.log('SCROLL_SUMMARY '+JSON.stringify(['baseline','current'].flatMap(variant=>[false,true].map(settle=>({variant,settle,passed:reports.filter(r=>r.variant===variant&&r.settle===settle&&r.passed).length,total:6})))));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
