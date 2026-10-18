'use strict';
// Compare the cloud WebKit navigation failure with the unchanged main version.
const {webkit}=require('playwright');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const reports=[];
 for(const [label,origin] of [['baseline','http://127.0.0.1:8083/ai-agent-use-cases/'],['updated','http://127.0.0.1:8082/ai-agent-use-cases/']]){
  const browser=await webkit.launch();
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.tracing.start({screenshots:true,snapshots:true});
  const page=await context.newPage(),events=[];
  const report={label,events};
  page.on('crash',()=>events.push('page-crashed'));
  page.on('pageerror',e=>events.push(e.message));
  page.on('requestfailed',request=>events.push(request.url()+': '+request.failure()?.errorText));
  try{
   await page.goto(origin,{waitUntil:'networkidle'});await page.locator('#results .card').first().waitFor();
   await page.locator('#query').fill('旅遊');await page.locator('#scenario').selectOption('生活');
   await page.locator('#tool').selectOption('Grok Bot');await page.locator('#category').selectOption('旅遊／消費研究');
   await page.locator('#results .card .card-bottom button').first().click();
   if(await page.locator('.reader-jump').count()){
    await page.locator('.reader-jump').first().click();await page.keyboard.press('Tab');await page.keyboard.press('Enter');
   }
   await page.keyboard.press('Escape');
   await page.locator('#results .card .card-bottom button').first().click();await page.goBack();
   await page.locator('#query').fill('no-matching-case-123');await page.locator('#empty-reset').click();
   await page.screenshot({path:`qa-artifacts/webkit-${label}-before-navigation.png`});
   events.push('first-journey-complete');
   await page.goto(origin+'?q=PR&case=UC-005',{waitUntil:'networkidle'});
   await page.locator('#detail[open]').waitFor();events.push('long-article-direct-link-complete');
   await page.screenshot({path:`qa-artifacts/webkit-${label}-long-article.png`});report.result='passed';
  }catch(error){report.result='failed';report.error=error.message;}
  await context.tracing.stop({path:`qa-artifacts/webkit-${label}-trace.zip`}).catch(()=>{});
  await browser.close();reports.push(report);
 }
 fs.writeFileSync('qa-artifacts/webkit-diagnostic.json',JSON.stringify(reports,null,2));
 console.log(JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
