'use strict';
const assert = require('node:assert/strict');
const {ensureFiltersVisible} = require('./filter-controls.cjs');

module.exports = async ({browser, origin}) => {
  for (const [width, height] of [[1440, 900], [390, 844], [320, 740]]) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // A visitor starts with the problem, not a product name.
      await page.goto(origin, {waitUntil: 'networkidle'});
      await page.locator('#query').fill('地圖收藏');
      await page.locator('#query').press('Enter');
      const target = page.locator('#results .card').filter({hasText: 'UC-227'});
      await target.waitFor();
      assert.match(await target.innerText(), /Meta Muse/);
      assert.doesNotMatch(await target.locator('.card-id-tool').innerText(), /Cursor/);

      // The old shared filter now honestly yields zero; recovery keeps the query.
      await page.goto(origin + '?q=UC-227&scope=topic&tool=Cursor#explore', {waitUntil: 'networkidle'});
      assert.equal(await page.locator('#results .card').count(), 0);
      await page.locator('#clear-facets').click();
      await target.waitFor();
      assert.equal(await page.locator('#query').inputValue(), 'UC-227');
      // Clear-all also resets scope; explicitly choose it again before sharing.
      await page.locator('#search-scope').selectOption('topic');
      await page.locator('#results .card').screenshot({path: `qa-artifacts/cursor-context-${width}.png`});
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

      // Keyboard detail and return retain the precise query and focus.
      const trigger = target.locator('h3 button');
      await trigger.focus();
      await page.keyboard.press('Enter');
      await page.locator('#detail[open]').waitFor();
      const share = page.url();
      assert.match(await page.locator('#detail').innerText(), /本庫未獨立重現/);
      await page.keyboard.press('Escape');
      assert(await trigger.evaluate(node => node === document.activeElement));
      await page.goto(share, {waitUntil: 'networkidle'});
      await page.reload({waitUntil: 'networkidle'});
      await page.locator('#detail[open]').waitFor();
      const source = page.locator('#detail a').filter({hasText: 'GitHub 原始 Markdown'}).first();
      assert.match(await source.getAttribute('href'), /\/blob\/[a-f0-9]{40}\/cases\/227-/);
      await page.locator('#close-detail').click();
      assert.equal(await page.locator('#query').inputValue(), 'UC-227');
      assert.equal(await page.locator('#search-scope').inputValue(), 'topic');

      // Literal prose search still finds the source's cursor; real product uses stay.
      await page.goto(origin + '?q=UC-227%20cursor#explore', {waitUntil: 'networkidle'});
      await target.waitFor();
      await ensureFiltersVisible(page);
      await page.locator('#tool').selectOption('Cursor');
      assert.equal(await page.locator('#results .card').count(), 0);
      await page.goto(origin + '?q=UC-005&scope=topic&tool=Cursor#explore', {waitUntil: 'networkidle'});
      assert.match(await page.locator('#results .card-id-tool').innerText(), /UC-005.*Cursor/);
      assert.deepEqual(errors, []);
      console.log(`PASS CURSOR CONTEXT: ${width}px, problem discovery, honest zero/recovery, keyboard, shared detail/reload/source/return, literal search and real product`);
    } finally {
      await context.close();
    }
  }
};
