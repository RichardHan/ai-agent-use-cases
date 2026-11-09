'use strict';
// The sample card above the search is drawn from the corpus, so its height keeps
// changing after the reader asks for the search. Before this check, that late
// layout change pushed the field and the first result below the fold: on a
// 390x844 phone the same click landed the first card at 788px or at 986px,
// depending on which case happened to be drawn (measured 478-715px card height).
// This reproduces the race deterministically instead of waiting for a tall card.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const QUESTION = '會議';

(async () => {
  const browser = await chromium.launch();
  const report = [];
  try {
    const origin = process.env.EXPLORE_URL || process.env.SITE_URL || 'http://127.0.0.1:8081/ai-agent-use-cases/';
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(origin, { waitUntil: 'load' });
      await page.locator('#results-count').filter({ hasText: '顯示' }).waitFor({ timeout: 60000 });

      await page.locator('.hero-search-link').click();
      // The drawn card settles after the reveal scroll: grow it the way a taller
      // case does, before the re-align check runs.
      const grown = await page.evaluate(() => {
        const drawn = document.querySelector('#drawn-case');
        const before = Math.round(drawn.getBoundingClientRect().height);
        drawn.style.minHeight = (before + 260) + 'px';
        return { before, after: Math.round(drawn.getBoundingClientRect().height) };
      });
      await page.locator('#query').fill(QUESTION);
      await page.waitForFunction(() => document.querySelector('#filter-outcome-count').textContent.includes('筆結果'));
      await page.waitForTimeout(350);

      const state = await page.evaluate(() => {
        const card = document.querySelector('#results .card').getBoundingClientRect();
        return {
          firstCardTop: Math.round(card.top),
          viewport: innerHeight,
          focus: document.activeElement.id,
          visibleCards: [...document.querySelectorAll('#results .card')].filter(node => {
            const box = node.getBoundingClientRect();
            return box.top < innerHeight && box.bottom > 0;
          }).length,
        };
      });
      assert(state.firstCardTop < state.viewport,
        name + ': the answer stays on screen after the sample card settles (' + state.firstCardTop + 'px of ' + state.viewport + 'px)');
      assert(state.visibleCards >= 1, name + ': a result card is visible with the search field');
      assert.equal(state.focus, 'query', name + ': focus stays in the search field, never yanked by the re-align');
      assert.deepEqual(errors, [], name + ': no page errors');
      report.push({ viewport: name, grownFrom: grown.before, grownTo: grown.after, firstCardTop: state.firstCardTop, visibleCards: state.visibleCards });
      await context.close();
    }
    console.log('SEARCH_REVEAL_SETTLE ' + JSON.stringify(report));
    if (process.env.QA_OUT) {
      require('node:fs').mkdirSync(process.env.QA_OUT, { recursive: true });
      require('node:fs').writeFileSync(process.env.QA_OUT + '/search-reveal-settle.json', JSON.stringify({ origin, report }, null, 2));
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
