'use strict';
// Contract: when a full-sentence question finds nothing, the dead-end panel
// offers a word the visitor typed that the library can actually search — before
// (and instead of) asking them to delete that same word. The expected count is
// measured by running that word's own search in the same corpus, so nothing here
// hardcodes today's totals.
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8140/ai-agent-use-cases/';
const question = '想讓 AI 幫我盯機票價格';
const word = '機票';
const settled = page => page.waitForFunction(() => {
  const el = document.getElementById('results-count');
  return el && !/讀取|正在/.test(el.textContent);
}, null, { timeout: 120000 });
const countOf = page => page.evaluate(() => Number((document.getElementById('results-count').textContent.match(/顯示\s*(\d+)\s*\/\s*[\d,]+/) || [])[1]));
const recoverySteps = page => page.evaluate(() => [...document.querySelectorAll('#empty-suggestions [data-query-recovery]')].map(button => ({
  query: button.dataset.queryRecovery,
  text: button.innerText.replace(/\s+/g, ' ').trim()
})));

(async () => {
  const browser = await chromium.launch();
  const report = [];
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // What searching the word on its own really returns, measured here.
    await page.goto(origin + '?q=' + encodeURIComponent(word) + '#explore', { waitUntil: 'networkidle' });
    await settled(page);
    const wordCount = await countOf(page);
    assert.ok(wordCount > 0, `${name}: the word the visitor typed is searchable (${wordCount})`);

    await page.goto(origin + '?q=' + encodeURIComponent(question) + '#explore', { waitUntil: 'networkidle' });
    await settled(page);
    assert.equal(await countOf(page), 0, `${name}: the sentence itself still finds nothing`);
    assert.equal(await page.locator('#empty').isVisible(), true, `${name}: the panel is the dead end`);

    const steps = await recoverySteps(page);
    assert.ok(steps.length > 0, `${name}: the panel offers a next step`);
    assert.equal(new Set(steps.map(step => step.query)).size, steps.length, `${name}: one next step per resulting search`);
    const first = steps[0];
    assert.equal(first.query, word, `${name}: the visitor's own word comes first`);
    assert.match(first.text, new RegExp(`原問題包含「${word}」`), `${name}: the label quotes what they typed`);
    assert.match(first.text, new RegExp(`搜尋 ${wordCount} 筆`), `${name}: the count is the one its own search returns`);
    assert.equal(steps.filter(step => step.text.includes('只移除關鍵字「' + word + '」')).length, 0,
      `${name}: the key word is not offered as something to delete`);

    await page.screenshot({ path: `qa-artifacts/empty-word-recovery-${name}.jpg`, type: 'jpeg', quality: 75 });

    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(audit.violations.map(v => v.id), [], `${name}: no axe violations on the dead end`);

    await page.locator(`#empty-suggestions [data-query-recovery="${word}"]`).focus();
    await page.keyboard.press('Enter');
    await settled(page);
    assert.equal(await page.locator('#query').inputValue(), word, `${name}: the click replaces the query with the word`);
    assert.equal(await countOf(page), wordCount, `${name}: the promised count is the count shown`);
    assert.equal(await page.locator('#results-count').evaluate(node => document.activeElement === node), true,
      `${name}: focus lands on the result count`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}: no horizontal overflow`);

    await page.goBack();
    await settled(page);
    assert.equal(await page.locator('#query').inputValue(), question, `${name}: Back restores the question`);
    assert.equal(await page.locator('#empty').isVisible(), true, `${name}: and the dead end with it`);
    assert.deepEqual(errors, [], `${name}: no page errors`);

    report.push({ viewport: name, wordCount, steps: steps.slice(0, 4) });
    await context.close();
  }
  await browser.close();
  console.log('EMPTY_WORD_RECOVERY ' + JSON.stringify(report));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
