'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();
 await require('./mobile-search-baseline.cjs')({browser,origin:'http://127.0.0.1:8080/ai-agent-use-cases/'});
 fs.mkdirSync('qa-artifacts',{recursive:true});
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto('http://127.0.0.1:8080/ai-agent-use-cases/',{waitUntil:'networkidle'});
  await page.locator('#results .card').first().waitFor();
  await page.screenshot({path:'qa-artifacts/before-'+name+'.jpg',type:'jpeg',quality:70});
  console.log('VISUAL:before-'+name+':'+fs.readFileSync('qa-artifacts/before-'+name+'.jpg').toString('base64'));
  await page.locator('#query').fill('旅遊');
  await page.locator('#results .card').first().waitFor();
  await page.locator('#results .card h3 button').first().click();
  await page.locator('#detail[open]').waitFor();
  await page.locator('#close-detail').click();
  console.log('BASELINE '+name+': homepage/search/detail/close passed');
  await page.close();
 }
 await require('./search-recovery-browser.cjs')({browser,origin:'http://127.0.0.1:8080/ai-agent-use-cases/',observe:true});
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
