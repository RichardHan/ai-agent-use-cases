'use strict';
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8099/ai-agent-use-cases/';
const outDir = path.resolve(__dirname, '../docs/qa/2026-11-07-problem-evidence-journey');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'smallMobile', width: 320, height: 740 }
  ];

  const report = {
    timestamp: new Date().toISOString(),
    verifyUrl: origin,
    viewports: [],
    scenarios: {
      scenario1_problem_discovery: { passed: true, checks: [] },
      scenario2_empty_recovery: { passed: true, checks: [] },
      scenario3_deep_link_evidence_return: { passed: true, checks: [] }
    },
    axeSummary: { totalViolations: 0 }
  };

  for (const vp of viewports) {
    const vpReport = { name: vp.name, width: vp.width, height: vp.height, axeChecks: [], screenshots: [] };
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
    const homeShot = `${vp.name}-01-homepage.png`;
    await page.screenshot({ path: path.join(outDir, homeShot) });
    vpReport.screenshots.push(homeShot);

    // Axe accessibility check on homepage
    const homeAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(homeAxe.violations.length, 0, `Homepage accessibility violations on ${vp.name}: ` + JSON.stringify(homeAxe.violations));
    vpReport.axeChecks.push({ state: 'homepage', violations: 0 });

    // SCENARIO 1: Problem-oriented discovery
    console.log(`[${vp.name}] Testing Scenario 1: 資料擷取 problem tag...`);
    const extractTag = page.locator('.hero-problem-tags a[href*="資料擷取"]');
    assert.ok(await extractTag.isVisible(), '資料擷取 tag must be visible in hero');
    await extractTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const extractCount = await page.locator('#results .card').count();
    assert.ok(extractCount >= 10, `資料擷取 must recall >= 10 cases (found ${extractCount})`);
    assert.equal(await page.locator('#query').inputValue(), '資料擷取');
    const extractShot = `${vp.name}-02-scenario1-data-extraction.png`;
    await page.screenshot({ path: path.join(outDir, extractShot) });
    vpReport.screenshots.push(extractShot);

    console.log(`[${vp.name}] Testing Scenario 1: 契約審查 natural query...`);
    await page.locator('#query').fill('契約審查');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const contractCount = await page.locator('#results .card').count();
    assert.ok(contractCount >= 10, `契約審查 must recall >= 10 cases (found ${contractCount})`);
    const cardTexts = await page.locator('#results .card h3').allInnerTexts();
    assert.ok(cardTexts.some(t => t.includes('合約') || t.includes('審核') || t.includes('訂閱') || t.includes('工時')), 'Contract query must surface contract review cases');
    const contractShot = `${vp.name}-03-scenario1-contract-review.png`;
    await page.screenshot({ path: path.join(outDir, contractShot) });
    vpReport.screenshots.push(contractShot);

    const searchAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(searchAxe.violations.length, 0, `Search results accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'search_results', violations: 0 });

    // SCENARIO 2: Empty results & Recovery
    console.log(`[${vp.name}] Testing Scenario 2: Combined conflicting filters & empty recovery...`);
    await page.locator('#query').fill('契約審查');
    await page.locator('#search-submit').click();
    await page.evaluate(() => {
      const sel = document.getElementById('scenario');
      sel.value = '創作';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.locator('#empty').waitFor({ timeout: 5000 });
    assert.ok(await page.locator('#empty').isVisible(), 'Empty state must be visible on conflicting query + scenario');

    // Verify empty state displays recovery suggestions
    assert.ok(await page.locator('#empty-suggestions .recovery-option').first().isVisible(), 'Recovery option must be displayed');
    const emptyShot = `${vp.name}-04-scenario2-empty.png`;
    await page.screenshot({ path: path.join(outDir, emptyShot) });
    vpReport.screenshots.push(emptyShot);

    const emptyAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(emptyAxe.violations.length, 0, `Empty state accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'empty_state', violations: 0 });

    console.log(`[${vp.name}] Testing Scenario 2: Recovering from empty state via condition removal...`);
    const removeScenarioBtn = page.locator('#active-filters [data-remove-filter="scenario"]');
    await removeScenarioBtn.waitFor({ timeout: 5000 });
    await removeScenarioBtn.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const recoveredCount = await page.locator('#results .card').count();
    assert.ok(recoveredCount >= 10, `Recovered count must be >= 10 (found ${recoveredCount})`);
    const recoveredShot = `${vp.name}-05-scenario2-recovered.png`;
    await page.screenshot({ path: path.join(outDir, recoveredShot) });
    vpReport.screenshots.push(recoveredShot);

    const recoveredAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(recoveredAxe.violations.length, 0, `Recovered state accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'recovered_state', violations: 0 });

    // SCENARIO 3: Deep link, reading details, proof inspection, guidance expansion, external source, return
    console.log(`[${vp.name}] Testing Scenario 3: Deep link to UC-098, inspecting evidence and guidance...`);
    await page.goto(origin + '?scenario=工作&case=UC-098#explore', { waitUntil: 'networkidle' });
    await page.locator('#detail[open]').waitFor({ timeout: 10000 });
    const detailTitle = await page.locator('#detail-title').innerText();
    assert.ok(detailTitle.includes('PDF') || detailTitle.includes('Excel'), `Detail title must match UC-098 (got: ${detailTitle})`);

    // Verify detail proof badge and notes
    assert.ok(await page.locator('.detail-header-meta .proof-badge').isVisible(), 'Detail proof badge must be visible');
    const proofText = await page.locator('.proof-note-tag').innerText();
    assert.ok(proofText.includes('作者報告') || proofText.includes('author-demo'), `Proof tag must indicate author-demo (got: ${proofText})`);

    // Expand guidance using shortcut button
    const guidanceShortcut = page.locator('.reader-guidance-shortcut');
    assert.ok(await guidanceShortcut.isVisible(), 'Guidance shortcut button must be visible');
    await guidanceShortcut.click();
    assert.ok(await page.locator('.reader-guidance').evaluate(e => e.open), 'Guidance details must be open after clicking shortcut');
    assert.ok(await page.locator('.guidance-how').isVisible(), 'How to start guidance card must be visible');
    assert.ok(await page.locator('.guidance-caution').isVisible(), 'Caution guidance card must be visible');

    // Expand external research and inspect link
    const researchToggle = page.locator('.research-details summary');
    assert.ok(await researchToggle.isVisible(), 'Research details toggle must be visible');
    await researchToggle.click();
    assert.ok(await page.locator('.research-details').evaluate(e => e.open), 'Research details must be open');
    const redditLink = page.locator('.research-details a[href*="reddit.com"]');
    assert.ok(await redditLink.isVisible(), 'External source link must be visible');

    const detailShot = `${vp.name}-06-scenario3-detail.png`;
    await page.screenshot({ path: path.join(outDir, detailShot) });
    vpReport.screenshots.push(detailShot);

    const detailAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(detailAxe.violations.length, 0, `Detail modal accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'detail_modal', violations: 0 });

    // Reload check: details must remain open
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#detail[open]').waitFor({ timeout: 10000 });
    assert.ok(await page.locator('#detail-title').isVisible(), 'Detail title must remain visible after reload');

    // Close detail and verify returned state
    await page.locator('#close-detail').click();
    assert.equal(await page.evaluate(() => document.getElementById('scenario').value), '工作', 'Scenario filter 工作 must be retained after closing detail');
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const returnedShot = `${vp.name}-07-scenario3-returned.png`;
    await page.screenshot({ path: path.join(outDir, returnedShot) });
    vpReport.screenshots.push(returnedShot);

    const returnedAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(returnedAxe.violations.length, 0, `Returned state accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'returned_state', violations: 0 });

    // Verify horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(hasHorizontalOverflow, false, `Horizontal overflow detected on ${vp.name}`);

    assert.equal(pageErrors.length, 0, `Page errors on ${vp.name}: ` + pageErrors.join(', '));
    await context.close();
    report.viewports.push(vpReport);
    console.log(`[${vp.name}] ALL SCENARIOS PASSED WITH ZERO AXE VIOLATIONS.`);
  }

  await browser.close();
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('BROWSER VERIFICATION COMPLETE. Report saved to report.json.');
})().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
