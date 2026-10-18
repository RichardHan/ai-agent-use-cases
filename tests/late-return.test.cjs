'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.RETURN_SOURCE_PATH||'assets/app.js','utf8');
const start=source.indexOf('      let cancelled=false',source.indexOf("window.addEventListener('popstate'"));
const end=source.indexOf('\n    }\n  }\n});\nload();',start);
assert(start>0&&end>start,'test executes the actual fragment-return guard');
const guard=source.slice(start,end);
function fixture(){
 let now=0,id=0;const frames=new Map(),timers=new Map(),listeners=new Map(),scrolls=[];
 const target={isConnected:true,y:400,focus(){document.activeElement=target;},getBoundingClientRect(){return {top:this.y,bottom:this.y+36};},scrollIntoView(){scrolls.push(now);this.y=800;}};
 const document={body:{},activeElement:target},fragment={},detail={open:false},location={href:'https://example.org/?q=旅遊#explore'};
 const window={addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);}};
 const context={window,document,location,returnURL:location.href,returnTarget:target,fragment,innerHeight:844,performance:{now:()=>now},$:()=>detail,
  requestAnimationFrame:fn=>{const n=++id;frames.set(n,{at:now+16,fn});return n;},cancelAnimationFrame:n=>frames.delete(n),
  setTimeout:(fn,ms)=>{const n=++id;timers.set(n,{at:now+ms,fn});return n;},clearTimeout:n=>timers.delete(n)};
 vm.runInNewContext(guard,context);
 const advance=until=>{
  while(true){
   const next=[...frames.entries()].map(([n,v])=>({n,...v,map:frames})).concat([...timers.entries()].map(([n,v])=>({n,...v,map:timers}))).sort((a,b)=>a.at-b.at||a.n-b.n)[0];
   if(!next||next.at>until)break;now=Math.max(now,next.at);next.map.delete(next.n);next.fn(now);
  }
  now=until;
 };
 const idle=()=>{assert.equal(frames.size,0,'rAF released');assert.equal(timers.size,0,'timer released');assert.equal([...listeners.values()].reduce((n,s)=>n+s.size,0),0,'input listeners released');};
 return {target,document,detail,location,scrolls,advance,idle,dispatch:type=>{for(const fn of [...(listeners.get(type)||[])])fn();},resume:first=>{
  now=420;const map=first==='frame'?frames:timers;const next=map.entries().next().value;if(next){map.delete(next[0]);next[1].fn(now);}advance(500);
 }};
}
for(const at of [80,180])test(`late return at ${at}ms becomes visible and releases the bounded guard`,()=>{
 const f=fixture();f.advance(at);f.target.y=899;f.advance(500);assert(f.target.y+36<=844,'late return remains visible');assert.equal(f.scrolls.length,1);assert(f.scrolls[0]>=at&&f.scrolls[0]<300);f.idle();
});
for(const type of ['pointerdown','keydown','wheel','touchstart'])test(`new ${type} permanently cancels late scroll correction`,()=>{
 const f=fixture();f.advance(180);f.dispatch(type);f.target.y=899;f.advance(500);assert.equal(f.target.y,899);assert.equal(f.scrolls.length,0);f.idle();
});
for(const change of ['focus','url','modal','removed'])test(`new ${change} wins and return monitoring is cleaned up`,()=>{
 const f=fixture();f.advance(180);if(change==='focus')f.document.activeElement={};if(change==='url')f.location.href+='-new';if(change==='modal')f.detail.open=true;if(change==='removed')f.target.isConnected=false;
 f.target.y=899;f.advance(250);f.document.activeElement=f.target;f.detail.open=false;f.target.isConnected=true;f.target.y=899;f.advance(500);assert.equal(f.target.y,899);assert.equal(f.scrolls.length,0);f.idle();
});
test('scroll after the 300ms deadline is never pulled back',()=>{const f=fixture();f.advance(420);f.target.y=899;f.advance(500);assert.equal(f.target.y,899);assert.equal(f.scrolls.length,0);f.idle();});
for(const first of ['frame','timer'])test(`background resume after deadline: ${first} runs first without late scrolling`,()=>{
 const f=fixture();f.target.y=899;f.resume(first);assert.equal(f.target.y,899);assert.equal(f.scrolls.length,0);f.idle();
});
