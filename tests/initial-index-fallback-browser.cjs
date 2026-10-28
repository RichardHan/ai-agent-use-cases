'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

async function checkInitialIndexFallback({ browser, origin }) {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, javaScriptEnabled: false });
    try {
      await page.goto(origin);
      const fallback = page.getByRole('link', { name: /在本站閱讀完整案例索引/ });
      await fallback.focus();
      assert.equal(await fallback.evaluate(node => document.activeElement === node), true);
      await page.keyboard.press('Enter');
      await page.waitForURL(url => url.pathname.endsWith('/ai-agent-use-cases/INDEX.html'));
      assert.equal(await page.getByRole('heading', { name: '完整案例索引', exact: true }).isVisible(), true);
      await page.goBack();
      assert.equal(new URL(page.url()).pathname, new URL(origin).pathname);
    } finally {
      await page.close();
    }
  }
  console.log('Initial fallback: JS-disabled mobile/desktop local index, keyboard and return passed');
}

module.exports = checkInitialIndexFallback;
if (require.main === module) {
  (async () => {
    const browser = await chromium.launch();
    try {
      await checkInitialIndexFallback({ browser, origin: process.env.ROUND_URL || 'https://richardhan.github.io/ai-agent-use-cases/' });
    } finally {
      await browser.close();
    }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
