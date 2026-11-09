'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const base = process.env.SITE_URL || 'http://127.0.0.1:8175/ai-agent-use-cases/';
const out = process.env.QA_OUT || '/tmp/qa-artifacts-round-20261107';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const report = { scenarios: [], proofChecks: [], audits: [] };

  for (const [width, height, isMobile] of [[1440, 900, false], [390, 844, true]]) {
    const sizeLabel = isMobile ? 'mobile-390' : 'desktop-1440';
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile,
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();

    // --- Scenario 1: New visitor explores without knowing tool names ---
    await page.goto(base);
    await page.waitForFunction(() => discoveryReady, null, { timeout: 30000 });
    assert.equal(await page.locator('#results .card').count() > 0, true);
    const poolCheck = await page.evaluate(() => {
      const pool = Discovery.discoveryPool(entries);
      return { totalPool: pool.length, hasUnverified: pool.some(e => e.proof === '尚待查證'), hasUc447: pool.some(e => e.id === 'UC-447'), hasUc404: pool.some(e => e.id === 'UC-404') };
    });
    assert.equal(poolCheck.hasUnverified, false, 'discoveryPool must exclude 尚待查證');
    assert.equal(poolCheck.hasUc447, false, 'discoveryPool must exclude UC-447');
    assert.equal(poolCheck.hasUc404, false, 'discoveryPool must exclude UC-404');

    // Click hero pain point "旅遊"
    await page.locator('.hero-search-actions .hero-search-link').click();
    await page.locator('#query').fill('旅遊');
    await page.locator('#search-submit').click();
    await page.locator('#results-count').waitFor();
    const travelCount = await page.locator('#results .card').count();
    assert.ok(travelCount > 0, 'Must find cases for 旅遊');
    report.scenarios.push({ scenario: 1, step: 'search-travel', sizeLabel, count: travelCount });
    await page.screenshot({ path: `${out}/scenario1-search-${sizeLabel}.png` });

    // Filter by proof: "尚待查證"
    await page.locator('#filter-options').evaluate(el => el.open = true);
    await page.locator('#proof').selectOption('尚待查證');
    await page.locator('#results-count').waitFor();
    const unverifiedCount = await page.locator('#results .card').count();
    assert.ok(unverifiedCount > 0, 'Must find unverified cases under 尚待查證');
    await page.screenshot({ path: `${out}/scenario1-proof-filter-${sizeLabel}.png` });

    // Verify UC-447 appears in results and its card badge says "尚待查證"
    const card447 = page.locator('#results .card[data-case-id="UC-447"]');
    assert.equal(await card447.count(), 1, 'UC-447 must appear under 尚待查證 filter');
    const badgeText = await card447.locator('.proof').innerText();
    assert.equal(badgeText, '尚待查證', 'UC-447 card badge must be 尚待查證');
    report.proofChecks.push({ id: 'UC-447', cardBadge: badgeText, sizeLabel });
    // --- Scenario 2: Search + filter combination, empty recovery ---
    await page.locator('#query').fill('根本不可能命中的極端測試關鍵字xyz987');
    await page.locator('#empty').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#empty').isVisible(), true);
    await page.screenshot({ path: `${out}/scenario2-empty-${sizeLabel}.png` });

    // Click "清除條件，重新探索" (empty-reset)
    await page.locator('#empty-reset').click();
    await page.waitForFunction(() => !document.getElementById('empty').offsetParent || document.getElementById('empty').style.display === 'none');
    assert.equal(await page.locator('#results .card').count() > 0, true);
    report.scenarios.push({ scenario: 2, step: 'empty-recovered', sizeLabel });
    await page.screenshot({ path: `${out}/scenario2-recovered-${sizeLabel}.png` });

    // --- Scenario 3: Open shared case direct links, evaluate evidence, return ---
    // 3A: Open UC-447 (unverified case)
    await page.goto(`${base}?case=UC-447`);
    await page.locator('#detail[open]').waitFor();
    const detailTitle447 = await page.locator('#detail-title').innerText();
    assert.match(detailTitle447, /長途飛行怕時差/);
    const proofBadge447 = page.locator('.detail-header-meta .proof-badge').first();
    assert.equal(await proofBadge447.innerText(), '尚待查證');
    const proofNote447 = await page.locator('.detail-proof-note');
    assert.match(await proofNote447.innerText(), /尚待查證/);
    assert.match(await proofNote447.innerText(), /社群線索或待辦想法，證據尚不充分/);
    await page.screenshot({ path: `${out}/scenario3-uc447-detail-${sizeLabel}.png` });

    // Expand source section
    const sourceBtn = page.locator('.reader-report-open').filter({ hasText: '來源與版本' });
    if (await sourceBtn.count() > 0) {
      await sourceBtn.click();
    }
    const sourceLink = page.locator('.markdown a[href^="https://"]').first();
    assert.equal(await sourceLink.count(), 1);
    const sourceHref = await sourceLink.getAttribute('href');
    assert.match(sourceHref, /x\.com\/markbulling\/status/);
    report.proofChecks.push({ id: 'UC-447', detailBadge: '尚待查證', sourceHref, sizeLabel });
    await page.screenshot({ path: `${out}/scenario3-uc447-source-${sizeLabel}.png` });

    // Close detail via Escape or close button
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('detail').open);

    // 3B: Open UC-455 (maker author-demo using official SDK)
    await page.goto(`${base}?case=UC-455`);
    await page.locator('#detail[open]').waitFor();
    const detailTitle455 = await page.locator('#detail-title').innerText();
    assert.match(detailTitle455, /不開手機也能叫Muse/);
    const proofBadges455 = page.locator('.detail-header-meta .proof-badge');
    assert.equal(await proofBadges455.first().innerText(), '作者報告／示範', 'UC-455 must be 作者報告／示範, not 官方自報');
    const chips455 = await proofBadges455.allInnerTexts();
    const declared455 = await page.evaluate(() => (entries.find(entry => entry.id === 'UC-455') || {}).proofClasses || []);
    assert.deepEqual(chips455, declared455, 'every declared class of UC-455 is shown as its own chip');
    const proofNote455 = await page.locator('.detail-proof-note');
    assert.match(await proofNote455.innerText(), /作者報告／示範/);
    assert.match(await proofNote455.innerText(), /社群作者公開分享/);
    report.proofChecks.push({ id: 'UC-455', detailBadge: '作者報告／示範', sizeLabel });
    await page.screenshot({ path: `${out}/scenario3-uc455-detail-${sizeLabel}.png` });

    // 3C: Open UC-018 (genuine official self-report)
    await page.goto(`${base}?case=UC-018`);
    await page.locator('#detail[open]').waitFor();
    const proofBadge018 = page.locator('.detail-header-meta .proof-badge').first();
    assert.equal(await proofBadge018.innerText(), '官方自報', 'UC-018 must remain 官方自報');
    report.proofChecks.push({ id: 'UC-018', detailBadge: '官方自報', sizeLabel });
    report.scenarios.push({ scenario: 3, step: 'direct-links-completed', sizeLabel });
    await page.screenshot({ path: `${out}/scenario3-uc018-detail-${sizeLabel}.png` });

    // Accessibility check using axe
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    assert.equal(axeResults.violations.length, 0, `Axe violations on ${sizeLabel}: ${JSON.stringify(axeResults.violations)}`);
    report.audits.push({ sizeLabel, violations: axeResults.violations.length });

    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(out, 'acceptance-report.json'), JSON.stringify(report, null, 2));
  console.log('ALL BROWSER ACCEPTANCE SCENARIOS PASSED WITH 0 AXE VIOLATIONS!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
