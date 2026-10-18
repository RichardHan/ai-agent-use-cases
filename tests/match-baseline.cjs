'use strict';
const { chromium }=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();
 fs.mkdirSync('qa-artifacts',{recursive:true});
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.goto(process.env.MATCH_URL||'https://richardhan.github.io/ai-agent-use-cases/',{waitUntil:'networkidle'});
  await page.locator('#results .card').first().waitFor();
  const report={viewport:name,queries:[]};
  for(const q of ['薪水','收件匣','會議記錄']){
   await page.locator('#query').fill(q);
   report.queries.push(await page.evaluate(q=>({q,total:currentFiltered.length,visibleMatches:currentFiltered.filter(e=>termVariants(q).some(v=>norm(e.title+' '+e.summary).includes(v))).length,samples:currentFiltered.slice(0,4).map(e=>({id:e.id,title:e.title,summary:e.summary,matchingLine:e.markdown.split('\n').find(l=>termVariants(q).some(v=>norm(l).includes(v)))}))}),q));
  }
  await page.locator('#query').fill('薪水');
  await page.locator('#results-count').scrollIntoViewIfNeeded();
  await page.screenshot({path:'qa-artifacts/match-before-'+name+'.jpg',type:'jpeg',quality:65});
  console.log('MATCH_IMAGE_before_'+name+'='+fs.readFileSync('qa-artifacts/match-before-'+name+'.jpg').toString('base64'));
  await page.locator('#results .card .card-bottom button').first().click();
  await page.locator('#detail[open]').waitFor();
  await page.locator('.research-details summary').click();
  report.source=await page.locator('.markdown a').first().getAttribute('href');
  await page.keyboard.press('Escape');
  report.returned=await page.evaluate(()=>!!document.activeElement.closest('#results'));
  console.log('MATCH_REPORT='+JSON.stringify(report));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
