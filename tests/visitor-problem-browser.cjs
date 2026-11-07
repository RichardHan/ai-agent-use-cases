'use strict';
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8099/ai-agent-use-cases/';
const outDir = path.resolve(__dirname, '../docs/qa/2026-11-08-visitor-clarity');
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
    console.log(`[${vp.name}] Testing Scenario 1: 問卷調查 problem tag...`);
    const surveyTag = page.locator('.hero-problem-tags a[href*="問卷調查"]');
    assert.ok(await surveyTag.isVisible(), '問卷調查 tag must be visible in hero');
    await surveyTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const surveyCount = await page.locator('#results .card').count();
    assert.ok(surveyCount >= 10, `問卷調查 must recall >= 10 cases (found ${surveyCount})`);
    assert.equal(await page.locator('#query').inputValue(), '問卷調查');
    const surveyShot = `${vp.name}-02-scenario1-survey.png`;
    await page.screenshot({ path: path.join(outDir, surveyShot) });
    vpReport.screenshots.push(surveyShot);

    console.log(`[${vp.name}] Testing Scenario 1: 文獻回顧 problem tag...`);
    const litTag = page.locator('.hero-problem-tags a[href*="文獻回顧"]');
    assert.ok(await litTag.isVisible(), '文獻回顧 tag must be visible in hero');
    await litTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const litCount = await page.locator('#results .card').count();
    assert.ok(litCount >= 2, `文獻回顧 must recall >= 2 cases (found ${litCount})`);
    assert.equal(await page.locator('#query').inputValue(), '文獻回顧');
    const firstLitTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(firstLitTitle.includes('論文') || firstLitTitle.includes('研究'), `Top result for 文獻回顧 must be research case, got: ${firstLitTitle}`);
    const litShot = `${vp.name}-02b-scenario1-literature.png`;
    await page.screenshot({ path: path.join(outDir, litShot) });
    vpReport.screenshots.push(litShot);

    console.log(`[${vp.name}] Testing Scenario 1: 機票比價 natural query...`);
    await page.locator('#query').fill('機票比價');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const flightCount = await page.locator('#results .card').count();
    assert.ok(flightCount >= 2, `機票比價 must recall >= 2 cases (found ${flightCount})`);
    const flightShot = `${vp.name}-02c-scenario1-airfare.png`;
    await page.screenshot({ path: path.join(outDir, flightShot) });
    vpReport.screenshots.push(flightShot);

    console.log(`[${vp.name}] Testing Scenario 1: 費用報銷 natural query...`);
    await page.locator('#query').fill('費用報銷');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const expCount = await page.locator('#results .card').count();
    assert.ok(expCount >= 3, `費用報銷 must recall >= 3 cases (found ${expCount})`);
    const expShot = `${vp.name}-02d-scenario1-expense.png`;
    await page.screenshot({ path: path.join(outDir, expShot) });
    vpReport.screenshots.push(expShot);
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

    // Verify detail proof badge, claimant attribution, and verification status notes
    assert.ok(await page.locator('.detail-header-meta .proof-badge').isVisible(), 'Detail proof badge must be visible');
    const proofText = await page.locator('.proof-note-tag').innerText();
    assert.ok(proofText.includes('作者報告') || proofText.includes('author-demo'), `Proof tag must indicate author-demo (got: ${proofText})`);
    const claimantText = await page.locator('.proof-note-claimant').innerText();
    assert.match(claimantText, /成果主張來源：社群作者／專案實踐者/, `Claimant attribution must be exact (got: ${claimantText})`);
    const statusText = await page.locator('.proof-note-status').innerText();
    assert.match(statusText, /本庫核讀狀態：本庫未於本機獨立重現代碼或流程/, `Verification status must be exact (got: ${statusText})`);
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
    // Verify horizontal overflow while modal is open
    const modalOverflow = await page.evaluate(() => {
      const modal = document.getElementById('detail');
      return modal ? modal.scrollWidth > modal.clientWidth : false;
    });
    assert.equal(modalOverflow, false, `Modal horizontal overflow detected on ${vp.name}`);

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
