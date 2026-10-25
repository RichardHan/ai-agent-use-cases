'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(process.env.ANCHOR_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({URL,AbortController,setTimeout,clearTimeout,Discovery:require('../assets/discovery.js')});
vm.runInContext(source+'\nthis.choose=(...args)=>selectReadingAnchor(...args)',context);
function node(top,bottom,status=false,related=false){return {closest:()=>related?{}:null,classList:{contains:()=>status},getBoundingClientRect:()=>({top,bottom,height:bottom-top})};}
test('a clipped overview above the disappearing status must not displace the visible source report',()=>{
 const overview=node(-189,267),label=node(495.6,515.4),heading=node(523.4,552.2);
 assert.equal(context.choose([overview,label,heading],140,800),label);
});
test('a visible overview paragraph before the disappearing status cannot anchor the later report',()=>{
 const overview=node(160,267),status=node(400,470,true),label=node(495.6,515.4),heading=node(523.4,552.2);
 assert.equal(context.choose([overview,status,label,heading],140,800,470),label);
});
test('one long paragraph filling the reading viewport retains its position',()=>{
 const paragraph=node(-200,1500);
 assert.equal(context.choose([node(-400,-300),paragraph,node(1520,1550)],140,800),paragraph);
 assert.equal(context.choose([paragraph],140,800,-300),paragraph,'keep a clipped block when it is downstream of the disappearing status');
});
test('hidden blocks, the temporary status, and offscreen starts are excluded',()=>{
 const source=node(160,190);
 assert.equal(context.choose([node(0,0),node(145,155,true),source,node(900,950)],140,800),source);
 assert.equal(context.choose([node(-30,130),node(800,900)],140,800),null);
});
test('normal visible section order is retained',()=>{
 const heading=node(140,170),paragraph=node(180,400);
 assert.equal(context.choose([heading,paragraph],140,800),heading);
});

test('a related section replaced on completion cannot displace the persistent research anchor',()=>{
 const research=node(-200,250),relatedHeading=node(400,440,false,true);
 assert.equal(context.choose([research,relatedHeading],140,800),research);
});
