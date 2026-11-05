'use strict';

function collectPageErrors(page,row,getPhase){
 row.pageErrors=[];
 const events=[];
 const record=(type,details={})=>{
  events.push({type,phase:getPhase(),time:new Date().toISOString(),...details});
  if(events.length>40)events.shift();
 };
 page.on('framenavigated',frame=>{if(frame===page.mainFrame())record('navigation',{url:frame.url()});});
 page.on('requestfailed',request=>record('requestfailed',{url:request.url(),error:request.failure()?.errorText||null}));
 page.on('console',message=>{if(message.type()==='error')record('console-error',{text:message.text()});});
 page.on('pageerror',error=>{
  row.errors.push(error.message);
  row.pageErrors.push({message:error.message,stack:error.stack||null,url:page.url(),phase:getPhase(),recentEvents:[...events]});
 });
}
module.exports={collectPageErrors};
