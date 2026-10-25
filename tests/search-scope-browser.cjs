'use strict';
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {AxeBuilder} = require('@axe-core/playwright');
const {ensureFiltersVisible} = require('./filter-controls.cjs');
const base = process.env.SEARCH_SCOPE_URL || 'http://127.0.0.1:8106/';
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({viewport:{width,height:844},permissions:['clipboard-read','clipboard-write']});
      const page = await context.newPage();
      await page.goto(new URL('?q=會議#explore', base).href);
      await page.locator('#results .card').first().waitFor();
      const full = await page.locator('#results .card').count();
      assert(full > 1);
      await page.getByRole('checkbox', {name:/只看標題與用途/}).check();
      const focused = await page.locator('#results .card').count();
      assert(focused > 0 && focused < full, `${focused} of ${full}`);
      assert.equal(new URL(page.url()).searchParams.get('scope'), 'overview');
      assert.equal(await page.locator('#results .card[data-case-id="UC-094"]').count(), 1);
      await ensureFiltersVisible(page);
      await page.locator('#scenario').selectOption('工作');
      const combined = await page.locator('#results .card').count();
      assert(combined > 0 && combined <= focused);
      await page.locator('#scenario').selectOption('');
      assert.equal(await page.locator('#results .card[data-case-id="UC-071"]').count(), 1);
      assert.equal(await page.locator('#results .card').evaluateAll(cards => cards.every(card => /標題|用途/.test(card.querySelector('.search-context-label')?.textContent||''))), true);
      await page.locator('#copy-search-link').click();
      const share = new URL(await page.evaluate(() => navigator.clipboard.readText()));
      assert.equal(share.searchParams.get('scope'), 'overview');
      await page.locator('#results .card h3 button').first().click();
      const direct = page.url();
      assert.equal(new URL(direct).searchParams.get('scope'), 'overview');
      await page.reload();
      await page.locator('#detail[open]').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('checkbox', {name:/只看標題與用途/}).isChecked(), true);
      assert.equal(await page.locator('#results .card').count(), focused);
      await page.getByRole('checkbox', {name:/只看標題與用途/}).uncheck();
      assert.equal(await page.locator('#results .card').count(), full);
      assert.equal(new URL(page.url()).searchParams.has('scope'), false);
      await page.locator('#query').fill('不存在字串xyz');
      assert.equal(await page.locator('#results .card').count(), 0);
      const audit = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      assert.deepEqual(audit.violations.map(v => v.id), []);
      await page.getByRole('checkbox', {name:/只看標題與用途/}).check();
      assert.equal(await page.locator('#empty').isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (width === 1440) {
        await page.goto(new URL('?q=UC001&scope=overview&scenario=%E9%96%8B%E7%99%BC&kind=pending&tool=Grok%20Bot#explore',base).href);
        await page.locator('#results-count').getByText(/顯示 0/).waitFor();
        const recovery = page.locator('#empty-suggestions [data-remove-filters]').first();
        await recovery.waitFor();
        const promised = Number((await recovery.innerText()).match(/查看 (\d+) 筆/)[1]);
        await recovery.click();
        assert.equal(await page.locator('#results .card').count(),promised);
      }
      console.log(`PASS ${width}px: full=${full}, overview=${focused}, direct link and empty state`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
