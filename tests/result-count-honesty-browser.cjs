'use strict';
// Three numbers describe the same condition on the results screen: the result
// count, the drawable-card count in the sample panel, and the remaining batch
// text on "再看更多結果". Before this check the panel called its drawable pool
// "N 張案例卡" beside a larger result count with no explanation, and a narrower
// query left the hidden batch control claiming "再看 -19 筆（尚有 -19 筆）".
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8099/ai-agent-use-cases/';
fs.mkdirSync('qa-artifacts', { recursive: true });

const setQuery = (page, value) => page.evaluate(query => {
  const input = document.getElementById('query');
  input.value = query;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}, value);

const read = page => page.evaluate(() => ({
  resultsCount: document.getElementById('results-count').textContent,
  drawStatus: document.getElementById('draw-status').textContent,
  batchHidden: document.getElementById('load-more-results').hidden,
  batchText: document.getElementById('load-more-results').textContent,
  gapHidden: document.getElementById('purpose-gap')?.hidden ?? null,
  gapText: document.getElementById('purpose-gap-message')?.textContent ?? '',
  scope: document.getElementById('search-scope').value,
  emptyShown: !document.getElementById('empty').hidden,
  cards: document.querySelectorAll('#results .card').length
}));

(async () => {
  const browser = await chromium.launch();
  const report = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.locator('#results .card').first().waitFor({ timeout: 60000 });
      assert.equal(await page.locator('#purpose-gap').count(), 1, `${name}: the results screen offers a match-scope notice`);

      // A batch is on screen first, so visibleResults sits at 24.
      await setQuery(page, '整理');
      await page.waitForFunction(() => document.getElementById('results-count').textContent.includes('顯示'));
      await page.waitForTimeout(200);
      const wide = await read(page);
      assert.equal(wide.batchHidden, false, `${name}: a 300+ result query offers the next batch`);

      // Narrowing to a handful of matches must not leave a negative remainder.
      await setQuery(page, '員工排班');
      await page.waitForTimeout(250);
      const narrow = await read(page);
      assert.equal(narrow.batchHidden, true, `${name}: no batch control when every match fits`);
      assert.doesNotMatch(narrow.batchText, /-\d/, `${name}: hidden batch text must not count negative cases: ${narrow.batchText}`);

      // A filter that removes only non-drawable entries keeps the deck but changes
      // the total printed beside it; the line has to follow the new count.
      await setQuery(page, '會議');
      await page.waitForTimeout(250);
      const beforeKind = await read(page);
      await page.evaluate(() => {
        const kind = document.getElementById('kind');
        kind.value = 'case';
        kind.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(300);
      const afterKind = await read(page);
      const kindResults = Number((afterKind.resultsCount.match(/顯示\s*(\d+)/) || [])[1]);
      const kindDrawable = Number((afterKind.drawStatus.match(/(\d+)\s*張可抽案例卡/) || [])[1]);
      const kindExplained = Number((afterKind.drawStatus.match(/另有\s*(\d+)\s*筆不是可抽案例/) || [])[1] || 0);
      assert.equal(kindDrawable + kindExplained, kindResults,
        `${name}: after the 收錄狀態 filter the printed totals must add up (${beforeKind.resultsCount} -> ${afterKind.resultsCount})`);
      await page.evaluate(() => {
        const kind = document.getElementById('kind');
        kind.value = '';
        kind.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(200);

      // An empty draw pool prints its own count; that branch used to keep the
      // previous condition's number because the empty deck key never changes.
      await page.evaluate(() => {
        const proof = document.getElementById('proof');
        proof.value = '模板／文件核讀';
        proof.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await setQuery(page, '摘要');
      await page.waitForTimeout(300);
      const emptyOne = await read(page);
      await setQuery(page, '會議');
      await page.waitForTimeout(300);
      const emptyTwo = await read(page);
      assert.match(emptyTwo.resultsCount, /顯示 0 /, `${name}: the second condition has no result: ${emptyTwo.resultsCount}`);
      assert.doesNotMatch(emptyTwo.drawStatus, /符合的 \d+ 筆/,
        `${name}: an empty pool must not keep the previous condition's count: ${emptyTwo.drawStatus}`);
      assert.match(emptyTwo.drawStatus, /目前沒有可抽的案例卡/, `${name}: the empty pool says so: ${emptyTwo.drawStatus}`);
      assert.ok(emptyOne.resultsCount.length > 0, `${name}: the first condition loaded: ${emptyOne.resultsCount}`);
      await page.evaluate(() => {
        const proof = document.getElementById('proof');
        proof.value = '';
        proof.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(200);

      // Both totals describe the same condition, and the panel says which it counts.
      const resultsTotal = Number((narrow.resultsCount.match(/顯示\s*(\d+)/) || [])[1]);
      const drawable = Number((narrow.drawStatus.match(/(\d+)\s*張可抽案例卡/) || [])[1]);
      assert.ok(Number.isFinite(resultsTotal) && resultsTotal > 0, `${name}: results count is readable: ${narrow.resultsCount}`);
      assert.ok(Number.isFinite(drawable), `${name}: the sample panel names the drawable pool: ${narrow.drawStatus}`);
      const explained = (narrow.drawStatus.match(/另有\s*(\d+)\s*筆不是可抽案例/) || [])[1];
      assert.equal(drawable + Number(explained || 0), resultsTotal,
        `${name}: drawable ${drawable} + explained ${explained || 0} must equal results ${resultsTotal}`);
      assert.doesNotMatch(narrow.drawStatus, /張案例卡/, `${name}: the pool is not called "case cards" without "可抽": ${narrow.drawStatus}`);

      // A compound query whose words never share one case's title/purpose says so.
      await setQuery(page, '播客摘要');
      await page.waitForTimeout(250);
      const gap = await read(page);
      assert.equal(gap.gapHidden, false, `${name}: 播客摘要 has no case whose title/purpose holds both words`);
      assert.match(gap.gapText, /「播客」「摘要」/, `${name}: the notice names both words: ${gap.gapText}`);
      assert.match(gap.gapText, /字面命中/, `${name}: the notice says the hits are literal: ${gap.gapText}`);
      assert.equal(await page.locator('#results .card').count() > 0, true, `${name}: the literal matches stay listed`);

      // The offered word must be real: clicking it has to show the promised count.
      const action = await page.locator('#purpose-gap-scope').innerText();
      const promised = Number((action.match(/→\s*(\d+)\s*筆/) || [])[1]);
      assert.ok(Number.isFinite(promised) && promised > 0, `${name}: the notice offers a reachable single word: ${action}`);
      await page.locator('#purpose-gap-scope').click();
      await page.waitForTimeout(250);
      const retargeted = await read(page);
      const shown = Number((retargeted.resultsCount.match(/顯示\s*(\d+)/) || [])[1]);
      assert.equal(shown, promised, `${name}: the promised ${promised} must be the count on screen: ${retargeted.resultsCount}`);
      assert.equal(retargeted.gapHidden, true, `${name}: a single backed word needs no notice`);
      assert.equal(await page.locator('#query').inputValue(), (action.match(/改搜「(.+?)」/) || [])[1], `${name}: the field shows the word that was searched`);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      assert.equal(overflow, false, `${name}: no horizontal overflow in the notice state`);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.equal(axe.violations.length, 0, `${name}: axe ${JSON.stringify(axe.violations.map(v => v.id))}`);
      await page.screenshot({ path: `qa-artifacts/result-count-honesty-${name}.jpg`, type: 'jpeg', quality: 70 });

      // A query that does have a direct purpose match must not show the notice.
      await page.evaluate(() => {
        const scope = document.getElementById('search-scope');
        scope.value = '';
        scope.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await setQuery(page, '會議');
      await page.waitForTimeout(250);
      const direct = await read(page);
      assert.equal(direct.gapHidden, true, `${name}: 會議 keeps a direct title/purpose match, so no notice`);

      assert.deepEqual(errors, [], `${name}: no page errors`);
      report.push({ name, wide: wide.resultsCount, narrow: narrow.resultsCount, drawable, explained, gap: gap.gapText });
      console.log(name, JSON.stringify(report[report.length - 1]));
      await context.close();
    }
    console.log(JSON.stringify(report, null, 1));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
