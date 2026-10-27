'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {waitForPublishedAssets}=require('../scripts/published-assets.cjs');

test('stale but functional Pages assets are not accepted until every file matches',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pages-assets-'));
 const files=['index.html','assets/app.js'];
 try{
  fs.mkdirSync(path.join(dir,'assets'));
  fs.writeFileSync(path.join(dir,files[0]),'new page');
  fs.writeFileSync(path.join(dir,files[1]),'new script');
  const previous=process.cwd();process.chdir(dir);
  try{
   let round=0,waits=0;
   const result=await waitForPublishedAssets({base:'https://example.test/project/',sha:'abc',files,attempts:3,interval:1,isCurrent:()=>true,sleep:async()=>{round++;waits++;},fetchAsset:async url=>({ok:true,arrayBuffer:async()=>Buffer.from(url.pathname.endsWith('index.html')?'new page':round===0?'old script':'new script')})});
   assert.equal(result,'matched');assert.equal(waits,1);
  }finally{process.chdir(previous);}
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('never accepts stale assets, and superseded commits skip without a false pass',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pages-assets-'));
 try{
  const file=path.join(dir,'asset.js');fs.writeFileSync(file,'current');
  const options={base:'https://example.test/project/',sha:'abc',files:[file],attempts:2,interval:1,fetchAsset:async()=>({ok:true,arrayBuffer:async()=>Buffer.from('old')}),sleep:async()=>{}};
  await assert.rejects(waitForPublishedAssets({...options,isCurrent:()=>true}),/do not match/);
  assert.equal(await waitForPublishedAssets({...options,isCurrent:()=>false}),'superseded');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
