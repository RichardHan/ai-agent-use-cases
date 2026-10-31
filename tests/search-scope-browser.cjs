'use strict';
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {AxeBuilder} = require('@axe-core/playwright');
const {ensureFiltersVisible} = require('./filter-controls.cjs');
const base = process.env.SEARCH_SCOPE_URL || 'http://127.0.0.1:8106/';
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({viewport:{width,height:width===320?740:844},permissions:['clipboard-read','clipboard-write']});
      const page = await context.newPage();
      await page.goto(new URL('?q=會議#explore', base).href);
      await page.locator('#results .card').first().waitFor();
      await page.locator('.search-scope').waitFor({state:'visible'});
      const scope = page.locator('#search-scope');
      await page.locator('#query').fill('');
      assert.equal(await page.locator('.search-scope').isVisible(), false);
      assert.equal(await scope.inputValue(), '');
      await page.locator('#query').fill('會議');
      const full = await page.locator('#results .card').count();
      await scope.selectOption('overview');
      const focused = await page.locator('#results .card').count();
      assert(focused > 0 && focused < full, `${focused} of ${full}`);
      assert.equal(new URL(page.url()).searchParams.get('scope'), 'overview');
      assert.equal(await page.locator('#results .card[data-case-id="UC-094"]').count(), 1);
      assert.equal(await page.locator('#results .card').evaluateAll(cards => cards.every(card => /標題|用途|解決痛點/.test(card.querySelector('.search-context-label')?.textContent||''))), true);
      await page.reload();
      await page.locator('#results .card').first().waitFor();
      assert.equal(await scope.inputValue(), 'overview', 'old shared overview URLs retain narrow semantics');
      assert.equal(await page.locator('#results .card').count(), focused);
      await scope.selectOption('');
      assert.equal(await page.locator('#results .card').count(), full);
      await page.locator('#query').fill('旅遊');
      assert.equal(await page.locator('#results .card[data-case-id="UC-076"]').count(), 1, 'full text retains incidental author hit');
      await scope.focus();
      // macOS Chromium opens a native popup that Playwright cannot drive with arrow keys.
      if (process.platform === 'darwin') await scope.selectOption('topic');
      else {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
      assert.equal(await scope.inputValue(), 'topic', 'topic scope can be selected');
      assert.equal(await page.locator('#results .card[data-case-id="UC-040"]').count(), 1);
      assert.equal(await page.locator('#results .card[data-case-id="UC-076"]').count(), 0);
      assert.match(await page.locator('#results .card[data-case-id="UC-040"] .search-context-label').first().innerText(), /分類|標籤/);
      await page.locator('.search-scope summary').click();
      assert.match(await page.locator('#scope-note').innerText(), /不代表.*驗證/);
      await ensureFiltersVisible(page);
      await page.locator('#scenario').selectOption('生活');
      await page.locator('#kind').selectOption('case');
      await page.locator('#category').selectOption('旅遊／排程跟進');
      const combined = await page.locator('#results .card').count();
      assert(combined > 0);
      await page.locator('#copy-search-link').click();
      const share = new URL(await page.evaluate(() => navigator.clipboard.readText()));
      assert.equal(share.searchParams.get('scope'), 'topic');
      assert.equal(share.searchParams.get('category'), '旅遊／排程跟進');
      await page.locator('#results .card[data-case-id="UC-040"] h3 button').click();
      assert.equal(new URL(page.url()).searchParams.get('scope'), 'topic');
      await page.goBack();
      await page.locator('#detail').waitFor({state:'hidden'});
      assert.equal(await scope.inputValue(), 'topic');
      assert.equal(await page.locator('#results .card').count(), combined);
      await page.goto(share.href);
      await page.locator('#results .card').first().waitFor();
      assert.equal(await scope.inputValue(), 'topic');
      assert.equal(await page.locator('#results .card').count(), combined);
      if (width === 320) {
        const position = await page.locator('#results-count').boundingBox();
        const viewportHeight = await page.evaluate(() => innerHeight);
        assert(position.y >= 0 && position.y + position.height <= viewportHeight,
          'shared search result count is fully visible on narrow screens');
      }
      await page.locator('#query').fill('不存在字串xyz');
      assert.equal(await page.locator('#empty').isVisible(), true);
      assert.equal(new URL(page.url()).searchParams.get('scope'), 'topic');
      const audit = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      assert.deepEqual(audit.violations.map(v => v.id), []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.locator('#query').fill('  ');
      assert.equal(await scope.inputValue(), '');
      assert.equal(new URL(page.url()).searchParams.has('scope'), false);
      if (width === 1440) {
        await page.goto(new URL('?q=UC001&scope=overview&scenario=%E9%96%8B%E7%99%BC&kind=pending&tool=Grok%20Bot#explore',base).href);
        await page.locator('#results-count').getByText(/顯示 0/).waitFor();
        const recovery = page.locator('#empty-suggestions [data-remove-filters]').first();
        await recovery.waitFor();
        const promised = Number((await recovery.innerText()).match(/查看 (\d+) 筆/)[1]);
        await recovery.click();
        assert.equal(await page.locator('#results .card').count(),promised);
        await page.goto(new URL('?q=旅遊&scope=unknown#explore',base).href);
        await page.locator('#results .card').first().waitFor();
        assert.equal(await scope.inputValue(), '');
        assert.equal(await page.locator('#results .card[data-case-id="UC-076"]').count(), 1);
      }
      console.log(`PASS ${width}px: full, legacy overview, topic travel, sharing, Back and empty state`);
      await context.close();
    }
    // Delay the corpus to ensure the requested scope survives hydration.
    const context = await browser.newContext();
    const page = await context.newPage();
    let release;
    const gate = new Promise(resolve => { release=resolve; });
    await page.route('**/corpus.json*', async route => { await gate; await route.continue(); });
    await page.goto(new URL('?q=旅遊&scope=topic#explore',base).href, {waitUntil:'domcontentloaded'});
    await page.locator('#search-scope').waitFor({state:'visible'});
    assert.equal(await page.locator('#search-scope').inputValue(), 'topic');
    assert.match(await page.locator('#results-count').innerText(), /讀取|載入/);
    release();
    await page.locator('#copy-search-link:not([disabled])').waitFor();
    assert.equal(await page.locator('#search-scope').inputValue(), 'topic');
    assert.equal(await page.locator('#results .card[data-case-id="UC-040"]').count(), 1);
    assert.equal(await page.locator('#results .card[data-case-id="UC-076"]').count(), 0);
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
