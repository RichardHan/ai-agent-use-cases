'use strict';
// Reproduces the dead end twice: once with JavaScript disabled, and once with
// `assets/app.js` returning 503 (script load failure with JavaScript enabled).
// In both cases the results area stays on "正在讀取案例…" and the #error block
// that contains the index link is still hidden. The delivered fallback must be
// visible, on screen, and open the in-site INDEX.html.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const origin = process.env.READING_FALLBACK_URL || process.env.SITE_URL || 'http://127.0.0.1:8081/ai-agent-use-cases/';
  const out = process.env.QA_OUT || 'qa-artifacts/static-reading-fallback';
  fs.mkdirSync(out, {recursive: true});
  const report = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844], ['narrow', 320, 568]]) {
      for (const mode of ['js-disabled', 'app-js-503']) {
        const context = await browser.newContext({
          viewport: {width, height},
          javaScriptEnabled: mode !== 'js-disabled'
        });
        if (mode === 'app-js-503') {
          await context.route('**/assets/app.js*', route => route.fulfill({status: 503, contentType: 'text/plain', body: 'blocked'}));
        }
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(String(error)));
        await page.goto(origin + '?q=%E6%9C%83%E8%AD%B0#explore', {waitUntil: 'load'});
        // With javaScriptEnabled:false Playwright cannot run waitForFunction in
        // the page, but evaluate still reads layout. Poll the section top so the
        // assertion below measures the arrival position, not scrollY 0.
        let settled = false;
        for (let attempt = 0; attempt < 50; attempt++) {
          const top = await page.evaluate(() => document.querySelector('#explore')?.getBoundingClientRect().top);
          if (typeof top === 'number' && top >= -2 && top <= 80) { settled = true; break; }
          await page.waitForTimeout(100);
        }
        assert.ok(settled, `${name}/${mode}: #explore did not settle at the arrival position`);
        await page.locator('#static-reading-fallback').waitFor({state: 'visible', timeout: 30000});

        const state = await page.evaluate(() => {
          const fallback = document.querySelector('#static-reading-fallback');
          const link = fallback?.querySelector('a[href="INDEX.html"]');
          const box = link?.getBoundingClientRect();
          return {
            results: document.querySelector('#results-count')?.textContent,
            errorHidden: document.querySelector('#error')?.hidden,
            linkText: link?.textContent.trim() || '',
            linkTop: box ? Math.round(box.top) : -1,
            linkBottom: box ? Math.round(box.bottom) : -1,
            viewport: innerHeight,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
          };
        });
        assert.match(state.results, /正在讀取案例/, `${name}/${mode}: the results area must still be loading`);
        assert.equal(state.errorHidden, true, `${name}/${mode}: the live error block is not the fallback`);
        assert.ok(state.linkTop >= 0 && state.linkBottom <= state.viewport,
          `${name}/${mode}: the index link must be on the first screen (${state.linkTop}-${state.linkBottom}/${state.viewport})`);
        assert.equal(state.overflow, 0, `${name}/${mode}: no horizontal overflow`);
        assert.deepEqual(errors, [], `${name}/${mode}: unexpected page errors`);

        await page.screenshot({path: path.join(out, `${name}-${mode}.png`)});
        const responsePromise = page.waitForResponse(response => /\/INDEX\.html$/i.test(new URL(response.url()).pathname), {timeout: 30000});
        await page.locator('#static-reading-fallback a[href="INDEX.html"]').click();
        const response = await responsePromise;
        await page.waitForURL(/\/INDEX\.html$/i, {timeout: 30000});
        // preview.py cannot render Jekyll's uppercase INDEX.html on a
        // case-insensitive filesystem; the built-site checker proves the table.
        // Here the browser promise is that the delivered link is a live page.
        assert.ok(response.ok(), `${name}/${mode}: the index link returned ${response.status()}`);

        report.push({name, mode, results: state.results, link: state.linkText, top: state.linkTop, viewport: state.viewport, overflow: state.overflow});
        await context.close();
      }

      const normal = await browser.newContext({viewport: {width, height}});
      const page = await normal.newPage();
      await page.goto(origin + '?q=%E6%9C%83%E8%AD%B0#explore', {waitUntil: 'load'});
      await page.locator('#results-count').filter({hasText: '筆收錄'}).waitFor({timeout: 90000});
      assert.equal(await page.locator('#static-reading-fallback').isVisible(), false,
        `${name}/normal: the live results must replace the static note`);
      await page.screenshot({path: path.join(out, `${name}-normal.png`)});
      report.push({name, mode: 'normal', fallbackVisible: false});
      await normal.close();
    }
    console.log('PASS static reading fallback: ' + JSON.stringify(report));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
