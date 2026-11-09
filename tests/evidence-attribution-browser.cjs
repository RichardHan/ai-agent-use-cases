'use strict';
// A case header can declare more than one evidence class, for example
// `official`（Spaces 功能與官方作例，經來源轉述）＋`designed`（兩位作者自擬、
// 未附實跑結果的請求句）. The page used to print only the class that won the
// precedence rule, so the first screen named the vendor as the claimant of a case
// whose substance is two authors' unrun prompts. This check holds the page to the
// declaration: every class is visible, the primary one is labelled as primary,
// the filter still counts each case once, and the pending counter matches the file.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const origin = process.env.ATTRIBUTION_URL || 'http://127.0.0.1:8081/ai-agent-use-cases/';
const caseUrl = id => `${origin}?case=${encodeURIComponent(id)}#explore`;
const axe = page => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
const overflow = page => page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

async function boot(page) {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof entries !== 'undefined' && entries.length > 0, null, { timeout: 90000 });
}

const read = page => page.evaluate(() => {
  const rect = el => {
    if (!el) return null;
    const box = el.getBoundingClientRect();
    // The detail is a fixed dialog; compare against the viewport directly.
    return { top: Math.round(box.top), bottom: Math.round(box.bottom), height: Math.round(box.height) };
  };
  const note = document.querySelector('.detail-proof-note');
  return {
    open: document.querySelector('#detail')?.open ?? false,
    chips: [...document.querySelectorAll('.detail-header-meta .proof-badge')].map(node => node.textContent.trim()),
    chipLabels: [...document.querySelectorAll('.detail-header-meta .proof-badge')].map(node => node.getAttribute('aria-label') || ''),
    summaryText: document.querySelector('.detail-trust-summary')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
    summaryBox: rect(document.querySelector('.detail-trust-summary')),
    sourceTop: rect(document.querySelector('.detail-source'))?.top ?? null,
    classRows: [...document.querySelectorAll('.proof-note-class')].map(node => node.innerText.replace(/\s+/g, ' ').trim()),
    claimant: document.querySelector('.proof-note-claimant')?.textContent.trim() ?? '',
    dictionaries: {
      claimants: globalThis.PROOF_CLAIMANTS,
      short: globalThis.PROOF_STATUS_SHORT,
      definitions: globalThis.PROOF_DEFINITIONS
    },
    viewport: innerHeight,
    focus: document.activeElement?.className ?? ''
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

      await page.goto(caseUrl('UC-514'), { waitUntil: 'networkidle' });
      await page.waitForSelector('#detail[open]', { timeout: 90000 });
      const direct = await read(page);

      assert.equal(direct.open, true, `${name}: the shared link opens the case`);
      assert.deepEqual(direct.chips, ['官方自報', '設計／未實跑'],
        `${name}: both declared classes are visible, not only the precedence winner`);
      assert.match(direct.chipLabels[0], /來源憑據（主要）：官方自報/, `${name}: the primary chip says so`);
      assert.match(direct.chipLabels[1], /來源憑據（同案宣告）：設計／未實跑/,
        `${name}: the second chip says it is a co-declared class`);

      const claimant = direct.dictionaries.claimants['官方自報'];
      const short = direct.dictionaries.short['官方自報'];
      assert.ok(direct.summaryText.includes(`成果主張：主要 ${claimant}`), `${name}: the primary claimant is named as primary (${direct.summaryText})`);
      assert.ok(direct.summaryText.includes('另宣告 設計／未實跑'), `${name}: the first screen names the other class`);
      assert.ok(direct.summaryText.includes(`核讀：主要 ${short}`), `${name}: the primary boundary is stated`);
      assert.ok(direct.summaryText.includes('其他類別見下方'), `${name}: the summary points at the per-class detail`);
      assert.ok(direct.summaryBox.bottom < height, `${name}: the summary stays on the first screen (${direct.summaryBox.bottom} < ${height})`);
      // At 320px the source link already sat below the fold before this round
      // (760px in the 740px viewport), so only the wider viewports promise it.
      if (width >= 390) {
        assert.ok(direct.sourceTop !== null && direct.sourceTop < height, `${name}: the source link is still on the first screen (${direct.sourceTop})`);
      }

      assert.equal(direct.classRows.length, 2, `${name}: the full note lists both declared classes`);
      assert.match(direct.classRows[0], /主要：成果主張 .+；核讀 /, `${name}: the first row is marked primary`);
      assert.match(direct.classRows[1], /同案宣告：成果主張 .+；核讀 /, `${name}: the second row is marked co-declared`);
      assert.ok(direct.classRows.some(row => row.includes('設計／未實跑')), `${name}: the designed class is explained, not dropped`);
      assert.match(direct.claimant, /成果主張來源（主要：官方自報）/, `${name}: the long note scopes the claimant to the primary class`);

      const summary = page.locator('.detail-trust-summary');
      assert.equal(await summary.locator('.detail-trust-item').count(), 2, `${name}: still two facts, not a blended label`);
      await summary.locator('.detail-trust-jump').focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      assert.equal((await read(page)).focus, 'detail-proof-note', `${name}: the jump still lands on the proof note`);

      assert.ok(!(await overflow(page)), `${name}: no horizontal overflow`);
      assert.equal((await axe(page)).violations.length, 0, `${name}: axe violations on the multi-class detail`);
      assert.equal(errors.length, 0, `${name}: page errors: ${errors.join(' | ')}`);

      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('#detail[open]', { timeout: 90000 });
      const reloaded = await read(page);
      assert.deepEqual(reloaded.chips, direct.chips, `${name}: the declared classes survive a reload of the shared link`);

      rows.push({
        name, width, height, chips: direct.chips.join('＋'),
        summary: direct.summaryText, summaryHeight: direct.summaryBox.height,
        summaryBottom: direct.summaryBox.bottom, sourceTop: direct.sourceTop,
        axe: 0, pageErrors: errors.length
      });
      await context.close();
    }

    // A single-class case must keep the wording the previous round shipped.
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(caseUrl('UC-098'), { waitUntil: 'networkidle' });
    await page.waitForSelector('#detail[open]', { timeout: 90000 });
    const single = await read(page);
    assert.equal(single.chips.length, 1, 'a single-class declaration renders one chip');
    assert.ok(single.summaryText.includes('成果主張：' + single.dictionaries.claimants[single.chips[0]]),
      'a single-class case keeps the plain claimant sentence');
    assert.ok(!single.summaryText.includes('主要 '), 'no primary/co-declared wording when nothing else is declared');
    assert.equal(single.classRows.length, 0, 'no class list when there is only one class');

    // The source-type facet still partitions the corpus: each case counts once,
    // under its primary class, and every declared class is named on the card.
    await boot(page);
    const facets = await page.evaluate(() => ({
      total: entries.length,
      classes: [...new Set(entries.map(entry => entry.proof))].sort(),
      sum: [...new Set(entries.map(entry => entry.proof))]
        .reduce((sum, label) => sum + facetCounts(entries, [], {}, 'proof', [label])[0], 0),
      mixed: entries.filter(entry => (entry.proofClasses || []).length > 1).length
    }));
    assert.equal(facets.sum, facets.total, 'the 來源類型 counts still add up to the whole corpus');
    assert.ok(facets.mixed > 0, 'the corpus still contains mixed declarations');

    await page.goto(`${origin}?proof=${encodeURIComponent('設計／未實跑')}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof entries !== 'undefined' && entries.length > 0, null, { timeout: 90000 });
    const designed = await page.evaluate(() => ({
      ids: [...document.querySelectorAll('#results [data-case-id]')].map(node => node.dataset.caseId),
      hint: document.getElementById('facet-count-hint')?.textContent ?? '',
      options: [...document.querySelectorAll('#proof option')].map(option => option.value).filter(Boolean).sort()
    }));
    assert.deepEqual(designed.options, facets.classes, 'the filter offers exactly the classes the corpus uses');
    assert.ok(designed.hint.includes('來源類型依案例頁首宣告的主要類別計一次'), 'the filter explains the counting rule');
    assert.ok(designed.hint.includes('其他類別'), 'the filter says the other declared classes are shown elsewhere');

    await page.goto(origin + '?q=UC-514', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof entries !== 'undefined' && entries.length > 0, null, { timeout: 90000 });
    const card = await page.evaluate(() => {
      const badge = document.querySelector('#results [data-case-id="UC-514"] .proof');
      return { text: badge?.textContent ?? '', label: badge?.getAttribute('aria-label') ?? '', title: badge?.title ?? '' };
    });
    assert.equal(card.text, '官方自報', 'the card keeps one visible label to stay scannable');
    assert.match(card.label, /本案例另宣告 1 類來源：設計／未實跑/,
      'the card label discloses the co-declared class for screen readers');
    assert.match(card.title, /另宣告：設計／未實跑/, 'the card tooltip discloses the co-declared class');

    // Pending leads: the fourth lead used to be a bare paragraph inside P-003, so
    // the counter said one resolved lead while the file listed two.
    await page.goto(`${origin}?kind=pending`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof entries !== 'undefined' && entries.length > 0, null, { timeout: 90000 });
    const pending = await page.evaluate(() => ({
      ids: [...document.querySelectorAll('#results [data-case-id]')].map(node => node.dataset.caseId),
      open: document.getElementById('pending-count')?.textContent.trim() ?? '',
      note: document.getElementById('pending-note')?.textContent.trim() ?? ''
    }));
    assert.deepEqual(pending.ids, ['P-001', 'P-002', 'P-003', 'P-004'], 'every lead in sources/pending.md is reachable');
    assert.equal(pending.open, '2', 'P-001 and P-003 are the open leads');
    assert.match(pending.note, /另有 2 個待查線索已處理/, 'P-002 and P-004 are counted as resolved');

    await page.goto(caseUrl('P-004'), { waitUntil: 'networkidle' });
    await page.waitForSelector('#detail[open]', { timeout: 90000 });
    const merged = await page.evaluate(() => ({
      badge: [...document.querySelectorAll('#detail-body .detail-badge')].map(node => node.textContent.trim()).join(' '),
      text: document.querySelector('#detail-body')?.innerText.replace(/\s+/g, ' ').slice(0, 400) ?? ''
    }));
    assert.match(merged.badge, /已併入 UC-101/, 'P-004 states the case it was merged into');
    assert.match(merged.text, /已併入 UC-101/, 'P-004 explains that it was merged instead of staying open');
    assert.match(merged.text, /站內閱讀主案例 UC-101/, 'P-004 keeps a route to the case that carries it');

    await page.goto(caseUrl('P-003'), { waitUntil: 'networkidle' });
    await page.waitForSelector('#detail[open]', { timeout: 90000 });
    const p003 = await page.evaluate(() => document.querySelector('#detail-body')?.innerText.replace(/\s+/g, ' ') ?? '');
    assert.ok(!p003.includes('P-004'), 'P-003 no longer carries the fourth lead as a stray paragraph');

    console.log('ATTRIBUTION ' + JSON.stringify({ rows, facets: { total: facets.total, mixed: facets.mixed }, designed: designed.ids, pending }));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
