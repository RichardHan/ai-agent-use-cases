'use strict';
const {chromium}=require('playwright'),fs=require('node:fs');
(async()=>{
const output='qa-artifacts/filter-entry';fs.mkdirSync(output,{recursive:true});const report=[];
const browser=await chromium.launch();
for(const width of [1440,390,320]){
 const page=await browser.newPage({viewport:{width,height:width===1440?1000:844}});
 await page.goto('https://richardhan.github.io/ai-agent-use-cases/?sort=reviewed#explore');
 await page.waitForFunction(()=>discoveryReady,null,{timeout:60000});
 await page.locator('#filter-summary').scrollIntoViewIfNeeded();
 await page.screenshot({path:`${output}/before-${width}.png`});
 report.push(await page.evaluate(()=>({width:innerWidth,filterSummary:document.querySelector('#filter-summary').textContent,sort:document.querySelector('#sort').value,feedbackHidden:document.querySelector('#search-feedback').hidden,optionsOpen:document.querySelector('#filter-options').open,tools:document.querySelector('#tool').options.length,categories:document.querySelector('#category').options.length,sortNote:document.querySelector('#search-order-note').getBoundingClientRect().top,resultsTop:document.querySelector('#results').getBoundingClientRect().top,failed:[...failedPaths]})));
 await page.close();
}
await browser.close();fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));console.log(report);
})().catch(e=>{console.error(e);process.exit(1)});
