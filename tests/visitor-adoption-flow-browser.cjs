'use strict';
const { chromium } = require('playwright');

async function expandProblemTags(page){
  const toggle=page.locator('#problem-tags-toggle');
  if(!(await toggle.count())||!(await toggle.isVisible()))return;
  if((await toggle.getAttribute('aria-expanded'))==='false')await toggle.click();
}

const AxeBuilder = require('@axe-core/playwright').default;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8877/ai-agent-use-cases/';
const OUT_DIR = path.join(__dirname, '../docs/qa/2026-11-08-visitor-adoption-flow');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  console.log(`Starting E2E browser tests against ${BASE_URL}...`);
  const browser = await chromium.launch();

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
      await expandProblemTags(page);
      console.log('✓ Discovery ready, corpus loaded');

      // Verify hero problem tags
      const heroTags = page.locator('.hero-problem-tags .problem-tag');
      const tagCount = await heroTags.count();
      assert.ok(tagCount >= 47, `Expected >= 47 problem tags, got ${tagCount}`);
      const tagTexts = await heroTags.allInnerTexts();
      assert.ok(tagTexts.includes('安全防護'), 'Hero problem tags must include 安全防護');
      assert.ok(tagTexts.includes('人工審批'), 'Hero problem tags must include 人工審批');
      assert.ok(tagTexts.includes('合約比對'), 'Hero problem tags must include 合約比對');
      assert.ok(tagTexts.includes('庫存管理'), 'Hero problem tags must include 庫存管理');
      console.log('✓ Hero problem tags verified with 安全防護 and 人工審批');

      if (vp.name !== 'small-mobile') {
        await page.screenshot({ path: path.join(OUT_DIR, `01-${vp.name}-home.png`), fullPage: false });
      }

      // Check home a11y
      const homeAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.equal(homeAxe.violations.length, 0, `Home accessibility violations: ${JSON.stringify(homeAxe.violations)}`);
      console.log('✓ Home axe violations = 0');

      // --- Scenario 1: New Visitor Finds Cases via Safety & Review Intent ---
      // Test A: Click hero problem tag "安全防護"
      const secTag = page.locator('.hero-problem-tags a[href*="安全防護"]');
      await secTag.click();
      await page.waitForSelector('#results .card');
      const secCountText = await page.locator('#results-count').innerText();
      assert.match(secCountText, /顯示 (?:[5-9]\d|[1-9]\d{2,})/, 'Expected >= 50 matching cases in results count');
      const secCount = await page.locator('#results .card').count();
      assert.ok(secCount >= 1 && secCount <= 24, `Expected batch of up to 24 cards, got ${secCount}`);
      console.log(`✓ Hero tag "安全防護" yielded "${secCountText}" (${secCount} cards in first batch)`);

      if (vp.name !== 'small-mobile') {
        await page.screenshot({ path: path.join(OUT_DIR, `02-${vp.name}-hero-security.png`), fullPage: false });
      }

      // Test B: Search "人工審批"
      await page.locator('#query').fill('人工審批');
      await page.locator('#search-submit').click();
      await page.waitForSelector('#results .card');
      const reviewCountText = await page.locator('#results-count').innerText();
      assert.match(reviewCountText, /顯示 (?:[3-9]\d|[1-9]\d{2,})/, 'Expected >= 35 matching cases in review count');
      const reviewCount = await page.locator('#results .card').count();
      const firstReviewId = await page.locator('#results .card').first().getAttribute('data-case-id');
      console.log(`✓ Query "人工審批" returned "${reviewCountText}", top: ${firstReviewId}`);

      // Verify card target-user is present to orient visitors
      const firstCardTarget = await page.locator('#results .card .card-target-user').first().innerText();
      assert.ok(firstCardTarget.includes('👤 適合對象：'), 'Card must render target audience for orientation');
      console.log(`✓ Card audience orientation verified: "${firstCardTarget.slice(0, 30)}..."`);

      if (vp.name !== 'small-mobile') {
        await page.screenshot({ path: path.join(OUT_DIR, `03-${vp.name}-query-review.png`), fullPage: false });
      }

      // Test C: Search "付款審核"
      await page.locator('#query').fill('付款審核');
      await page.locator('#search-submit').click();
      await page.waitForSelector('#results .card');
      const payCountText = await page.locator('#results-count').innerText();
      assert.match(payCountText, /顯示 (?:[3-9]\d|[1-9]\d{2,})/, 'Expected >= 30 matching cases in pay review count');
      const payCount = await page.locator('#results .card').count();
      console.log(`✓ Query "付款審核" returned "${payCountText}"`);

      // Check results page a11y
      const searchAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.equal(searchAxe.violations.length, 0, `Search accessibility violations: ${JSON.stringify(searchAxe.violations)}`);
      console.log('✓ Search results axe violations = 0');

      // --- Scenario 2: Combination Filters, Empty Recovery & Usability ---
      await page.locator('#filter-options').evaluate(n => n.open = true);
      await page.locator('.scenario-chips button[data-scenario="工作"]').click();
      // Fill impossible query under this scenario
      await page.locator('#query').fill('安全防護 找不到的自訂字999');
      await page.locator('#search-submit').click();
      await page.waitForSelector('#empty:not([hidden])');
      console.log('✓ Empty state reached under combination conditions');

      // Check empty state height and chips
      const chipsBox = await page.locator('.empty-problem-chips').boundingBox();
      assert.ok(chipsBox, 'Expected .empty-problem-chips to be rendered');
      assert.ok(chipsBox.height <= 340, `Empty chips height must be <= 340px, got ${chipsBox.height}px`);
      console.log(`✓ Empty problem chips height is bounded: ${Math.round(chipsBox.height)}px (no 2400px scroll wall)`);

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

      // Click recovery chip "安全防護" or "人工審批" to recover
      const targetChip = page.locator('.recovery-problem-tag[data-problem-tag="安全防護"]');
      if (await targetChip.count() > 0) {
        await targetChip.click();
        await page.waitForSelector('#results .card');
        const recoveredCount = await page.locator('#results .card').count();
        assert.ok(recoveredCount >= 1, `Expected recovered results, got ${recoveredCount}`);
        console.log(`✓ Recovered via chip "安全防護" -> ${recoveredCount} cases under active scenario`);
      }

      // --- Scenario 3: Shared Direct Link, Safety Guidance, and Return ---
      // Reset conditions and navigate via direct URL for UC-016
      const directUrl = `${BASE_URL}?q=二手&case=UC-016#explore`;
      await page.goto(directUrl);
      await page.waitForSelector('#detail[open]');
      console.log('✓ Direct case URL opened detail view');

      // Verify title & meta
      const detailTitle = await page.locator('#detail-title').innerText();
      assert.match(detailTitle, /二手拍賣|二手賣場|買家對話/, 'Case title must match UC-016');

      // Verify reader safety shortcut exists
      const safetyBtn = page.locator('.reader-safety-shortcut');
      assert.ok(await safetyBtn.isVisible(), 'Safety shortcut button must be visible in overview');
      assert.equal(await safetyBtn.innerText(), '查核依據與安全採用 ↓');

      // Verify caution priority extraction
      const cautionText = await page.locator('.guidance-caution p').textContent();
      assert.match(cautionText, /切勿開啟「永遠允許」|住家地址|降價/, 'Caution must prioritize safety boundary');
      console.log(`✓ High-priority safety caution verified in detail: "${cautionText}"`);

      // Click safety shortcut
      await safetyBtn.click();
      console.log('✓ Clicked safety shortcut button');

      // Verify scroll movement and focus
      const detailScroll = await page.evaluate(() => document.querySelector('#detail')?.scrollTop || 0);
      assert.ok(detailScroll > 50, `Expected detail to scroll down, got scrollTop = ${detailScroll}`);

      // Verify proof note & adoption guidelines are focused/visible
      const proofNote = page.locator('.detail-proof-note');
      assert.ok(await proofNote.isVisible(), 'detail-proof-note must be visible');
      const claimantText = await page.locator('.proof-note-claimant').innerText();
      assert.match(claimantText, /成果主張來源：/);
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
      assert.equal(await page.locator('#query').inputValue(), '二手', 'Query must be preserved after closing detail');
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
