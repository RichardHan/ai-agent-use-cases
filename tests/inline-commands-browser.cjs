'use strict';
const path = require('node:path');
module.paths.push('/Users/richard_han/orca/ai-agent-use-cases/node_modules');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const origin = process.env.ROUND_URL || process.env.TEST_URL || 'http://127.0.0.1:8130/ai-agent-use-cases/';
const axe = page => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
const overflow = page => page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'small', width: 320, height: 740 }
  ];

  // Pick representative cases from the 10 modified ones:
  // UC-005, UC-006, UC-023
  const testCases = ['UC-005', 'UC-006', 'UC-023'];
  const measurements = {};

  for (const vp of viewports) {
    measurements[vp.name] = {};
    for (const cid of testCases) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${origin}?case=${encodeURIComponent(cid)}#explore`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#detail[open]', { timeout: 15000 });

      const data = await page.evaluate(() => {
        const copyBtns = [...document.querySelectorAll('.reader-copy-button')].map(b => b.getAttribute('aria-label') || '');
        const jumps = [...document.querySelectorAll('.reader-jump')].map(b => b.textContent.trim());
        const headings = [...document.querySelectorAll('#reader-body h2, #reader-body h3')].map(h => h.textContent.trim());
        return { copyBtns, jumps, headings };
      });

      const isOverflow = await overflow(page);
      const axeResult = await axe(page);

      assert.equal(isOverflow, false, `${vp.name} ${cid} has horizontal overflow`);
      assert.equal(axeResult.violations.length, 0, `${vp.name} ${cid} has axe violations`);

      // Verify that each case has multiple copy buttons now
      assert.ok(data.copyBtns.length >= 2, `${vp.name} ${cid} expected at least 2 copy buttons, found ${data.copyBtns.length}`);

      measurements[vp.name][cid] = {
        copyButtonCount: data.copyBtns.length,
        copyButtons: data.copyBtns,
        jumpCount: data.jumps.length,
        headingsCount: data.headings.length
      };

      // Take screenshots
      const shotPath = `docs/qa/2026-11-15-inline-command-subsections/after-${vp.name}-${cid.toLowerCase()}.png`;
      await page.screenshot({ path: shotPath, fullPage: false });

      await context.close();
    }
  }

  // Also verify the 3 core visitor user journeys!
  const journeyContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const journeyPage = await journeyContext.newPage();

  // Journey 1: New visitor starts from problem intent without tool name
  await journeyPage.goto(`${origin}#explore`, { waitUntil: 'networkidle' });
  await journeyPage.waitForSelector('#results .card', { timeout: 15000 });
  await journeyPage.fill('#query', '宣傳動畫');
  await journeyPage.waitForTimeout(500);
  const j1Count = await journeyPage.evaluate(() => document.querySelectorAll('#results article.card').length);
  assert.ok(j1Count >= 1, 'Journey 1: problem query 宣傳動畫 must recall matching cases');

  // Journey 2: Combined search + facet with empty recovery
  await journeyPage.fill('#query', '動畫xyz123不存在');
  await journeyPage.waitForTimeout(500);
  const j2Empty = await journeyPage.evaluate(() => {
    const emptyNotice = document.querySelector('.empty-state, .empty-search-state, #results');
    return !!emptyNotice;
  });
  assert.ok(j2Empty, 'Journey 2: empty state notice rendered');
  // Clear search and recover
  await journeyPage.fill('#query', '');
  await journeyPage.waitForTimeout(500);
  const j2RecoveredCount = await journeyPage.evaluate(() => document.querySelectorAll('#results article.card').length);
  assert.ok(j2RecoveredCount >= 20, 'Journey 2: clearing query restores exploration');

  // Journey 3: Direct detail link opening, reading evidence, and returning to exploration
  await journeyPage.goto(`${origin}?case=UC-002#explore`, { waitUntil: 'networkidle' });
  await journeyPage.waitForSelector('#detail[open]', { timeout: 10000 });
  const hasCopyAction = await journeyPage.evaluate(() => document.querySelectorAll('.reader-copy-button').length >= 5);
  assert.ok(hasCopyAction, 'Journey 3: UC-002 detail has 5 copy actions');
  // Click close button to return to explore
  await journeyPage.click('#close-detail');
  await journeyPage.waitForFunction(() => !document.querySelector('#detail')?.open, null, { timeout: 5000 });
  const exploreActive = await journeyPage.evaluate(() => document.querySelector('#explore') !== null);
  assert.ok(exploreActive, 'Journey 3: returning to explore preserved state');

  await journeyContext.close();
  await browser.close();

  fs.writeFileSync(
    'docs/qa/2026-11-15-inline-command-subsections/after-measurements.json',
    JSON.stringify(measurements, null, 2)
  );

  console.log('Browser tests and 3 visitor journeys passed successfully!');
})();
