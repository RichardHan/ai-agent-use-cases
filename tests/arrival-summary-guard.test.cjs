'use strict';
// The arrival guard keeps the result line the reader is focused on inside the
// viewport when the page moves it afterwards. These tests drive the guard's own
// frame loop: the browser regression (arrival-summary-visibility-browser.cjs)
// proves it survives a real layout shift.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0];

function fixture({countTop=-30,countBottom=-7,cardTop=300,cardBottom=366,height=844,stickyClip=false}={}){
 const frames=[],scrolled=[],listeners=new Map();let clock=0;
 // Scrolling the result line to the top moves it into view, as the browser does.
 let top=countTop,bottom=countBottom;
 const target={id:'results-count',getBoundingClientRect:()=>({top,bottom}),scrollIntoView:()=>{scrolled.push('results-count');if(!stickyClip){top=24;bottom=47;}}};
 const title={getBoundingClientRect:()=>({top:cardTop,bottom:cardBottom})};
 const card={querySelector:selector=>selector==='h3'?title:null};
 const context=vm.createContext({
  URL,URLSearchParams,innerHeight:height,performance:{now:()=>clock},
  requestAnimationFrame:callback=>{frames.push(callback);return frames.length;},
  document:{
   activeElement:target,
   getElementById:id=>id==='results-count'?target:null,
   querySelector:selector=>{
    if(selector==='#results .card')return card;
    if(selector==='#empty h3')return null;
    return null;
   },
   addEventListener:(type,callback)=>listeners.set(type,callback),
   removeEventListener:type=>listeners.delete(type),
  },
  location:{href:'https://example.test/?q=trip#explore'},
  Discovery:require('../assets/discovery.js'),
 });
 vm.runInContext(source+'\nthis.api={watchArrivalSummary,placeArrivalResults};',context);
 const run=()=>{let guard=0;while(frames.length&&guard<500){guard+=1;clock+=20;frames.shift()();}};
 const takeover=type=>{const listener=listeners.get(type);if(listener)listener();};
 return {api:context.api,target,scrolled,run,takeover,listening:()=>[...listeners.keys()]};
}

test('a result line pushed above the viewport is placed back when the case still fits',()=>{
 const f=fixture();
 f.api.watchArrivalSummary(f.target);
 f.run();
 assert.deepEqual(f.scrolled,['results-count'],'the clipped result line is scrolled back into view');
});

test('a short viewport keeps the case instead of fighting for the result line',()=>{
 // 320px tall: the line plus the whole first case cannot share the screen.
 const f=fixture({height:320,cardTop:340,cardBottom:406});
 f.api.watchArrivalSummary(f.target);
 f.run();
 assert.deepEqual(f.scrolled,[],'the case wins when both cannot fit, as the arrival contract says');
});

test('a visible result line is left alone',()=>{
 const f=fixture({countTop:24,countBottom:47});
 f.api.watchArrivalSummary(f.target);
 f.run();
 assert.deepEqual(f.scrolled,[]);
});

test('reader input stops the guard before it can move the page again',()=>{
 const f=fixture();
 f.api.watchArrivalSummary(f.target);
 f.takeover('wheel');
 f.run();
 assert.deepEqual(f.scrolled,[],'scrolling by hand must never be answered with a snap back');
 assert.deepEqual(f.listening(),[],'listeners are removed when the reader takes over');
});

test('the guard is bounded: four placements at most, then it stops',()=>{
 // A page that keeps re-clipping the line must not trap the reader in a loop.
 const f=fixture({stickyClip:true});
 f.api.watchArrivalSummary(f.target);
 f.run();
 assert.equal(f.scrolled.length,4);
 assert.deepEqual(f.listening(),[]);
});
