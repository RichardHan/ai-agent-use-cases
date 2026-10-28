'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

async function checkSearchLoadingFallback({ browser, origin }) {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const searchURL = new URL('?q=旅遊&scenario=生活&tool=Grok%20Bot#explore', origin).href;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route(/\/(?:corpus\.json|(?:cases|evidence|sources)\/.*\.md)(?:\?.*)?$/, async route => {
      await gate;
      await route.continue().catch(() => {});
    });
    try {
      await page.goto(searchURL);
      await page.waitForFunction(() => initialLoading && !discoveryReady);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const arrival = await page.evaluate(() => ({
        scrollY,
        searchTop: document.querySelector('#explore').getBoundingClientRect().top,
        loadingText: document.querySelector('#results-count').textContent,
        heroFallbackCount: document.querySelectorAll('.hero-index-fallback a[href="INDEX.html"]').length,
        searchFallbackCount: document.querySelectorAll('#explore a[href="INDEX.html"]').length
      }));
      console.log(JSON.stringify({ width, arrival }));
      assert(arrival.scrollY > 0 && Math.abs(arrival.searchTop) < 100, 'direct search anchor settles at search rather than the hero');
      assert.match(await page.locator('#results-count').innerText(), /正在讀取案例/);
      const fallback = page.locator('#search-loading-fallback');
      assert.equal(await fallback.isVisible(), true, 'direct search arrivals need an INDEX.html escape beside the loading status, not only in the hero');
      const link = fallback.getByRole('link', { name: '閱讀本站完整案例索引' });
      assert.equal(await link.getAttribute('href'), 'INDEX.html');
      assert.match(await fallback.innerText(), /不提供全文搜尋與篩選/);
      assert.equal(await link.evaluate(node => !!node.closest('#explore') && !node.closest('[role="status"], [aria-live]')), true);
      const visible = await link.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight;
      });
      assert(visible, 'fallback is visible on arrival without scrolling at desktop and mobile sizes');
      assert.equal(await page.locator('#query').inputValue(), '旅遊');
      assert.equal(await page.locator('#scenario').inputValue(), '生活');
      assert.equal(await page.locator('#tool').inputValue(), 'Grok Bot');
      const waitingPage = await context.newPage();
      await waitingPage.goto(searchURL);
      await waitingPage.waitForFunction(() => initialLoading && !discoveryReady);
      await waitingPage.locator('#search-loading-fallback a').focus();
      await waitingPage.keyboard.press('Shift');
      assert.equal(await waitingPage.locator('#search-loading-fallback a').evaluate(node => document.activeElement === node), true);
      await link.focus();
      assert.equal(await link.evaluate(node => document.activeElement === node), true);
      await page.keyboard.press('Enter');
      await page.waitForURL(new URL('INDEX.html', origin).href);
      assert.equal(new URL(page.url()).pathname, new URL('INDEX.html', origin).pathname);
      release();
      await waitingPage.waitForFunction(() => !initialLoading);
      assert.equal(await waitingPage.evaluate(() => document.activeElement.id), 'query', 'completion preserves keyboard focus');
      assert.equal(await waitingPage.locator('#query').evaluate(node => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), true, 'focus remains visible');
      await waitingPage.close();
      await context.unrouteAll({ behavior: 'wait' });
      await page.goto(searchURL);
      await page.waitForFunction(() => discoveryReady);
      assert.equal(await page.locator('#search-loading-fallback').isHidden(), true);
      assert.equal(await page.locator('#query').inputValue(), '旅遊');
      assert.equal(await page.locator('#scenario').inputValue(), '生活');
      assert.equal(await page.locator('#tool').inputValue(), 'Grok Bot');
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, stalledSearchFallback: true, localIndexKeyboardNavigation: true, completedLoadingHidesFallback: true, preservedQueryAndFacets: true }));
    } finally {
      release();
      await context.close();
    }
  }
}

module.exports = checkSearchLoadingFallback;
if (require.main === module) {
  (async () => {
    const browser = await chromium.launch();
    try {
      await checkSearchLoadingFallback({ browser, origin: process.env.ROUND_URL || 'https://richardhan.github.io/ai-agent-use-cases/' });
    } finally {
      await browser.close();
    }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
