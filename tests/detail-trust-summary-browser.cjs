'use strict';
// A shared case link lands directly in the detail dialog. The source badge used
// to be the only credibility signal on the first screen; who made the claim and
// whether this library reproduced it sat ~1200px lower, below the fold on both
// desktop and phone. This check holds the summary to the same dictionaries as
// the full note and verifies the jump actually lands there.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const origin = process.env.DETAIL_TRUST_URL || 'http://127.0.0.1:8081/ai-agent-use-cases/';
const caseUrl = id => `${origin}?scenario=${encodeURIComponent('工作')}&case=${encodeURIComponent(id)}#explore`;
const axe = page => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
const overflow = page => page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

const read = page => page.evaluate(() => {
  const summary = document.querySelector('.detail-trust-summary');
  const note = document.querySelector('.detail-proof-note');
  const toolbar = document.querySelector('.detail-toolbar');
  const rect = el => {
    if (!el) return null;
    const box = el.getBoundingClientRect();
    return { top: Math.round(box.top), bottom: Math.round(box.bottom), height: Math.round(box.height) };
  };
  return {
    open: document.querySelector('#detail')?.open ?? false,
    title: document.querySelector('#detail-title')?.textContent.trim() ?? '',
    proof: document.querySelector('.detail-badge.proof-badge')?.textContent.trim() ?? '',
    badges: [...document.querySelectorAll('.detail-badge.proof-badge')].map(node => node.textContent.trim()),
    badgeLabels: [...document.querySelectorAll('.detail-badge.proof-badge')].map(node => node.getAttribute('aria-label') || ''),
    summaryText: summary?.innerText.replace(/\s+/g, ' ').trim() ?? '',
    summaryNull: summary === null,
    summaryBox: rect(summary),
    jumpText: summary?.querySelector('.detail-trust-jump')?.textContent.trim() ?? '',
    noteBox: rect(note),
    toolbarBox: rect(toolbar),
    noteText: note?.innerText.replace(/\s+/g, ' ').trim() ?? '',
    claimant: document.querySelector('.proof-note-claimant')?.textContent.trim() ?? '',
    status: document.querySelector('.proof-note-status')?.textContent.trim() ?? '',
    dictionaries: {
      claimants: globalThis.PROOF_CLAIMANTS,
      short: globalThis.PROOF_STATUS_SHORT,
      definitions: globalThis.PROOF_DEFINITIONS
    },
    focus: document.activeElement?.className ?? '',
    viewport: innerHeight,
    url: location.href,
    hash: location.hash
  };
});

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844], ['small', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));

      await page.goto(caseUrl('UC-098'), { waitUntil: 'networkidle' });
      await page.waitForSelector('#detail[open]', { timeout: 90000 });
      const direct = await read(page);
      assert.equal(direct.open, true, `${name}: shared link opens the case`);
      assert.equal(direct.summaryNull, false, `${name}: the first screen states who claims the outcome`);
      assert.ok(direct.title.length > 0, `${name}: the case title is present`);

      const expectedClaimant = direct.dictionaries.claimants[direct.proof];
      const expectedShort = direct.dictionaries.short[direct.proof];
      assert.ok(expectedClaimant && expectedShort, `${name}: proof "${direct.proof}" has dictionary entries`);
      assert.ok(direct.summaryText.includes('成果主張：' + expectedClaimant), `${name}: summary names the claimant (${direct.summaryText})`);
      assert.ok(direct.summaryText.includes('核讀：' + expectedShort), `${name}: summary carries the verification boundary`);
      assert.ok(direct.summaryText.includes('核讀與安全建議'), `${name}: summary offers the jump`);
      assert.ok(direct.summaryBox.bottom < height, `${name}: summary is on the first screen (${direct.summaryBox.bottom} < ${height})`);
      assert.ok(direct.summaryBox.height <= 120, `${name}: summary stays compact (${direct.summaryBox.height}px)`);

      // The long note must remain the single source of truth the summary points at.
      assert.ok(direct.noteText.includes(expectedClaimant), `${name}: full note names the same claimant`);
      assert.ok(direct.status.includes(expectedShort.slice(0, 4)) || expectedShort.includes('未'), `${name}: full note explains the same boundary`);

      const summary = page.locator('.detail-trust-summary');
      assert.equal(await summary.locator('.detail-trust-item').count(), 2, `${name}: two separate facts, not one blended label`);
      await summary.locator('.detail-trust-jump').focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      const jumped = await read(page);
      assert.equal(jumped.focus, 'detail-proof-note', `${name}: the jump moves focus to the proof note`);
      assert.ok(jumped.noteBox.top >= jumped.toolbarBox.bottom, `${name}: the note lands below the sticky toolbar (${jumped.noteBox.top} >= ${jumped.toolbarBox.bottom})`);
      assert.ok(jumped.noteBox.top < height, `${name}: the note is visible after the jump (${jumped.noteBox.top} < ${height})`);
      assert.ok(!(await overflow(page)), `${name}: no horizontal overflow`);
      assert.equal((await axe(page)).violations.length, 0, `${name}: axe violations at the jumped state`);
      assert.equal(errors.length, 0, `${name}: page errors: ${errors.join(' | ')}`);

      // Reloading a shared link must not depend on the earlier click state.
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('#detail[open]', { timeout: 90000 });
      const reloaded = await read(page);
      assert.equal(reloaded.summaryNull, false, `${name}: summary survives reload of the shared link`);
      assert.ok(reloaded.summaryText.includes('核讀：' + expectedShort), `${name}: reload keeps the same boundary`);

      rows.push({
        name, width, height, case: 'UC-098', proof: direct.proof,
        summary: direct.summaryText, summaryBottom: direct.summaryBox.bottom,
        noteTopAfterJump: jumped.noteBox.top, toolbarBottom: jumped.toolbarBox.bottom,
        overflow: false, axe: 0, pageErrors: errors.length
      });
      await context.close();
    }

    // Sample the credibility classes that read differently, not just the common demo.
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.locator('#filter-options').evaluate(node => { node.open = true; });
    for (const proof of ['官方自報', '尚待查證', '設計／未實跑']) {
      await page.selectOption('#proof', proof);
      await page.waitForTimeout(400);
      const id = await page.evaluate(() => document.querySelector('#results .card')?.dataset.caseId);
      assert.ok(id, `proof filter "${proof}" yields a case`);
      await page.goto(caseUrl(id), { waitUntil: 'networkidle' });
      await page.waitForSelector('#detail[open]', { timeout: 90000 });
      const row = await read(page);
      assert.equal(row.proof, proof, `${proof}: the opened case carries the filtered class`);
      assert.equal(row.summaryNull, false, `${proof}: summary renders`);
      if (row.badges.length === 1) {
        assert.ok(row.summaryText.includes('成果主張：' + row.dictionaries.claimants[proof]), `${proof}: claimant is named`);
        assert.ok(row.summaryText.includes('核讀：' + row.dictionaries.short[proof]), `${proof}: boundary is stated`);
      } else {
        // A case whose header names more than one class states the primary one
        // and lists the rest; it must not present one claimant for the whole page.
        assert.equal(row.badges[0], proof, `${proof}: the first chip is the primary class`);
        assert.ok(row.summaryText.includes('成果主張：主要 ' + row.dictionaries.claimants[proof]), `${proof}: primary claimant is named as primary (${row.summaryText})`);
        assert.ok(row.summaryText.includes('另宣告 ' + row.badges.slice(1).join('、')), `${proof}: the other declared classes are named`);
        assert.ok(row.summaryText.includes('核讀：主要 ' + row.dictionaries.short[proof]), `${proof}: the primary boundary is stated`);
        assert.ok(row.badgeLabels.every((label, index) => label.includes(row.badges[index])), `${proof}: every chip names its own class`);
      }
      assert.ok(row.summaryBox.bottom < 900, `${proof}: summary stays on the first screen`);
      assert.equal((await axe(page)).violations.length, 0, `${proof}: axe violations`);
      rows.push({ name: 'class-' + proof, case: id, proof, summary: row.summaryText, summaryBottom: row.summaryBox.bottom, axe: 0 });
      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.locator('#filter-options').evaluate(node => { node.open = true; });
    }
    await context.close();
    console.log('DETAIL_TRUST ' + JSON.stringify(rows));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.stack || error); process.exit(1); });
