'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { ensureFiltersVisible } = require('./filter-controls.cjs');

(async () => {
  const browser = await chromium.launch();
  try {
    const origin = process.env.ROUND_URL || 'http://127.0.0.1:8081/ai-agent-use-cases/';
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.locator('#results .card').first().waitFor();
      const shortcut = page.getByRole('link', { name: '論文資料' });
      await shortcut.focus();
      assert.equal(await shortcut.evaluate(node => document.activeElement === node), true);
      await page.keyboard.press('Enter');
      await page.waitForURL(url => url.searchParams.get('q') === '論文');
      assert.equal(new URL(page.url()).searchParams.get('q'), '論文');
      assert.equal(await page.locator('#query').inputValue(), '論文');
      assert.match(await page.locator('#results .card').first().innerText(), /UC-012[\s\S]*寫論文前/);
      assert.doesNotMatch(await page.locator('#results .card').first().innerText(), /競品研究簡報/);
      await page.goBack();
      await page.waitForURL(url => !url.searchParams.has('q'));
      assert.equal(new URL(page.url()).searchParams.has('q'), false);
      await page.goForward();
      await page.waitForURL(url => url.searchParams.get('q') === '論文');
      assert.equal(new URL(page.url()).searchParams.get('q'), '論文');
      await ensureFiltersVisible(page);
      await page.locator('#scenario').selectOption('學習');
      assert.match(await page.locator('#results-count').innerText(), /顯示 3 \/ 459/);
      await page.locator('#query').fill('不存在的論文詞');
      assert.equal(await page.locator('#empty').isVisible(), true);
      await page.locator('#query').fill('論文');
      await ensureFiltersVisible(page);
      await page.locator('#scenario').selectOption('');
      await page.locator('#results .card h3 button').first().click();
      assert.equal(new URL(page.url()).searchParams.get('case'), 'UC-012');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#detail[open]').waitFor();
      assert.match(await page.locator('#detail-body').innerText(), /作者報告／示範/);
      assert.match(await page.locator('#detail-body a[href*="github.com/"]').first().getAttribute('href'), /^https:\/\/github\.com\//);
      await page.keyboard.press('Escape');
      assert.equal(new URL(page.url()).searchParams.get('q'), '論文');
      assert.equal(new URL(page.url()).searchParams.has('case'), false);
      await page.close();
    }
    console.log('Paper shortcut: mobile and desktop keyboard, history, search, filter, empty state, detail reload and return passed');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
