'use strict';

function collectPageErrors(page,row,getPhase){
 row.pageErrors=[];
 page.on('pageerror',error=>{
  row.errors.push(error.message);
  row.pageErrors.push({message:error.message,stack:error.stack||null,url:page.url(),phase:getPhase()});
 });
}
module.exports={collectPageErrors};
