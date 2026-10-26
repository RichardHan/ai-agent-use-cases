'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('assets/app.js','utf8');
const binding=source.slice(source.indexOf("document.addEventListener('keydown', e => {"),source.indexOf("window.addEventListener('popstate'"));
function dispatch({key='ArrowRight',selected=false,editable=false,...props}={}){
 let handler,prevented=false;const steps=[];
 const document={activeElement:{closest:()=>editable,tagName:'H2'},addEventListener:(type,fn)=>handler=fn,getSelection:()=>({isCollapsed:!selected})};
 vm.runInNewContext(binding,{document,$:()=>({open:true}),navStep:n=>steps.push(n)});
 handler({key,preventDefault(){prevented=true},...props});return {steps,prevented};
}
for(const key of ['ArrowLeft','ArrowRight']){
 test(`${key} leaves selected reading text and browser default intact`,()=>assert.deepEqual(dispatch({key,selected:true}),{steps:[],prevented:false}));
 test(`${key} keeps normal case navigation when selection is collapsed`,()=>assert.deepEqual(dispatch({key}),{steps:[key==='ArrowLeft'?-1:1],prevented:true}));
}
for(const props of [{editable:true},{isComposing:true},{defaultPrevented:true},{shiftKey:true},{metaKey:true},{ctrlKey:true},{altKey:true}])test(`reading shortcut respects ${Object.keys(props)[0]}`,()=>assert.deepEqual(dispatch(props),{steps:[],prevented:false}));
