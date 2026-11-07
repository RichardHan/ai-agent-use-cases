'use strict';
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8099/ai-agent-use-cases/';
const outDir = path.resolve(__dirname, '../docs/qa/2026-11-07-problem-search-roster');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'smallMobile', width: 320, height: 740 }
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    console.log(`[${vp.name}] Navigating to homepage...`);
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.locator('#drawn-case .card').waitFor({ timeout: 10000 });

    // Capture homepage
    await page.screenshot({ path: path.join(outDir, `${vp.name}-01-homepage.png`) });

    // Axe accessibility check on homepage
    const homeAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(homeAxe.violations.length, 0, `Homepage accessibility violations on ${vp.name}: ` + JSON.stringify(homeAxe.violations));

    // SCENARIO 1: Problem-oriented discovery
    console.log(`[${vp.name}] Testing Scenario 1: 社群文案 problem tag...`);
    const copyTag = page.locator('.hero-problem-tags a[href*="社群文案"]');
    assert.ok(await copyTag.isVisible(), '社群文案 tag must be visible');
    await copyTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const copyCount = await page.locator('#results .card').count();
    assert.ok(copyCount >= 5, `社群文案 must recall >= 5 cases (found ${copyCount})`);
    assert.equal(await page.locator('#query').inputValue(), '社群文案');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-02-scenario1-copywriting.png`) });

    console.log(`[${vp.name}] Testing Scenario 1: 排班 search (shift roster isolation)...`);
    await page.locator('#query').fill('如何排班');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const rosterCount = await page.locator('#results .card').count();
    assert.ok(rosterCount >= 1 && rosterCount <= 10, `如何排班 must recall between 1 and 10 cases (found ${rosterCount})`);
    // Verify shift case UC-338 or UC-317 is recalled, and generic UC-006 is not
    const cardTexts = await page.locator('#results .card h3').allInnerTexts();
    assert.ok(cardTexts.some(t => t.includes('輪班') || t.includes('工時') || t.includes('薪水')), 'Roster query must surface shift cases');
    assert.ok(!cardTexts.some(t => t.includes('Facebook 成效')), 'Roster query must NOT match Facebook poster UC-006');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-03-scenario1-roster.png`) });

    // SCENARIO 2: Empty results & Recovery
    console.log(`[${vp.name}] Testing Scenario 2: Combined conflicting filters & empty recovery...`);
    await page.locator('#query').fill('社群文案');
    await page.locator('#search-submit').click();
    await page.evaluate(() => {
      const sel = document.getElementById('scenario');
      sel.value = '生活';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    // Expect empty state or recovery
    await page.locator('#empty').waitFor({ timeout: 5000 });
    assert.ok(await page.locator('#empty').isVisible(), 'Empty state must be visible on conflicting query + scenario');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-04-scenario2-empty.png`) });

    console.log(`[${vp.name}] Testing Scenario 2: Recovering from empty state via condition removal...`);
    // Remove scenario filter
    const removeScenarioBtn = page.locator('#active-filters [data-remove-filter="scenario"]');
    await removeScenarioBtn.waitFor({ timeout: 5000 });
    await removeScenarioBtn.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const recoveredCount = await page.locator('#results .card').count();
    assert.ok(recoveredCount >= 5, `Recovered count must be >= 5 (found ${recoveredCount})`);
    await page.screenshot({ path: path.join(outDir, `${vp.name}-05-scenario2-recovered.png`) });

    // SCENARIO 3: Deep link, reading details, proof inspection, and return
    console.log(`[${vp.name}] Testing Scenario 3: Deep link to UC-268 and return navigation...`);
    await page.goto(origin + '?scenario=創作&case=UC-268#explore', { waitUntil: 'networkidle' });
    await page.locator('#detail[open]').waitFor({ timeout: 10000 });
    const detailTitle = await page.locator('#detail-title').innerText();
    assert.ok(detailTitle.includes('行銷素材'), `Detail title must match UC-268 (got: ${detailTitle})`);

    // Verify detail proof badge and notes
    assert.ok(await page.locator('.detail-header-meta .proof-badge').isVisible(), 'Detail proof badge must be visible');
    assert.ok(await page.locator('.reader-guidance').isVisible(), 'Detail guidance must be visible');

    // Reload check: details must remain open
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#detail[open]').waitFor({ timeout: 10000 });
    assert.ok(await page.locator('#detail-title').isVisible(), 'Detail title must remain visible after reload');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-06-scenario3-detail.png`) });

    // Close detail and verify returned state
    await page.locator('#close-detail').click();
    assert.equal(await page.evaluate(() => document.getElementById('scenario').value), '創作', 'Scenario filter 創作 must be retained after closing detail');
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    await page.screenshot({ path: path.join(outDir, `${vp.name}-07-scenario3-returned.png`) });

    // Verify horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(hasHorizontalOverflow, false, `Horizontal overflow detected on ${vp.name}`);

    assert.equal(pageErrors.length, 0, `Page errors on ${vp.name}: ` + pageErrors.join(', '));
    await context.close();
    console.log(`[${vp.name}] ALL SCENARIOS PASSED.`);
  }

  await browser.close();
  console.log('BROWSER VERIFICATION COMPLETE.');
})().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
