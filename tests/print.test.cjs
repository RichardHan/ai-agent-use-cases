'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createPrintSession}=require('../assets/print.js');
function fixture(){
 const details=[{open:false,isConnected:true},{open:true,isConnected:true}];
 let focused=0;
 const active={isConnected:true,focus:()=>focused++};
 const doc={activeElement:active};
 const dialog={open:true,scrollTop:420,querySelectorAll:()=>details,contains:node=>node===active};
 return {details,dialog,doc,get focused(){return focused;}};
}
test('native print temporarily opens every research section then restores reading state',()=>{
 const f=fixture(),session=createPrintSession(f.dialog,f.doc);
 session.before();assert.deepEqual(f.details.map(x=>x.open),[true,true]);
 f.dialog.scrollTop=0;session.after();
 assert.deepEqual(f.details.map(x=>x.open),[false,true]);
 assert.equal(f.dialog.scrollTop,420);assert.equal(f.focused,1);
 session.after();assert.equal(f.focused,1);
});
test('repeated print events do not overwrite the original reading state',()=>{
 const f=fixture(),session=createPrintSession(f.dialog,f.doc);
 session.before();session.before();session.after();
 assert.equal(f.details[0].open,false);
 session.before();session.after();assert.equal(f.details[0].open,false);
});
test('closed reader leaves homepage printing alone and does not steal focus',()=>{
 const f=fixture(),session=createPrintSession(f.dialog,f.doc);
 f.dialog.open=false;session.before();session.after();
 assert.equal(f.details[0].open,false);assert.equal(f.focused,0);
 f.dialog.open=true;session.before();f.dialog.open=false;session.after();
 assert.equal(f.focused,0);
});
