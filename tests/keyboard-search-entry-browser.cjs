'use strict';
// A keyboard visitor must reach the search field with one key, and typing a
// question must not make a screen reader read the draw status (the changing pool
// count) for every character. Before this check existed the bypass link landed in
// the random-draw stage and all three live regions spoke on every keystroke.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const base = process.env.KEYBOARD_URL || process.env.SITE_URL || 'http://127.0.0.1:8097/ai-agent-use-cases/';

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(base, { waitUntil: 'load' });
      await page.locator('#results-count').filter({ hasText: '顯示' }).waitFor({ timeout: 60000 });
      await page.evaluate(() => scrollTo(0, 0));

      // 1) One Tab, one Enter: focus must land in the search field, on screen.
      await page.keyboard.press('Tab');
      const first = await page.evaluate(() => ({
        cls: document.activeElement.className,
        text: document.activeElement.textContent.trim()
      }));
      assert.equal(first.cls, 'skip', `${name}: the first tab stop must be the bypass link, got ${first.cls}`);
      assert.match(first.text, /搜尋/, `${name}: the bypass link must name the search destination`);
      await page.keyboard.press('Enter');
      const landed = await page.evaluate(() => {
        const input = document.querySelector('#query');
        const box = input.getBoundingClientRect();
        return { id: document.activeElement.id, top: Math.round(box.top), height: innerHeight, width: Math.round(box.width) };
      });
      assert.equal(landed.id, 'query', `${name}: activating the bypass link must focus the search field`);
      assert.ok(landed.top >= 0 && landed.top < landed.height, `${name}: the search field must be on screen after the bypass link (top ${landed.top} of ${landed.height})`);

      // 2) Typing updates the visible count but never speaks the pool line.
      // One observer set at a time: a stale observer would double-count writes.
      await page.evaluate(() => {
        window.__watch = (ids, valueOf) => {
          (window.__observers || []).forEach(observer => observer.disconnect());
          window.__spoken = [];
          window.__observers = ids.map(id => {
            const node = document.getElementById(id);
            const observer = new MutationObserver(() => window.__spoken.push(valueOf ? valueOf(id, node) : { id, text: (node.textContent || '').trim() }));
            observer.observe(node, { childList: true, characterData: true, subtree: true });
            return observer;
          });
        };
        window.__watch(['draw-announcer', 'draw-status', 'results-count', 'filter-outcome-count']);
      });
      await page.locator('#query').type('會議', { delay: 90 });
      await page.waitForFunction(() => document.querySelector('#filter-outcome-count').textContent.includes('筆') || document.querySelector('#results-count').textContent.includes('顯示'));
      const typed = await page.evaluate(() => ({
        spoken: window.__spoken,
        status: document.querySelector('#draw-status').textContent.trim(),
        count: document.querySelector('#results-count').textContent.trim(),
        cards: document.querySelectorAll('#results .card').length,
        drawDisabled: document.querySelector('#draw-case').disabled
      }));
      const announced = typed.spoken.filter(row => row.id === 'draw-announcer');
      const statusWrites = typed.spoken.filter(row => row.id === 'draw-status').length;
      const countWrites = typed.spoken.filter(row => row.id === 'results-count').length;
      assert.ok(countWrites >= 2, `${name}: the result count must still update while typing (writes ${countWrites})`);
      assert.ok(statusWrites >= 1, `${name}: the visible draw line must still follow the filters`);
      assert.ok(announced.length <= 1, `${name}: typing must not announce more than one card change (got ${announced.length})`);
      for (const row of announced) {
        assert.doesNotMatch(row.text, /這組條件有|張案例卡/, `${name}: typing must not announce the changing pool line: ${row.text}`);
      }
      assert.doesNotMatch(typed.status, /^$/);

      // 3) A facet the reader chose that excludes the drawn card replaces it, and
      //    that replacement is announced exactly once.
      const facet = await page.evaluate(() => {
        const badge = document.querySelector('#drawn-case .card-difficulty');
        return badge ? badge.dataset.difficulty : null;
      });
      let facetAnnouncement = null;
      if (facet) {
        const options = await page.locator('#difficulty option').evaluateAll(nodes => nodes.map(n => n.value).filter(Boolean));
        const other = options.find(value => value !== facet);
        if (other) {
          await page.evaluate(() => {
            const input = document.querySelector('#query');
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          });
          await page.evaluate(() => window.__watch(['draw-announcer'], (id, node) => (node.textContent || '').trim()));
          await page.evaluate(value => {
            const select = document.querySelector('#difficulty');
            select.value = value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }, other);
          await page.waitForFunction(() => document.querySelector('#draw-announcer').textContent.trim().length > 0, null, { timeout: 5000 }).catch(() => {});
          facetAnnouncement = await page.evaluate(() => window.__spoken.slice());
          // Exactly one sentence, and it names a case rather than the pool count.
          assert.equal(facetAnnouncement.length, 1, `${name}: choosing a facet that drops the card must announce once (got ${facetAnnouncement.length})`);
          assert.match(facetAnnouncement[0], /^已換一張：/);
          // Restore the unfiltered pool for the redraw check.
          await page.evaluate(() => {
            const select = document.querySelector('#difficulty');
            select.value = '';
            select.dispatchEvent(new Event('change', { bubbles: true }));
          });
          await page.waitForTimeout(200);
        }
      }

      // 4) An explicit redraw speaks exactly one sentence, naming the new case.
      let drawn = null;
      if (!typed.drawDisabled) {
        await page.evaluate(() => window.__watch(['draw-announcer'], (id, node) => (node.textContent || '').trim()));
        await page.locator('#draw-case').click();
        drawn = await page.evaluate(() => ({
          spoken: window.__spoken,
          title: (document.querySelector('#drawn-case h3') || {}).textContent
        }));
        assert.equal(drawn.spoken.length, 1, `${name}: pressing 再抽一張 must announce once (got ${drawn.spoken.length})`);
        assert.match(drawn.spoken[0], /^已換一張：/);
        if (drawn.title) assert.ok(drawn.spoken[0].includes(drawn.title.trim()), `${name}: the announcement must name the drawn case`);
      }

      // 5) The rewritten announcement plumbing must not add axe violations.
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      assert.equal(axe.violations.length, 0, `${name}: axe ${JSON.stringify(axe.violations.map(v => v.id))}`);

      rows.push({
        name, viewport: `${width}x${height}`,
        skipTop: landed.top, countWrites, statusWrites,
        announcementsWhileTyping: announced.length,
        redrawAnnouncements: drawn ? drawn.spoken.length : null,
        facetAnnouncement: facetAnnouncement ? facetAnnouncement[0] : null,
        resultLine: typed.count, cards: typed.cards,
        axeViolations: axe.violations.length
      });
      await context.close();
    }
    console.log('KEYBOARD_SEARCH_ENTRY ' + JSON.stringify(rows));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.stack || error); process.exit(1); });
