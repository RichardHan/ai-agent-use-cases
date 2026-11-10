'use strict';
// Arriving from a search link places the result line, and the page can still grow
// above it afterwards: the sample card above the search is drawn from the corpus,
// so its height keeps changing after the arrival scroll. Native scroll anchoring
// then keeps the viewport on the first case and pushes the focused result line
// above the top edge. Measured on the published site 2026-11-11 (sourceRevision
// 5f678d68) with ?q=旅遊#explore: 390×844 left 「顯示 35 / 515 筆收錄」 at top −30
// on one load and +24 on the next, 320×740 left it at −18, 1440×900 at +9. The
// loss depends on the late layout change, not on the URL.
//
// This reproduces the race deterministically: once the arrival scrolls the result
// line, a late scroll correction moves the viewport 60px further down, which is
// what the published site did after the line had been placed (scrollY 3342→3419
// at 320×740 while the line's document position stayed at 3366). The reader sees
// a result line that is clipped above the top edge with nothing to scroll back to.
//
// The contract kept here is the one the arrival code already promises (see
// arrival-live.cjs): one of the two anchors — the result line or the search field
// — is fully readable, and the first case title is readable. A result line that
// ends up half-clipped above the top edge satisfies neither.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const QUERY = '旅遊';

(async () => {
  const browser = await chromium.launch();
  const origin = process.env.ARRIVAL_URL || process.env.SITE_URL || 'http://127.0.0.1:8081/ai-agent-use-cases/';
  fs.mkdirSync('qa-artifacts', { recursive: true });
  const report = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844], ['narrow', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        // Two frames after the arrival focuses the result line, move the viewport
        // 60px further down with no user input and no document change: exactly the
        // late correction the published site applied (scrollY 3342→3419 at
        // 320×740 while the line stayed at document position 3366).
        const focus = HTMLElement.prototype.focus;
        HTMLElement.prototype.focus = function (...args) {
          const result = focus.apply(this, args);
          if (this && this.id === 'results-count' && !window.__lateScroll) {
            window.__lateScroll = true;
            requestAnimationFrame(() => requestAnimationFrame(() => {
              window.scrollBy(0, 60);
              window.__lateScrollBy = 60;
            }));
          }
          return result;
        };
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));

      const measure = async suffix => {
        await page.goto(origin + suffix, { waitUntil: 'load' });
        await page.locator('#results-count').filter({ hasText: '顯示' }).waitFor({ timeout: 60000 });
        // Let the late layout change and the arrival guard settle.
        await page.waitForTimeout(1600);
        return page.evaluate(() => {
          const box = selector => {
            const node = document.querySelector(selector);
            if (!node) return null;
            const rect = node.getBoundingClientRect();
            return { top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
          };
          const fullyVisible = rect => !!rect && rect.top >= 0 && rect.bottom <= innerHeight;
          const focused = document.activeElement;
          return {
            count: box('#results-count'),
            title: box('#results .card h3'),
            query: box('#query'),
            focus: focused ? (focused.id || focused.tagName) : null,
            focusRect: focused ? (() => {
              const rect = focused.getBoundingClientRect();
              return { top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
            })() : null,
            countVisible: fullyVisible(box('#results-count')),
            titleVisible: fullyVisible(box('#results .card h3')),
            queryVisible: fullyVisible(box('#query')),
            drawnHeight: Math.round(document.querySelector('#drawn-case')?.getBoundingClientRect().height || 0),
            lateScroll: window.__lateScroll === true,
            viewport: innerHeight,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });
      };

      const shared = await measure(`?q=${encodeURIComponent(QUERY)}#explore`);
      assert.equal(shared.lateScroll, true, `${name}: the late scroll correction was reproduced`);
      assert(shared.countVisible || shared.queryVisible,
        `${name}: arrival leaves the result line or the search field readable, never a clipped line above the top edge (count ${JSON.stringify(shared.count)} of ${shared.viewport})`);
      assert.equal(shared.titleVisible, true,
        `${name}: the first case title stays readable (${JSON.stringify(shared.title)} of ${shared.viewport})`);
      assert(shared.focusRect && shared.focusRect.top >= 0 && shared.focusRect.bottom <= shared.viewport,
        `${name}: the focused control is inside the viewport (${JSON.stringify(shared.focusRect)})`);
      assert(shared.focus === 'results-count' || shared.focus === 'search-title',
        `${name}: arrival focuses the result line or the search heading (got ${shared.focus})`);
      assert.equal(shared.overflow, 0, `${name}: no horizontal overflow`);
      assert.deepEqual(errors, [], `${name}: no page errors`);

      const empty = await measure('?q=xyz987#explore');
      assert(empty.countVisible || empty.queryVisible,
        `${name}: the empty arrival keeps its result line readable (${JSON.stringify(empty.count)})`);

      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(violation => violation.id), [], `${name}: no axe violations`);
      await page.screenshot({ path: `qa-artifacts/arrival-summary-${name}.jpg`, type: 'jpeg', quality: 70 });
      report.push({ viewport: name, shared, empty });
      await context.close();
    }
    console.log('ARRIVAL_SUMMARY ' + JSON.stringify(report));
    if (process.env.QA_OUT) fs.writeFileSync(process.env.QA_OUT, JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})();
