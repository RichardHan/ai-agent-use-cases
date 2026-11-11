'use strict';
// A failed catalogue load used to be announced only inside #discover and #explore.
// Measured on the published build 2026-11-11 (sourceRevision d19eceac) with
// catalog.json aborted: at 390x844 the first error text started at 1324px and the
// #error block at 2308px of an 844px screen, so the hero and its 53 task links
// looked exactly like a working library; tapping one led to "載入未完成" two screens
// down. At 320x640 even the static "載入較慢時" hint (704px) was below the fold.
//
// This test holds the first-screen promise: when the load fails the reader is told
// where they are, what still works, and given the two exits (retry, index); when
// the load succeeds the notice never renders.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

(async () => {
  const browser = await chromium.launch();
  const origin = process.env.HERO_FAILURE_URL || process.env.SITE_URL || 'http://127.0.0.1:8081/ai-agent-use-cases/';
  fs.mkdirSync('qa-artifacts', { recursive: true });
  const report = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844], ['narrow', 320, 640]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      let failCatalog = true;
      await context.route('**/catalog.json', route => (failCatalog ? route.abort() : route.continue()));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(origin, { waitUntil: 'load' });
      await page.locator('#results-count').filter({ hasText: '載入未完成' }).waitFor({ timeout: 60000 });
      await page.waitForTimeout(600);

      const failed = await page.evaluate(() => {
        const notice = document.querySelector('#hero-load-failure');
        const rect = notice ? notice.getBoundingClientRect() : null;
        const onScreen = node => {
          if (!node || node.hidden) return false;
          const box = node.getBoundingClientRect();
          return box.height > 0 && box.top >= 0 && box.bottom <= innerHeight;
        };
        const retry = document.querySelector('#hero-retry');
        return {
          noticeVisible: onScreen(notice),
          noticeRect: rect ? { top: Math.round(rect.top), bottom: Math.round(rect.bottom) } : null,
          noticeText: notice ? notice.innerText.replace(/\n+/g, ' ').trim() : '',
          // The failure is announced once, by #error's assertive alert further down;
          // this first-screen summary must not be a second live region.
          noticeRole: notice ? notice.getAttribute('role') : null,
          errorRole: document.querySelector('#error')?.getAttribute('role') || null,
          retryVisible: onScreen(retry),
          retryName: retry ? retry.textContent.trim() : '',
          indexHref: document.querySelector('#hero-load-failure a')?.getAttribute('href') || null,
          deeperErrorTop: Math.round(document.querySelector('#error')?.getBoundingClientRect().top ?? -1),
          viewport: innerHeight,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });

      assert.equal(failed.noticeVisible, true,
        `${name}: the failed load is stated on the first screen (notice ${JSON.stringify(failed.noticeRect)} of ${failed.viewport}; the deeper error block starts at ${failed.deeperErrorTop})`);
      assert.equal(failed.errorRole, 'alert', `${name}: the failure is announced by the assertive error block`);
      assert.equal(failed.noticeRole, null, `${name}: the first-screen summary is not a second live region`);
      assert.match(failed.noticeText, /無法載入/, `${name}: the notice names the failure`);
      assert.match(failed.noticeText, /沒有結果/, `${name}: it says what the reader will see if they search anyway`);
      assert.equal(failed.retryVisible, true, `${name}: the retry control is on the first screen`);
      assert.equal(failed.indexHref, 'INDEX.html', `${name}: the index exit points at the static index`);
      assert.equal(failed.overflow, 0, `${name}: no horizontal overflow while the notice is shown`);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(violation => violation.id), [], `${name}: no axe violations with the notice shown`);
      await page.screenshot({ path: `qa-artifacts/hero-load-failure-${name}.jpg`, type: 'jpeg', quality: 70 });

      // The retry reuses the one reload path: it must leave the notice behind.
      failCatalog = false;
      await page.screenshot({ path: `qa-artifacts/hero-load-failure-${name}-before-retry.jpg`, type: 'jpeg', quality: 70 });
      await page.locator('#hero-retry').click();
      await page.locator('#results-count').filter({ hasText: '顯示' }).waitFor({ timeout: 60000 });
      await page.waitForTimeout(800);
      const recovered = await page.evaluate(() => ({
        noticeHidden: document.querySelector('#hero-load-failure').hidden,
        count: document.querySelector('#results-count').textContent.trim(),
        focus: document.activeElement.id || document.activeElement.tagName
      }));
      assert.equal(recovered.noticeHidden, true, `${name}: a successful retry clears the first-screen failure`);
      assert.match(recovered.count, /^顯示 \d+ \/ \d+ 筆收錄$/, `${name}: the retried catalogue reports a real count (${recovered.count})`);
      assert.deepEqual(errors, [], `${name}: no page errors`);

      // A healthy load must not gain the notice or lose the hero directory.
      const healthyContext = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const healthyPage = await healthyContext.newPage();
      await healthyPage.goto(origin, { waitUntil: 'load' });
      await healthyPage.locator('#results-count').filter({ hasText: '顯示' }).waitFor({ timeout: 60000 });
      await healthyPage.waitForTimeout(600);
      const healthy = await healthyPage.evaluate(() => ({
        noticeHidden: document.querySelector('#hero-load-failure').hidden,
        tasks: document.querySelectorAll('#hero-problem-tags a.problem-tag').length,
        heroHeight: Math.round(document.querySelector('.discovery-hero').getBoundingClientRect().height)
      }));
      assert.equal(healthy.noticeHidden, true, `${name}: a healthy load never renders the failure notice`);
      assert.equal(healthy.tasks, 53, `${name}: the task directory keeps all 53 entries`);
      const healthyAxe = await new AxeBuilder({ page: healthyPage }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(healthyAxe.violations.map(violation => violation.id), [], `${name}: no axe violations on the healthy first screen`);
      await healthyContext.close();

      report.push({ viewport: name, failed, recovered, healthy });
      await context.close();
    }
    console.log('HERO_LOAD_FAILURE ' + JSON.stringify(report));
    if (process.env.QA_OUT) fs.writeFileSync(process.env.QA_OUT, JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})();
