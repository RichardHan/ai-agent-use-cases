'use strict';
const fs=require('node:fs');
module.exports=async function arrivalBaseline({browser,origin}){
 const report=[];
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  for(const [label,query] of [['home',''],['search','?q=旅遊&tool=Grok%20Bot'],['empty','?q=no-matching-case-123']]){
   await page.goto(origin+query,{waitUntil:'networkidle'});
   await page.locator('#results-count').filter({hasText:'顯示'}).waitFor();
   const metrics=await page.evaluate(()=>({scrollY,queryTop:Math.round(document.getElementById('query').getBoundingClientRect().top),resultsTop:Math.round(document.getElementById('results-count').getBoundingClientRect().top),focus:document.activeElement.id,results:document.getElementById('results-count').textContent}));
   const shot=await page.screenshot({type:'jpeg',quality:70});
   fs.mkdirSync('qa-artifacts',{recursive:true});fs.writeFileSync('qa-artifacts/arrival-before-'+label+'-'+name+'.jpg',shot);
   console.log('VISUAL:arrival-before-'+label+'-'+name+':'+shot.toString('base64'));
   report.push({viewport:name,label,...metrics});
  }
  await page.goto(origin+'?q=旅遊&tool=Grok%20Bot&case=UC-001',{waitUntil:'networkidle'});
  await page.locator('#detail[open]').waitFor();await page.locator('#close-detail').click();
  report.push({viewport:name,label:'close-shared-detail',...await page.evaluate(()=>({scrollY,focus:document.activeElement.id,resultsTop:Math.round(document.getElementById('results-count').getBoundingClientRect().top)}))});
  await page.close();
 }
 fs.writeFileSync('qa-artifacts/arrival-baseline.json',JSON.stringify(report,null,2));
 console.log('ARRIVAL_BASELINE '+JSON.stringify(report));
};
