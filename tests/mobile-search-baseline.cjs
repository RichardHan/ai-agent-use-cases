'use strict';
const fs=require('node:fs');
module.exports=async function inspectSearch({browser,origin}){
  const report=[];
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.goto(origin,{waitUntil:'networkidle'});
    await page.locator('#results .card').first().waitFor();
    await page.locator('#explore').scrollIntoViewIfNeeded();
    await page.evaluate(()=>document.getElementById('explore').scrollIntoView({block:'start'}));
    const shot=await page.screenshot({type:'jpeg',quality:75});
    fs.mkdirSync('qa-artifacts',{recursive:true});
    fs.writeFileSync('qa-artifacts/mobile-search-baseline-'+name+'.jpg',shot);
    console.log('VISUAL:mobile-search-baseline-'+name+':'+shot.toString('base64'));
    report.push({viewport:name,...await page.evaluate(()=>{
      const box=id=>document.getElementById(id).getBoundingClientRect();
      return {searchFromHeading:Math.round(box('query').top-box('explore').top),firstResultFromSearch:Math.round(document.querySelector('#results .card').getBoundingClientRect().top-box('query').top),visibleSelects:[...document.querySelectorAll('#filters select')].filter(n=>n.getBoundingClientRect().height>0).length};
    })});
    await context.close();
  }
  console.log('MOBILE_SEARCH_BASELINE '+JSON.stringify(report));
};
