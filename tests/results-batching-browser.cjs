'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.ROUND_URL || 'http://127.0.0.1:8100/ai-agent-use-cases/';
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      await page.goto(base);
      await page.waitForFunction(() => discoveryReady);
      const total = await page.evaluate(() => currentFiltered.length);
      assert(total > 48, 'fixture contains multiple batches');
      assert.equal(await page.locator('#results .card').count(), 24, 'start with a readable first batch');
      assert.match(await page.locator('#results-count').innerText(), new RegExp(`${total} / ${total}`));
      const more = page.locator('#load-more-results');
      await more.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#results .card').count(), 48);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'load-more-results');
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
      await page.reload();
      await page.locator('#detail[open]').waitFor();
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
      while (await page.locator('#load-more-results').isVisible()) {
        await page.locator('#load-more-results').focus();
        await page.keyboard.press('Enter');
      }
      assert.equal(await page.locator('#results .card').count(), total);
      assert.equal(await page.evaluate(() => document.activeElement.closest('.card')?.dataset.caseId), await page.locator('#results .card').nth(Math.floor((total-1)/24)*24).getAttribute('data-case-id'), 'last batch hands focus to its first new card');
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
