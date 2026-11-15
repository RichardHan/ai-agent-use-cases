'use strict';
const assert = require('node:assert/strict');

module.exports = async ({browser, origin}) => {
  for (const [width, height] of [[1440, 900], [390, 844], [320, 740]]) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // Start with the task rather than knowing which agent product was used.
      await page.goto(origin, {waitUntil: 'networkidle'});
      await page.locator('#query').fill('外部 QA');
      await page.locator('#query').press('Enter');
      const target = page.locator('#results .card[data-case-id="UC-383"]');
      await target.waitFor();
      assert.equal(await target.locator('.card-id-tool').innerText(), 'UC-383 · Grok Bot / GitHub');

      // A previously shared false-positive combination must recover honestly.
      await page.goto(origin + '?q=UC-383&scope=topic&tool=Cursor#explore', {waitUntil: 'networkidle'});
      assert.equal(await page.locator('#results .card').count(), 0);
      await page.locator('#clear-facets').click();
      await target.waitFor();
      assert.equal(await page.locator('#query').inputValue(), 'UC-383');
      await page.locator('#search-scope').selectOption('topic');
      await target.screenshot({path: `qa-artifacts/bot-account-${width}.png`});
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

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
      assert.match(await source.getAttribute('href'), /\/blob\/[a-f0-9]{40}\/cases\/383-/);
      await page.locator('.research-details summary').click();
      assert.match(await page.locator('.markdown').innerText(), /cursor\[bot\]/);
      assert(await page.evaluate(() => document.querySelector('#detail').scrollWidth <= document.querySelector('#detail').clientWidth));
      await page.locator('#close-detail').click();
      assert.equal(await page.locator('#query').inputValue(), 'UC-383');
      assert.equal(await page.locator('#search-scope').inputValue(), 'topic');

      // The original account is still searchable; explicit product use still counts.
      await page.goto(origin + '?q=UC-383%20cursor#explore', {waitUntil: 'networkidle'});
      await target.waitFor();
      await page.goto(origin + '?q=UC-158&scope=topic&tool=Cursor#explore', {waitUntil: 'networkidle'});
      assert.match(await page.locator('#results .card-id-tool').innerText(), /UC-158.*Cursor/);
      assert.deepEqual(errors, []);
      console.log(`PASS BOT ACCOUNT: ${width}px task discovery, zero/recovery, keyboard, detail/reload/source/return, original text/search and explicit product`);
    } finally {
      await context.close();
    }
  }
};
