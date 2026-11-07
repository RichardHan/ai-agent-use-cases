'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const liveUrl = process.env.LIVE_URL || 'https://richardhan.github.io/ai-agent-use-cases/';
const previewUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:8140/ai-agent-use-cases/';
const outDir = process.env.QA_OUT || '/tmp/qa-artifacts-visitor-20261107';
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const report = {
    timestamp: new Date().toISOString(),
    liveSiteComparison: {},
    previewScenarios: [],
    axeScans: [],
    overflowChecks: []
  };

  console.log('--- Step 1: Observing live production site (BEFORE) ---');
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await page.goto(liveUrl, { timeout: 30000 });
      await page.waitForFunction(() => typeof discoveryReady !== 'undefined' && discoveryReady, null, { timeout: 20000 });

      // Check 收件匣 on live site
      await page.locator('#query').fill('收件匣');
      await page.locator('#search-submit').click();
      await page.waitForTimeout(500);
      const liveFirstCardId = await page.locator('#results .card').first().getAttribute('data-case-id');
      const liveCards = await page.locator('#results .card').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-case-id')));
      const liveUc014Rank = liveCards.indexOf('UC-014');

      report.liveSiteComparison.inbox = {
        firstCardId: liveFirstCardId,
        uc014Rank: liveUc014Rank >= 0 ? liveUc014Rank + 1 : 'not in first 24'
      };
      await page.screenshot({ path: path.join(outDir, 'before-live-inbox-desktop.png') });

      // Check 我想整理會議 on live site
      await page.locator('#query').fill('我想整理會議');
      await page.locator('#search-submit').click();
      await page.waitForTimeout(500);
      const liveMeetingCount = await page.locator('#results .card').count();
      const liveEmptyVisible = await page.locator('#empty').isVisible();
      report.liveSiteComparison.naturalMeeting = {
        query: '我想整理會議',
        count: liveMeetingCount,
        emptyVisible: liveEmptyVisible
      };
      await page.screenshot({ path: path.join(outDir, 'before-live-natural-meeting-desktop.png') });
    } catch (e) {
      console.warn('Live site observation error:', e.message);
      report.liveSiteComparison.error = e.message;
    } finally {
      await context.close();
    }
  }

  console.log('--- Step 2: Testing updated preview site across 3 scenarios (AFTER) ---');
  const viewports = [
    { width: 1440, height: 900, isMobile: false, label: 'desktop-1440' },
    { width: 390, height: 844, isMobile: true, label: 'mobile-390' },
    { width: 320, height: 568, isMobile: true, label: 'mobile-320' }
  ];

  for (const vp of viewports) {
    console.log(`Testing viewport: ${vp.label} (${vp.width}x${vp.height})`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();

    // ==========================================
    // SCENARIO 1: Problem-oriented search (收件匣 & 我想整理會議)
    // ==========================================
    await page.goto(previewUrl, { timeout: 30000 });
    await page.waitForFunction(() => typeof discoveryReady !== 'undefined' && discoveryReady, null, { timeout: 20000 });

    // Check overflow on initial load
    const initialOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    assert.ok(initialOverflow, `Page must not horizontally overflow on ${vp.label}`);
    report.overflowChecks.push({ view: 'home', viewport: vp.label, noOverflow: initialOverflow });

    // Click "📥 收件匣"
    await page.locator('#query').fill('收件匣');
    await page.locator('#search-submit').click();
    await page.waitForTimeout(500);

    const cards = page.locator('#results .card');
    assert.ok(await cards.count() > 0, 'Must have cards for 收件匣');
    const firstCardId = await cards.first().getAttribute('data-case-id');
    assert.equal(firstCardId, 'UC-014', `First card for 收件匣 must be UC-014 on ${vp.label}`);
    const firstCardTitle = await cards.first().locator('h3').innerText();
    const firstCardProof = await cards.first().locator('.proof').innerText();

    await page.screenshot({ path: path.join(outDir, `after-scenario1-inbox-${vp.label}.png`) });

    // Now test natural language query "我想整理會議"
    await page.locator('#query').fill('我想整理會議');
    await page.locator('#search-submit').click();
    await page.waitForTimeout(500);

    const meetingCardCount = await cards.count();
    assert.ok(meetingCardCount >= 15, `我想整理會議 must return >= 15 cards, got ${meetingCardCount} on ${vp.label}`);
    const hasMeetingCase = await cards.evaluateAll(nodes => nodes.some(n => n.getAttribute('data-case-id') === 'UC-277'));
    assert.ok(hasMeetingCase, `我想整理會議 must include UC-277 on ${vp.label}`);

    await page.screenshot({ path: path.join(outDir, `after-scenario1-meeting-${vp.label}.png`) });

    // Test compound problem query "自動化測試"
    await page.locator('#query').fill('自動化測試');
    await page.locator('#search-submit').click();
    await page.waitForTimeout(500);
    const autoTestCount = await cards.count();
    assert.ok(autoTestCount >= 20, `自動化測試 must return >= 20 cards, got ${autoTestCount} on ${vp.label}`);
    await page.screenshot({ path: path.join(outDir, `after-scenario1-autotest-${vp.label}.png`) });

    // Test compound problem query "出差報銷"
    await page.locator('#query').fill('出差報銷');
    await page.locator('#search-submit').click();
    await page.waitForTimeout(500);
    const travelCount = await cards.count();
    assert.ok(travelCount >= 5, `出差報銷 must return >= 5 cards, got ${travelCount} on ${vp.label}`);
    const travelFirstId = await cards.first().getAttribute('data-case-id');
    assert.equal(travelFirstId, 'UC-284', `出差報銷 rank 1 must be UC-284 on ${vp.label}`);
    await page.screenshot({ path: path.join(outDir, `after-scenario1-travel-${vp.label}.png`) });

    // Test compound problem query "發票報帳"
    await page.locator('#query').fill('發票報帳');
    await page.locator('#search-submit').click();
    await page.waitForTimeout(500);
    const invoiceCount = await cards.count();
    assert.ok(invoiceCount >= 10, `發票報帳 must return >= 10 cards, got ${invoiceCount} on ${vp.label}`);
    await page.screenshot({ path: path.join(outDir, `after-scenario1-invoice-${vp.label}.png`) });

    report.previewScenarios.push({
      scenario: 1,
      viewport: vp.label,
      inboxFirstCard: firstCardId,
      inboxTitle: firstCardTitle,
      inboxProof: firstCardProof,
      naturalMeetingCards: meetingCardCount
    });

    // ==========================================
    // SCENARIO 2: Search + filter, empty state recovery
    // ==========================================
    await page.locator('#filter-options').evaluate(el => el.open = true);
    await page.locator('#scenario').selectOption('創作');
    await page.locator('#proof').selectOption('尚待查證');
    await page.locator('#query').fill('不可能存在的測試關鍵字xyz987');
    await page.locator('#empty').waitFor({ state: 'visible', timeout: 5000 });
    assert.equal(await page.locator('#empty').isVisible(), true, 'Empty state must be visible');

    await page.screenshot({ path: path.join(outDir, `after-scenario2-empty-${vp.label}.png`) });

    // Click "清除條件，重新探索"
    await page.locator('#empty-reset').click();
    await page.waitForFunction(() => !document.getElementById('empty').offsetParent || document.getElementById('empty').style.display === 'none');
    assert.ok(await cards.count() > 0, 'Results must recover after empty-reset');

    await page.screenshot({ path: path.join(outDir, `after-scenario2-recovered-${vp.label}.png`) });

    report.previewScenarios.push({
      scenario: 2,
      viewport: vp.label,
      emptyRecovered: true
    });

    // ==========================================
    // SCENARIO 3: Shared detail URL, proof judging, source link, return
    // ==========================================
    const detailUrl = `${previewUrl}?q=%E6%94%B6%E4%BB%B6%E5%8C%A3&case=UC-014#explore`;
    await page.goto(detailUrl, { timeout: 30000 });
    await page.waitForFunction(() => document.getElementById('detail')?.open, null, { timeout: 10000 });

    const detailModal = page.locator('#detail');
    assert.equal(await detailModal.isVisible(), true, 'Detail modal must open on direct link');

    // Check proof note & target user
    const proofNote = await page.locator('.detail-proof-note').innerText();
    const targetUser = await page.locator('.detail-target-user').innerText();
    const sourceLink = page.locator('.detail-source, .detail-source-latest').first();
    const sourceHref = await sourceLink.getAttribute('href');
    assert.ok(sourceHref ? sourceHref.startsWith('https://') : true, 'Source link if present must be external URL');
    // Check touch target height (>= 44px)
    const closeBtnHeight = await page.locator('#close-detail').evaluate(el => el.getBoundingClientRect().height);
    assert.ok(closeBtnHeight >= 44, `Close button height must be >= 44px, got ${closeBtnHeight}`);

    await page.screenshot({ path: path.join(outDir, `after-scenario3-detail-${vp.label}.png`) });

    // Return to exploration
    await page.locator('#close-detail').click();
    await page.waitForFunction(() => !document.getElementById('detail')?.open);
    assert.equal(new URL(page.url()).searchParams.get('case'), null, 'Case parameter must be removed on close');
    assert.equal(new URL(page.url()).searchParams.get('q'), '收件匣', 'Query parameter must be preserved on close');

    report.previewScenarios.push({
      scenario: 3,
      viewport: vp.label,
      detailId: 'UC-014',
      proofNote,
      targetUser,
      sourceHref,
      closeBtnHeight
    });

    // ==========================================
    // ACCESSIBILITY AUDIT (axe-core)
    // ==========================================
    if (vp.label !== 'mobile-320') {
      const axeScan = await new AxeBuilder({ page }).analyze();
      assert.equal(axeScan.violations.length, 0, `Axe violations must be 0 on ${vp.label}, got ${axeScan.violations.length}`);
      report.axeScans.push({
        viewport: vp.label,
        violations: axeScan.violations.length,
        passes: axeScan.passes.length
      });
    }

    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(outDir, 'visitor-acceptance-report.json'), JSON.stringify(report, null, 2));
  console.log('SUCCESS: All 3 visitor scenarios verified across desktop and mobile with 0 Axe violations!');
})().catch(err => {
  console.error('Browser acceptance failed:', err);
  process.exit(1);
});
