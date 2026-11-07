'use strict';
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8099/ai-agent-use-cases/';
const outDir = path.resolve(__dirname, '../docs/qa/2026-11-07-ci-reliability');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const results = { desktop: {}, mobile: {}, smallMobile: {} };

  // Viewport configurations
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

    // Axe check on homepage
    const homeAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(homeAxe.violations.length, 0, `Homepage accessibility violations on ${vp.name}: ` + JSON.stringify(homeAxe.violations));

    // SCENARIO 1: Problem-oriented discovery via new problem tags
    console.log(`[${vp.name}] Testing Scenario 1: 出差報銷 problem tag...`);
    const expenseTag = page.locator('.hero-problem-tags a[href*="出差報銷"]');
    assert.ok(await expenseTag.isVisible(), '出差報銷 tag must be visible');
    await expenseTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const expenseCount = await page.locator('#results .card').count();
    assert.ok(expenseCount >= 4, `出差報銷 must recall >= 4 cases (found ${expenseCount})`);
    assert.equal(await page.locator('#query').inputValue(), '出差報銷');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-02-scenario1-expense.png`) });

    // Test second problem tag: 合約審核
    console.log(`[${vp.name}] Testing Scenario 1: 合約審核 problem tag...`);
    const contractTag = page.locator('.hero-problem-tags a[href*="合約審核"]');
    assert.ok(await contractTag.isVisible(), '合約審核 tag must be visible');
    await contractTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const contractCount = await page.locator('#results .card').count();
    assert.ok(contractCount >= 10, `合約審核 must recall >= 10 cases (found ${contractCount})`);
    assert.equal(await page.locator('#query').inputValue(), '合約審核');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-03-scenario1-contract.png`) });

    // SCENARIO 2: Combined query + filters leading to empty state & recovery
    console.log(`[${vp.name}] Testing Scenario 2: Empty search state and recovery...`);
    await page.locator('#query').fill('non-existent-problem-xyz-987');
    await page.locator('#query').press('Enter');
    await page.locator('#empty-hint').waitFor({ timeout: 10000 });
    assert.ok(await page.locator('#empty-hint').isVisible(), 'Empty state hint must be visible');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-04-scenario2-empty.png`) });

    // Check problem recovery chips
    const recoveryChip = page.locator('#empty-suggestions .recovery-problem-tag').first();
    assert.ok(await recoveryChip.isVisible(), 'Recovery chips must be visible in empty state');
    const chipText = await recoveryChip.innerText();
    console.log(`[${vp.name}] Clicking recovery chip: ${chipText}`);
    await recoveryChip.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    assert.ok((await page.locator('#results .card').count()) > 0, 'Recovery must restore non-empty results');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-05-scenario2-recovered.png`) });

    // Axe check on recovered state
    const recoveryAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(recoveryAxe.violations.length, 0, `Recovery accessibility violations on ${vp.name}`);

    // SCENARIO 3: Shared detail link, proof evaluation, source link, and return
    console.log(`[${vp.name}] Testing Scenario 3: Shared detail URL ?case=UC-284#explore...`);
    await page.goto(origin + '?case=UC-284&q=出差報銷#explore', { waitUntil: 'networkidle' });
    await page.locator('#detail[open]').waitFor({ timeout: 10000 });
    assert.ok(await page.locator('#detail').evaluate(d => d.open), 'Detail dialog must open automatically for shared link');

    // Verify proof badge, target user, core goal
    const proofBadge = page.locator('.detail-header-meta .proof-badge');
    assert.ok(await proofBadge.isVisible(), 'Proof badge must be visible in detail header');
    const proofText = await proofBadge.innerText();
    console.log(`[${vp.name}] UC-284 proof text: ${proofText}`);
    assert.ok(proofText.includes('作者報告／示範') || proofText.includes('尚待查證') || proofText.includes('官方自報'), 'Valid proof classification');

    // Verify source link has target _blank and rel noopener
    const sourceLink = page.locator('#detail a.detail-source, #detail a[target="_blank"]').first();
    assert.equal(await sourceLink.getAttribute('target'), '_blank');
    assert.match(await sourceLink.getAttribute('rel') || '', /noopener/);

    await page.screenshot({ path: path.join(outDir, `${vp.name}-06-scenario3-detail.png`) });

    // Close detail and verify return flow
    console.log(`[${vp.name}] Closing detail and verifying return flow...`);
    const closeBtn = page.locator('#close-detail');
    await closeBtn.click();
    await page.waitForFunction(() => !document.getElementById('detail').open);
    assert.equal(await page.locator('#query').inputValue(), '出差報銷', 'Query must be preserved upon returning from detail');
    await page.screenshot({ path: path.join(outDir, `${vp.name}-07-scenario3-returned.png`) });

    assert.equal(pageErrors.length, 0, `Page errors on ${vp.name}: ` + pageErrors.join(', '));
    await context.close();
  }

  await browser.close();
  console.log('All 3 scenarios verified across desktop (1440), mobile (390), and small mobile (320) with 0 axe violations!');
})().catch(err => {
  console.error('Scenario verification failed:', err);
  process.exit(1);
});
