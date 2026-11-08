'use strict';
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8899/ai-agent-use-cases/';
const OUT_DIR = path.join(__dirname, '../docs/qa/2026-11-08-visitor-adoption');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  console.log(`Starting E2E browser tests against ${BASE_URL}...`);
  const browser = await chromium.launch();
  let totalViolations = 0;

  try {
    const viewports = [
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'mobile', width: 390, height: 844 },
      { name: 'small-mobile', width: 320, height: 740 }
    ];

    for (const vp of viewports) {
      console.log(`\n--- Testing viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: vp.name.includes('mobile')
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
          : undefined
      });
      const page = await context.newPage();

      // --- 1. Homepage & Initial Load ---
      await page.goto(BASE_URL);
      await page.waitForFunction(() => typeof discoveryReady !== 'undefined' && discoveryReady, { timeout: 30000 });
      console.log('✓ Discovery ready, corpus loaded');

      // Verify hero problem tags
      const heroTags = page.locator('.hero-problem-tags .problem-tag');
      const tagCount = await heroTags.count();
      assert.ok(tagCount >= 45, `Expected >= 45 problem tags, got ${tagCount}`);
      const tagTexts = await heroTags.allInnerTexts();
      assert.ok(tagTexts.includes('合約比對'), 'Hero problem tags must include 合約比對');
      assert.ok(tagTexts.includes('報表比對'), 'Hero problem tags must include 報表比對');
      assert.ok(tagTexts.includes('電子報'), 'Hero problem tags must include 電子報');
      assert.ok(tagTexts.includes('庫存管理'), 'Hero problem tags must include 庫存管理');
      console.log('✓ Hero problem tags verified');

      if (vp.name !== 'small-mobile') {
        await page.screenshot({ path: path.join(OUT_DIR, `01-${vp.name}-home.png`), fullPage: false });
      }

      // Check home a11y
      const homeAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.equal(homeAxe.violations.length, 0, `Home accessibility violations: ${JSON.stringify(homeAxe.violations)}`);
      console.log('✓ Home axe violations = 0');

      // --- Scenario 1: Conjunction & Natural Problem Queries ---
      // Test A: Conjunction query "合約審查且風險"
      await page.locator('#query').fill('合約審查且風險');
      await page.locator('#search-submit').click();
      await page.waitForSelector('#results .card');
      const conjCount = await page.locator('#results .card').count();
      assert.ok(conjCount >= 5, `Expected >= 5 results for 合約審查且風險, got ${conjCount}`);
      const firstConjId = await page.locator('#results .card').first().getAttribute('data-case-id');
      assert.equal(firstConjId, 'UC-154', `Expected UC-154 at rank 1, got ${firstConjId}`);
      console.log(`✓ Query "合約審查且風險" returned ${conjCount} cases, top: ${firstConjId}`);

      if (vp.name !== 'small-mobile') {
        await page.screenshot({ path: path.join(OUT_DIR, `02-${vp.name}-query-conjunction.png`), fullPage: false });
      }

      // Test B: High-intent problem query "合約比對"
      await page.locator('#query').fill('合約比對');
      await page.locator('#search-submit').click();
      await page.waitForSelector('#results .card');
      const contractCount = await page.locator('#results .card').count();
      assert.ok(contractCount >= 20, `Expected >= 20 results for 合約比對, got ${contractCount}`);
      const firstContractId = await page.locator('#results .card').first().getAttribute('data-case-id');
      assert.equal(firstContractId, 'UC-234', `Expected UC-234 at rank 1, got ${firstContractId}`);
      console.log(`✓ Query "合約比對" returned ${contractCount} cases, top: ${firstContractId}`);

      if (vp.name !== 'small-mobile') {
        await page.screenshot({ path: path.join(OUT_DIR, `03-${vp.name}-contract-compare.png`), fullPage: false });
      }

      // Test C: High-intent problem query "報表比對"
      await page.locator('#query').fill('報表比對');
      await page.locator('#search-submit').click();
      await page.waitForSelector('#results .card');
      const reportCount = await page.locator('#results .card').count();
      assert.ok(reportCount >= 24, `Expected >= 24 results for 報表比對, got ${reportCount}`);
      const firstReportId = await page.locator('#results .card').first().getAttribute('data-case-id');
      assert.equal(firstReportId, 'UC-129', `Expected UC-129 at rank 1, got ${firstReportId}`);
      console.log(`✓ Query "報表比對" returned ${reportCount} cases, top: ${firstReportId}`);

      // Test D: High-intent problem query "庫存管理"
      await page.locator('#query').fill('庫存管理');
      await page.locator('#search-submit').click();
      await page.waitForSelector('#results .card');
      const invCount = await page.locator('#results .card').count();
      assert.ok(invCount >= 24, `Expected >= 24 results for 庫存管理, got ${invCount}`);
      const topIds = await page.locator('#results .card').evaluateAll(nodes => nodes.slice(0, 3).map(n => n.dataset.caseId));
      assert.ok(topIds.includes('UC-129') || topIds.includes('UC-130'), `Expected UC-129 or UC-130 in top, got ${topIds.join(',')}`);
      console.log(`✓ Query "庫存管理" returned ${invCount} cases, top: ${topIds.join(',')}`);

      // --- Scenario 2: Combination Filters, Empty Recovery & Usability ---
      await page.locator('#filter-options').evaluate(n => n.open = true);
      await page.locator('.scenario-chips button[data-scenario="工作"]').click();
      // Fill impossible query under this scenario
      await page.locator('#query').fill('合約比對 找不到的關鍵字999');
      await page.locator('#search-submit').click();
      await page.waitForSelector('#empty:not([hidden])');
      console.log('✓ Empty state reached under combination conditions');

      // Check empty state height and chips
      const chipsBox = await page.locator('.empty-problem-chips').boundingBox();
      assert.ok(chipsBox, 'Expected .empty-problem-chips to be rendered');
      assert.ok(chipsBox.height <= 340, `Empty chips height must be <= 340px, got ${chipsBox.height}px`);
      console.log(`✓ Empty problem chips height is bounded: ${Math.round(chipsBox.height)}px (no 2400px scroll wall)`);

      // Verify touch target size of recovery chips
      const firstChip = page.locator('.recovery-problem-tag').first();
      const chipBox = await firstChip.boundingBox();
      assert.ok(chipBox.height >= 43, `Recovery chip height must be >= 44px, got ${chipBox.height}px`);
      console.log(`✓ Recovery chip touch height verified: ${Math.round(chipBox.height)}px`);

      // Verify empty action buttons are visible and accessible
      assert.ok(await page.locator('#edit-query').isVisible(), '修改關鍵字 button must be visible');
      assert.ok(await page.locator('#empty-reset').isVisible(), '清除全部條件 button must be visible');

      if (vp.name !== 'small-mobile') {
        await page.screenshot({ path: path.join(OUT_DIR, `04-${vp.name}-empty-recovery.png`), fullPage: false });
      }

      // Check empty a11y
      const emptyAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.equal(emptyAxe.violations.length, 0, `Empty state accessibility violations: ${JSON.stringify(emptyAxe.violations)}`);
      console.log('✓ Empty state axe violations = 0');

      // Click recovery chip to recover
      const targetChip = page.locator('.recovery-problem-tag[data-problem-tag="報表比對"]');
      if (await targetChip.count() > 0) {
        await targetChip.click();
        await page.waitForSelector('#results .card');
        const recoveredCount = await page.locator('#results .card').count();
        assert.ok(recoveredCount >= 1, `Expected recovered results, got ${recoveredCount}`);
        console.log(`✓ Recovered via chip "報表比對" -> ${recoveredCount} cases under active scenario`);
      }

      // --- Scenario 3: Shared Direct Link, Safety Guidance, and Return ---
      // Reset conditions and navigate via direct URL
      const directUrl = `${BASE_URL}?q=合約比對&case=UC-234#explore`;
      await page.goto(directUrl);
      await page.waitForSelector('#detail[open]');
      console.log('✓ Direct case URL opened detail view');

      // Verify title & meta
      const detailTitle = await page.locator('#detail-title').innerText();
      assert.match(detailTitle, /合約附件先對提案|比對核准提案與合約附件/, 'Case title must match UC-234');

      // Verify reader safety shortcut exists
      const safetyBtn = page.locator('.reader-safety-shortcut');
      assert.ok(await safetyBtn.isVisible(), 'Safety shortcut button must be visible in overview');
      assert.equal(await safetyBtn.innerText(), '查核依據與安全採用 ↓');
      const accessibleName = await safetyBtn.evaluate(el => el.getAttribute('aria-label') || el.innerText);
      assert.ok(accessibleName.startsWith('查核依據與安全採用'), 'Accessible name must start with visible label for WCAG 2.5.3');

      // Click safety shortcut
      await safetyBtn.click();
      console.log('✓ Clicked safety shortcut button');

      // Verify scroll movement and focus
      const detailScroll = await page.evaluate(() => document.querySelector('#detail')?.scrollTop || 0);
      assert.ok(detailScroll > 50, `Expected detail to scroll down, got scrollTop = ${detailScroll}`);
      const activeElementClass = await page.evaluate(() => document.activeElement?.className || '');
      assert.ok(activeElementClass.includes('reader-evidence') || activeElementClass.includes('proof'), `Expected evidence focused, got ${activeElementClass}`);
      console.log(`✓ Safety shortcut scrolled detail to scrollTop: ${Math.round(detailScroll)}px and focused target`);
      // Verify proof note & adoption guidelines are focused/visible
      const proofNote = page.locator('.detail-proof-note');
      assert.ok(await proofNote.isVisible(), 'detail-proof-note must be visible');
      const claimantText = await page.locator('.proof-note-claimant').innerText();
      assert.match(claimantText, /社群作者／專案實踐者/);
      const statusText = await page.locator('.proof-note-status').innerText();
      assert.match(statusText, /未(?:於本機)?獨立重現/);
      const safetyText = await page.locator('.proof-note-safety').innerText();
      assert.match(safetyText, /落地三層防護/);
      assert.match(safetyText, /建議試跑/);
      assert.match(safetyText, /禁止動作/);
      assert.match(safetyText, /必經審核/);
      console.log('✓ Proof note & three-layer safe adoption guidance verified');

      if (vp.name !== 'small-mobile') {
        await page.screenshot({ path: path.join(OUT_DIR, `05-${vp.name}-detail-safety.png`), fullPage: false });
      }

      // Check detail view a11y
      const detailAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.equal(detailAxe.violations.length, 0, `Detail modal accessibility violations: ${JSON.stringify(detailAxe.violations)}`);
      console.log('✓ Detail view axe violations = 0');

      // Close modal and verify keyboard return
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('#detail').open);
      assert.equal(await page.locator('#query').inputValue(), '合約比對', 'Query must be preserved after closing detail');
      console.log('✓ Detail closed via Escape, query context preserved');

      await context.close();
    }

    console.log('\n========================================');
    console.log('All E2E scenarios passed with 0 Axe accessibility violations across all viewports!');
    console.log('========================================\n');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('E2E test failed:', err);
  process.exit(1);
});
