'use strict';
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8099/ai-agent-use-cases/';
const outDir = path.resolve(__dirname, '../docs/qa/2026-11-08-problem-intent');
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
    console.log(`[${vp.name}] Testing Scenario 1: 競品分析 problem tag...`);
    const compTag = page.locator('.hero-problem-tags a[href*="競品分析"]');
    assert.ok(await compTag.isVisible(), '競品分析 tag must be visible in hero');
    await compTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const compCount = await page.locator('#results .card').count();
    assert.ok(compCount >= 1, `競品分析 must recall >= 1 case (found ${compCount})`);
    assert.equal(await page.locator('#query').inputValue(), '競品分析');
    const firstCompTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(firstCompTitle.includes('競品'), `Top result for 競品分析 must be competitor case, got: ${firstCompTitle}`);
    const compShot = `${vp.name}-02b-scenario1-competitor-analysis.png`;
    await page.screenshot({ path: path.join(outDir, compShot) });
    vpReport.screenshots.push(compShot);

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

    console.log(`[${vp.name}] Testing Scenario 1: 做一份競品簡報 natural query with quantifier...`);
    await page.locator('#query').fill('做一份競品簡報');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const quantCompCount = await page.locator('#results .card').count();
    assert.ok(quantCompCount >= 1, `做一份競品簡報 must recall >= 1 case (found ${quantCompCount})`);
    const quantCompTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(quantCompTitle.includes('競品'), `Top result for 做一份競品簡報 must be competitor case, got: ${quantCompTitle}`);

    console.log(`[${vp.name}] Testing Scenario 1: 一次性爬蟲 natural query with modifier...`);
    await page.locator('#query').fill('一次性爬蟲');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const scraperCount = await page.locator('#results .card').count();
    assert.ok(scraperCount >= 20, `一次性爬蟲 must recall >= 20 cases (found ${scraperCount})`);

    console.log(`[${vp.name}] Testing Scenario 1: 整理一份會議記錄 natural query with verb + quantifier...`);
    await page.locator('#query').fill('整理一份會議記錄');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const meetingCount = await page.locator('#results .card').count();
    assert.ok(meetingCount >= 9, `整理一份會議記錄 must recall >= 9 cases (found ${meetingCount})`);

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

    // SCENARIO 2b: Compound difficulty + scenario empty recovery via in-facet problem suggestion
    console.log(`[${vp.name}] Testing Scenario 2b: Compound difficulty (入門對話) + scenario (生活) + query (代碼審查)...`);
    await page.evaluate(() => {
      const diff = document.getElementById('difficulty');
      if (diff) {
        diff.value = '入門對話';
        diff.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const scn = document.getElementById('scenario');
      if (scn) {
        scn.value = '生活';
        scn.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.locator('#query').fill('代碼審查');
    await page.locator('#search-submit').click();
    await page.locator('#empty').waitFor({ timeout: 5000 });
    assert.ok(await page.locator('#empty').isVisible(), 'Empty state must be visible on life + novice + code review');
    assert.ok(await page.locator('#empty-suggestions .recovery-option').first().isVisible(), 'Facet removal button must be visible');
    assert.ok(await page.locator('#empty-suggestions .empty-problem-suggestions').isVisible(), 'Problem suggestions container must be visible even with facet removals');
    const travelTag = page.locator('#empty-suggestions [data-problem-tag="旅遊"]');
    assert.ok(await travelTag.isVisible(), '旅遊 problem tag must be visible under 生活 + 入門對話');
    const compoundEmptyShot = `${vp.name}-05b-scenario2-compound-empty.png`;
    await page.screenshot({ path: path.join(outDir, compoundEmptyShot) });
    vpReport.screenshots.push(compoundEmptyShot);

    const compoundEmptyAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(compoundEmptyAxe.violations.length, 0, `Compound empty state accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'compound_empty_state', violations: 0 });

    console.log(`[${vp.name}] Clicking 旅遊 problem suggestion to recover within current scenario...`);
    await travelTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const inFacetRecoveredCount = await page.locator('#results .card').count();
    assert.ok(inFacetRecoveredCount >= 10, `In-facet recovered count for 旅遊 must be >= 10 (found ${inFacetRecoveredCount})`);
    assert.equal(await page.locator('#query').inputValue(), '旅遊');
    assert.equal(await page.locator('#scenario').inputValue(), '生活', 'Scenario must remain 生活');
    assert.equal(await page.locator('#difficulty').inputValue(), '入門對話', 'Difficulty must remain 入門對話');
    assert.match(decodeURIComponent(page.url()), /scenario=生活/, 'URL must preserve scenario=生活');
    assert.match(decodeURIComponent(page.url()), /difficulty=入門對話/, 'URL must preserve difficulty=入門對話');
    assert.match(decodeURIComponent(page.url()), /q=旅遊/, 'URL must update to q=旅遊');
    const inFacetRecoveredShot = `${vp.name}-05c-scenario2-in-facet-recovered.png`;
    await page.screenshot({ path: path.join(outDir, inFacetRecoveredShot) });
    vpReport.screenshots.push(inFacetRecoveredShot);

    const inFacetAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(inFacetAxe.violations.length, 0, `In-facet recovered state accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'in_facet_recovered_state', violations: 0 });

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
