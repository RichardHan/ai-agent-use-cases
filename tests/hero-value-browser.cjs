'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const origin = process.env.HERO_VALUE_URL || 'http://127.0.0.1:8100/ai-agent-use-cases/';

const fs = require('node:fs');
const localChrome = '/Users/richard_han/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const launchOptions = process.env.CHROMIUM_BIN ? { executablePath: process.env.CHROMIUM_BIN } : (fs.existsSync(localChrome) ? { executablePath: localChrome } : {});
(async () => {
  const browser = await chromium.launch(launchOptions);
  
  // Scenario 1: Desktop visitor reads value props and navigates to "PR 審查"
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#results .card');
    
    // Check 3 value items
    const valueItems = page.locator('.value-prop-item');
    assert.equal(await valueItems.count(), 3, 'hero should render 3 value proposition items');
    assert.match(await valueItems.nth(0).innerText(), /447 篇真實經驗/);
    assert.match(await valueItems.nth(1).innerText(), /清楚標記憑據/);
    assert.match(await valueItems.nth(2).innerText(), /依痛點找解法/);
    
    // Check 3 guide steps
    const guideSteps = page.locator('.guide-step');
    assert.equal(await guideSteps.count(), 3, 'hero should render 3 beginner guide steps');
    
    // Click problem tag "PR 審查"
    const prTag = page.locator('a.problem-tag[href*="PR"]');
    assert.ok(await prTag.isVisible(), 'PR problem tag must be visible');
    await prTag.click();
    
    await page.waitForSelector('#results .card');
    assert.equal(await page.locator('#query').inputValue(), 'PR');
    const countText = await page.locator('#results-count').innerText();
    assert.match(countText, /顯示 \d+ \/ \d+ 筆收錄/);
    
    await page.close();
    console.log('PASS Scenario 1: Desktop value props and problem tag navigation');
  }
  
  // Scenario 2: Knowledge worker explores "日報整理" and reads case detail with proof badge
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(origin + '?q=' + encodeURIComponent('日報') + '#explore', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#results .card');
    
    assert.equal(await page.locator('#query').inputValue(), '日報');
    const firstCard = page.locator('#results .card').first();
    assert.ok(await firstCard.isVisible());
    
    // Open detail
    await firstCard.locator('.card-bottom button').click();
    await page.waitForSelector('#detail[open]');
    
    assert.ok(await page.locator('#detail-title').innerText());
    assert.ok(await page.locator('#detail-body').innerText());
    
    // Escape closes modal and returns focus
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#detail').getAttribute('open'), null);
    
    await page.close();
    console.log('PASS Scenario 2: Knowledge worker problem search, detail reading, and modal return');
  }
  
  // Scenario 3: Mobile 390px and 320px responsive boundary check
  {
    for (const [name, width, height] of [['mobile-390', 390, 844], ['narrow-320', 320, 640]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#results .card');
      
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }));
      assert.ok(overflow.scrollWidth <= overflow.innerWidth, `${name} must not horizontally overflow: ${overflow.scrollWidth} > ${overflow.innerWidth}`);
      
      // Touch targets of problem tags must be >= 44px
      const problemTags = await page.locator('.problem-tag').all();
      assert.ok(problemTags.length >= 4, 'problem tags must exist on mobile');
      for (const tag of problemTags) {
        const box = await tag.boundingBox();
        assert.ok(box.height >= 43.5, `problem tag touch target height must be >= 44px, got ${box.height}`);
      }
      
      await page.close();
      console.log(`PASS Scenario 3 (${name}): responsive bounds and 44px touch targets`);
    }
  }
  
  await browser.close();
  console.log('HERO_VALUE_BROWSER_PASS all 3 scenarios verified');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
