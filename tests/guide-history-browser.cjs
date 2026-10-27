'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8147/ai-agent-use-cases/';
(async()=>{
  const browser=await chromium.launch();
  try{
    for(const width of [390,1440]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      await page.goto(base);
      await page.waitForFunction(()=>discoveryReady);
      await page.locator('#guide-options [data-scenario="工作"]').click();
      assert.equal(new URL(page.url()).searchParams.get('scenario'),'工作');
      assert.equal(await page.locator('#guide-options [data-scenario="工作"]').getAttribute('aria-pressed'),'true');
      const historyStops=await page.evaluate(()=>history.length);
      await page.locator('#guide-options [data-scenario="工作"]').click();
      assert.equal(await page.evaluate(()=>history.length),historyStops,'reselecting does not add a history stop');
      await page.goBack();
      assert.equal(new URL(page.url()).searchParams.get('scenario'),null,'Back restores the initial exploration');
      assert.equal(await page.locator('#guide-options [data-scenario=""]').getAttribute('aria-pressed'),'true');
      assert(await page.locator('#drawn-case h3 button').evaluate(n=>n===document.activeElement),'Back focuses the restored card');
      await page.goForward();
      assert.equal(new URL(page.url()).searchParams.get('scenario'),'工作');
      assert.equal(await page.locator('#guide-options [data-scenario="工作"]').getAttribute('aria-pressed'),'true');
      assert(await page.locator('#drawn-case h3 button').evaluate(n=>n===document.activeElement),'Forward focuses the selected card');
      await page.locator('#guide-options [data-scenario="工作"]').click();
      await page.goBack();
      await page.goForward();
      assert(await page.locator('#drawn-case h3 button').evaluate(n=>n===document.activeElement),'Forward retains the guide focus after reselecting');
      await page.locator('#draw-difficulty-options [data-difficulty="入門對話"]').click();
      await page.goBack();
      await page.goForward();
      assert.equal(new URL(page.url()).searchParams.get('difficulty'),'入門對話');
      assert(await page.locator('#drawn-case h3 button').evaluate(n=>n===document.activeElement),'Forward restores the difficulty-adjusted deck focus');
      await page.locator('#drawn-case h3 button').click();
      const stopsBeforeHandoff=await page.evaluate(()=>history.length);
      await page.locator('.plain-overview .detail-action-scenario').click();
      assert.equal(await page.locator('#detail').evaluate(n=>n.open),false);
      assert.equal(new URL(page.url()).searchParams.get('case'),null);
      assert.equal(await page.locator('#results-count').evaluate(n=>n===document.activeElement),true);
      assert.equal(await page.evaluate(()=>history.length),stopsBeforeHandoff,'reader handoff does not push another stop');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.close();
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
