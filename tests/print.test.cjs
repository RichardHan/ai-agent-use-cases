'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createPrintSession}=require('../assets/reader.js');
function fixture(open=false){
 const research={open,isConnected:true},focus={isConnected:true,focus(options){this.options=options;this.focused=true;}};
 const dialog={open:true,scrollTop:521,ownerDocument:{activeElement:focus},querySelectorAll:()=>[research]};
 return {dialog,research,focus};
}
test('printing expands closed original research and restores position, state and focus after cancel',()=>{
 const {dialog,research,focus}=fixture();const session=createPrintSession(dialog);
 session.before();assert(research.open);session.before();dialog.scrollTop=0;
 session.after();assert(!research.open);assert.equal(dialog.scrollTop,521);assert(focus.focused);assert.deepEqual(focus.options,{preventScroll:true});
 session.after();assert(!research.open);
});
test('already expanded research stays expanded and repeated print captures the new reading position',()=>{
 const {dialog,research}=fixture(true);const session=createPrintSession(dialog);
 session.before();session.after();assert(research.open);
 dialog.scrollTop=900;session.before();dialog.scrollTop=0;session.after();assert.equal(dialog.scrollTop,900);
});
test('closed dialog does not change state; replaced research never receives stale restoration',()=>{
 const {dialog,research,focus}=fixture();const session=createPrintSession(dialog);
 dialog.open=false;session.before();assert(!research.open);session.after();assert(!focus.focused);
 dialog.open=true;session.before();research.isConnected=false;focus.isConnected=false;dialog.open=false;
 session.after();assert(research.open);assert(!focus.focused);
});
