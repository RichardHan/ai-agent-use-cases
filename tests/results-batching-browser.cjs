'use strict';
const { chromium, firefox, webkit } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = process.env.ROUND_URL || 'http://127.0.0.1:8100/ai-agent-use-cases/';
const out = process.env.QA_OUT || 'qa-artifacts/batching';
fs.mkdirSync(out, { recursive: true });
const report = [];
(async () => {
  const matrix = process.env.BATCH_ALL_BROWSERS === '1'
    ? [[chromium, 1440], [chromium, 390], [chromium, 320], [firefox, 390], [webkit, 390]]
    : [[chromium, 390], [chromium, 1440]];
  for (const [engine, width] of matrix) {
    const browser = await engine.launch();
    const row = { engine: engine.name(), width, errors: [] };
    report.push(row);
    try {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      page.on('pageerror', error => row.errors.push(error.message));
      await page.goto(base);
      await page.waitForFunction(() => discoveryReady);
      const total = await page.evaluate(() => currentFiltered.length);
      assert(total > 72, 'fixture contains multiple batches');
      assert.equal(await page.locator('#results .card').count(), 24, 'start with a readable first batch');
      assert.match(await page.locator('#results-count').innerText(), new RegExp(`${total} / ${total}`));
      const more = page.locator('#load-more-results');
      await more.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#results .card').count(), 48);
      const firstNew = page.locator('#results .card').nth(24).locator('h3 button');
      await page.screenshot({ path: `${out}/${engine.name()}-${width}-first-batch.png` });
      row.firstBatch = await firstNew.evaluate(el => ({ focused: document.activeElement === el, top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom, height: innerHeight }));
      assert(row.firstBatch.focused, 'every batch hands focus to the first appended case title');
      assert(row.firstBatch.top >= 0 && row.firstBatch.bottom <= row.firstBatch.height, 'new keyboard focus stays visible');
      assert(await page.locator('#results .card').nth(24).locator('.summary').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight), 'first new case purpose is readable without another scroll');
      // macOS WebKit follows the system setting: Option+Tab includes buttons.
      await page.keyboard.press(engine.name() === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
      assert.equal(await page.evaluate(() => document.activeElement.closest('.card')?.dataset.caseId), await page.locator('#results .card').nth(24).getAttribute('data-case-id'), 'next Tab continues within the new card, not at the footer');
      await firstNew.focus();
      await page.keyboard.press('Enter');
      await page.locator('#detail[open]').waitFor();
      await page.locator('#close-detail').click();
      assert(await firstNew.evaluate(el => document.activeElement === el), 'closing detail returns to the appended title');
      await more.click();
      assert.equal(await page.locator('#results .card').count(), 72);
      assert(await page.locator('#results .card').nth(48).locator('h3 button').evaluate(el => document.activeElement === el), 'pointer activation also starts at the new batch');
      await more.focus();
      await page.keyboard.press('Space');
      assert.equal(await page.locator('#results .card').count(), 96);
      assert(await page.locator('#results .card').nth(72).locator('h3 button').evaluate(el => document.activeElement === el), 'Space activation starts at the new batch');
      const laterId = await page.locator('#results .card').nth(30).getAttribute('data-case-id');
      const trigger = page.locator('#results .card').nth(30).locator('.card-bottom button');
      await trigger.click();
      await page.goBack();
      assert.equal(await trigger.evaluate(el => document.activeElement === el), true, 'return to the card in a later batch');
      await page.locator('#query').fill('旅遊');
      await page.goForward();
      await page.locator('#detail[open]').waitFor();
      await page.locator('#close-detail').click();
      assert.equal(await page.evaluate(() => document.activeElement.closest('.card')?.dataset.caseId), laterId, 'forward and close restore a later-batch trigger');
      await page.locator('#query').fill('旅遊');
      await page.locator('#filter-options').evaluate(el => el.open = true);
      await page.locator('#scenario').selectOption('生活');
      assert(await page.locator('#results .card').count() <= 24, 'a changed query resets the visible batch');
      assert.equal(await page.locator('#load-more-results').isVisible(), false, 'no more control when all matches fit');
      const detailUrl = new URL(base);
      detailUrl.searchParams.set('q', '旅遊');
      detailUrl.searchParams.set('scenario', '生活');
      detailUrl.searchParams.set('case', 'UC-001');
      await page.goto(detailUrl.href);
      await page.locator('#detail[open]').waitFor();
      // This is a completed-load reload check. Early-reader cancellation is
      // covered separately by the loading lifecycle browser tests.
      await page.waitForFunction(() => discoveryReady);
      await page.reload();
      await page.locator('#detail[open]').waitFor();
      await page.waitForFunction(() => discoveryReady);
      assert(await page.locator('#detail-body a[href^="https://"]').count() > 0, 'reader retains external source links');
      await page.locator('#close-detail').click();
      assert.equal(await page.locator('#query').inputValue(), '旅遊');
      assert.equal(await page.locator('#scenario').inputValue(), '生活');
      await page.locator('#query').fill('no-match-987654');
      assert.equal(await page.locator('#results .card').count(), 0);
      assert.equal(await page.locator('#load-more-results').isVisible(), false);
      await page.locator('#query').fill('');
      await page.locator('#filter-options').evaluate(el => el.open = true);
      await page.locator('#scenario').selectOption('');
      while (await more.isVisible()) {
        const start = await page.locator('#results .card').count();
        await more.focus();
        await page.keyboard.press('Enter');
        const title = page.locator('#results .card').nth(start).locator('h3 button');
        assert(await title.evaluate(el => document.activeElement === el), 'each batch, including the last, starts at its first new case');
      }
      assert.equal(await page.locator('#results .card').count(), total);
      assert.equal(await page.evaluate(() => document.activeElement.closest('.card')?.dataset.caseId), await page.locator('#results .card').nth(Math.floor((total-1)/24)*24).getAttribute('data-case-id'), 'last batch hands focus to its first new card');
      assert.equal(await page.locator('#results .card').evaluateAll(cards => new Set(cards.map(card => card.dataset.caseId)).size), total, 'all batches are complete without duplicates');
      assert.deepEqual(row.errors, []);
      row.passed = true;
      row.total = total;
      console.log(`PASS ${engine.name()} ${width}: batching, keyboard, pointer, details, history, filters, empty, direct link`);
      await page.close();
    } catch (error) { row.failure = error.stack; throw error; }
    finally { fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
