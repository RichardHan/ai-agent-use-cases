'use strict';
// A re-read query ("我想要找一個可以幫我整理照片的工具", "客戶抱怨") shows its matches,
// so every other part of the same screen must describe that same condition set:
// facet counts, the draw deck, and the statistics card. This walks the three
// states where the site used to disagree with itself.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const sentence = '我想要找一個可以幫我整理照片的工具';
const compound = '客戶抱怨';

const shownCount = async page => {
  const text = await page.locator('#results-count').innerText();
  const match = text.match(/顯示 (\d+) \/ (\d+)/);
  assert.ok(match, 'results count reads a number: ' + text);
  return { shown: Number(match[1]), total: Number(match[2]), text };
};

const facetCounts = page => page.evaluate(() => {
  const select = document.getElementById('scenario');
  return [...select.options].map(option => ({ value: option.value, count: Number(option.dataset.count), label: option.textContent }));
});

(async () => {
  const browser = await chromium.launch();
  try {
    const origin = process.env.ROUND_URL || 'http://127.0.0.1:8172/ai-agent-use-cases/';
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['small', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.locator('#results .card').first().waitFor();

      for (const [label, query] of [['sentence', sentence], ['compound', compound]]) {
        await page.locator('#query').fill(query);
        await page.waitForFunction(() => /顯示 \d+ \/ \d+/.test(document.getElementById('results-count')?.textContent || ''));
        await page.waitForTimeout(150);
        assert.equal(await page.locator('#search-split').isVisible(), true, name + '/' + label + ': the re-read explains itself');
        const { shown } = await shownCount(page);
        assert.ok(shown > 0, name + '/' + label + ': the re-read has matches');

        const counts = await facetCounts(page);
        const all = counts.find(entry => entry.value === '');
        assert.equal(all.count, shown, name + '/' + label + ': all-scenario facet count equals the displayed results');
        assert.ok(counts.some(entry => entry.value && entry.count > 0), name + '/' + label + ': a scenario facet counts the re-read matches: ' + JSON.stringify(counts));

        const drawn = await page.locator('#drawn-case').innerText();
        const status = await page.locator('#draw-status').innerText();
        const drawable = await page.locator('#drawn-case .card').count();
        assert.ok(drawable > 0 || /沒有可抽卡的用法靈感/.test(drawn), name + '/' + label + ': the draw panel explains or offers a card: ' + drawn);
        assert.equal(/目前沒有可抽的案例卡/.test(drawn) && drawable === 0 && !/用法靈感/.test(drawn), false, name + '/' + label + ': no blanket "no cards" claim next to results');
        assert.ok(!/目前沒有可抽的案例卡/.test(status) || drawable === 0, name + '/' + label + ': draw status matches the deck');

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 0, name + '/' + label + ': no horizontal overflow (' + overflow + ')');
      }

      // A merged lead is still selectable, but its option says the statistic card does not count it.
      if (name === 'desktop') {
        await page.goto(origin + '?kind=pending', { waitUntil: 'domcontentloaded' });
        await page.locator('#results .card').first().waitFor();
        const pendingOption = await page.locator('#kind option[value="pending"]').textContent();
        assert.match(pendingOption, /含 2 筆已併入/, 'every merged lead is disclosed in the facet option: ' + pendingOption);
        assert.match(pendingOption, /統計不計/, 'facet option names the statistics rule');
        assert.equal(await page.locator('#pending-count').innerText(), '2', 'statistics still counts open leads only');
        const pending = await shownCount(page);
        assert.equal(pending.shown, 4, 'the pending filter keeps both merged leads reachable');

        // The annotation is computed from the same filtered set as the count, so a
        // query that matches only the merged lead still discloses it.
        await page.goto(origin + '?q=P-002&kind=pending', { waitUntil: 'domcontentloaded' });
        await page.locator('#results .card').first().waitFor();
        const filteredOption = await page.locator('#kind option[value="pending"]').textContent();
        assert.match(filteredOption, /含 1 筆已併入/, 'filtered pending count still discloses the merged lead: ' + filteredOption);

        // Dated leads are review dates; the card may not claim the date is missing.
        await page.goto(origin + '?q=UC-256', { waitUntil: 'domcontentloaded' });
        await page.locator('#results .card').first().waitFor();
        const card = await page.locator('#results .card').first().innerText();
        assert.match(card, /頁首核對 2026-10-16/, 'dated lead renders as a review date: ' + card.replace(/\n/g, ' | '));
        assert.doesNotMatch(card, /頁首未提供核對日/, 'a dated lead is not reported as undated');
      }

      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      assert.equal(accessibility.violations.length, 0, name + ': axe violations ' + JSON.stringify(accessibility.violations.map(v => v.id)));
      assert.deepEqual(errors, [], name + ': no page errors');
      await context.close();
    }
    console.log('SEARCH_EXPANSION_CONSISTENCY_OK');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
