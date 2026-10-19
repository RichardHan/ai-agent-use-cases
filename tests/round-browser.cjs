'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const base=process.env.ROUND_URL||'https://richardhan.github.io/ai-agent-use-cases/';
(async()=>{
 fs.mkdirSync('qa-artifacts/round',{recursive:true});
 const browser=await chromium.launch();
 const report=[];
 for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto(base);await page.locator('#results .card').first().waitFor();
  await page.screenshot({path:`qa-artifacts/round/before-home-${size}.png`});
  await page.locator('#query').fill('旅遊');
  await page.locator('#filter-options').evaluate(e=>e.open=true);
  await page.locator('#scenario').selectOption('生活');
  await page.screenshot({path:`qa-artifacts/round/before-results-${size}.png`});
  await page.locator('#results .card .card-bottom button').first().click();
  await page.locator('#detail[open]').waitFor();
  await page.screenshot({path:`qa-artifacts/round/before-reader-${size}.png`});
  const before={size,detail:await page.locator('#detail-body').innerText()};
  await page.locator('.research-details summary').click();
  const link=page.locator('.research-details a').first();
  before.source=await link.getAttribute('href');
  const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded').catch(()=>{});before.openedSource=popup.url();await popup.close();
  await page.locator('#close-detail').click();
  before.returnedQuery=await page.locator('#query').inputValue();
  before.returnedScenario=await page.locator('#scenario').inputValue();
  await page.goto(base+'?case=UC-005');await page.locator('#detail[open]').waitFor();
  before.direct=await page.locator('#detail-body').innerText();
  await page.screenshot({path:`qa-artifacts/round/before-direct-${size}.png`});
  report.push(before);fs.writeFileSync('qa-artifacts/round/baseline.json',JSON.stringify(report,null,2));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
