'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, firefox, webkit } = require('playwright');
const base = process.env.SITE_URL || 'http://127.0.0.1:8184/ai-agent-use-cases/';
const output = '/tmp/keyboard-independent-review.json';
const rows = [];
const save = () => fs.writeFileSync(output, JSON.stringify(rows, null, 2));

(async () => {
  for (const engine of [chromium, firefox, webkit]) {
    const started = Date.now();
    const browser = await engine.launch();
    const context = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const row = { engine: engine.name(), checks: [], pageErrors: [] };
    rows.push(row);
    page.on('pageerror', error => row.pageErrors.push(error.message));
    const id = () => page.locator('#detail-toolbar-id').innerText();
    const selection = () => page.evaluate(() => {
      const range = document.getSelection();
      return { collapsed: range.isCollapsed, text: range.toString().slice(0, 60), rangeCount: range.rangeCount };
    });
    const select = async selector => {
      await page.locator(selector).first().evaluate(node => {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      });
      assert.equal((await selection()).collapsed, false);
    };
    const key = async value => {
      await page.keyboard.press(value);
      return page.evaluate(() => window.reviewKeys.at(-1));
    };
    try {
      await page.goto(base + '?q=旅遊&scenario=生活&tool=Grok+Bot&case=UC-001');
      await page.waitForFunction(() => discoveryReady && document.querySelector('#detail').open, null, { timeout: 120000 });
      await page.evaluate(() => {
        window.reviewKeys = [];
        document.addEventListener('keydown', event => window.reviewKeys.push({ key: event.key, prevented: event.defaultPrevented }));
      });
      await page.locator('#detail-title').focus();
      for (const arrow of ['ArrowLeft', 'ArrowRight']) {
        await select('.plain-overview p');
        const before = await page.evaluate(() => ({ url: location.href, title: document.title, history: history.length }));
        const event = await key(arrow);
        assert.deepEqual(event, { key: arrow, prevented: false });
        assert.equal(await id(), 'UC-001');
        assert.deepEqual(await page.evaluate(() => ({ url: location.href, title: document.title, history: history.length })), before);
        row.checks.push({ flow: 'selected-passage', event, selectionAfter: await selection() });
      }
      await page.evaluate(() => document.getSelection().removeAllRanges());
      await page.locator('#detail-title').focus();
      const normalEvent = await key('ArrowRight');
      assert.deepEqual(normalEvent, { key: 'ArrowRight', prevented: true });
      const next = await id();
      assert.notEqual(next, 'UC-001');
      await key('ArrowLeft');
      assert.equal(await id(), 'UC-001');
      row.checks.push({ flow: 'normal-arrow-navigation', next, returned: await id() });

      await page.locator('#nav-next-case').focus();
      await select('#detail-title');
      const selectedAtEnter = await selection();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'nav-next-case');
      await key('Enter');
      assert.equal(await id(), next);
      const afterEnter = await selection();
      await key('ArrowLeft');
      assert.equal(await id(), 'UC-001');
      row.checks.push({ flow: 'selected-enter-button', selectedAtEnter, afterEnter, arrowRestored: true });

      await key('ArrowRight');
      assert.equal(await id(), next);
      await select('#detail-title');
      await page.locator('#nav-prev-case').click();
      assert.equal(await id(), 'UC-001');
      const afterPointer = await selection();
      await key('ArrowRight');
      assert.equal(await id(), next);
      await key('ArrowLeft');
      assert.equal(await id(), 'UC-001');
      row.checks.push({ flow: 'selected-pointer-button', afterPointer, arrowRestored: true });

      await select('.plain-overview p');
      await key('Escape');
      assert.equal(await page.locator('#detail').evaluate(node => node.open), false);
      assert.equal(await page.locator('#query').inputValue(), '旅遊');
      assert.equal(await page.locator('#scenario').inputValue(), '生活');
      assert.equal(await page.locator('#tool').inputValue(), 'Grok Bot');
      const afterEscape = { selection: await selection(), focus: await page.evaluate(() => document.activeElement.id) };
      const card = page.locator('#results .card[data-case-id="UC-001"] .card-bottom button');
      await card.focus();
      await key('Enter');
      assert.equal(await id(), 'UC-001');
      const reopenedSelection = await selection();
      await key('ArrowRight');
      assert.equal(await id(), next);
      row.checks.push({ flow: 'selected-escape-reopen', afterEscape, reopenedSelection, arrowRestored: true });

      await key('Escape');
      await page.locator('#query').fill('test');
      await page.locator('#query').evaluate(node => node.setSelectionRange(0, 0));
      await key('ArrowRight');
      assert.equal(await page.locator('#query').evaluate(node => node.selectionStart), 1);
      assert.deepEqual(row.pageErrors, []);
      row.checks.push({ flow: 'search-caret', position: 1 });
      row.passed = true;
    } catch (error) {
      row.failure = error.stack;
      process.exitCode = 1;
    } finally {
      row.elapsedMs = Date.now() - started;
      save();
      console.log(JSON.stringify(row));
      await browser.close();
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
