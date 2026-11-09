'use strict';
// A first-time visitor types a question in their own words ("想學英文") and the
// strict match is empty, because the search ANDs every word and the corpus never
// says "想". The library does answer it under "學英文" (32 cases). This checks the
// empty state now offers that step, quoting the visitor's own characters, with the
// count it will really show — and that a question which already matches is
// untouched.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { ensureFiltersVisible } = require('./filter-controls.cjs');

const question = '想學英文';
const proxied = '沒時間學英文';
const matched = '我想用 AI 幫我寫社群貼文';
const PARTICLE = /^[的了嗎呢吧啊但而就都也又還很太不沒有是在和與或及把被讓給對從到想要會能可我你他她它們這那個些什怎樣為一]|[的了嗎呢吧啊但而就都也又還很太不沒有是在和與或依把被讓給對從到想要會能可我你他她它們這那個些什怎樣為一]$/;

(async () => {
  const browser = await chromium.launch();
  const report = [];
  try {
    const origin = process.env.ROUND_URL || 'http://127.0.0.1:8181/ai-agent-use-cases/';
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['small', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.locator('#results .card').first().waitFor();

      const settle = () => page.waitForFunction(() => /顯示 \d+ \/ \d+/.test(document.getElementById('results-count')?.textContent || ''));

      // The question has no literal match, so the empty state has to carry the answer.
      await page.locator('#query').fill(question);
      await settle();
      assert.match(await page.locator('#results-count').innerText(), /顯示 0 \//, name + ': the whole question still finds nothing');
      assert.equal(await page.locator('#empty').isVisible(), true, name + ': empty state is visible');

      const derived = page.locator('#empty-suggestions button[data-query-recovery]');
      const labels = await derived.allInnerTexts();
      assert(labels.length > 0, name + ': the visitor\'s own words produce a next step');
      const quoted = labels[0].match(/原問題包含「(.+?)」 → 搜尋 (\d+) 筆/);
      assert(quoted, name + ': the suggestion quotes the visitor: ' + labels[0]);
      assert(question.includes(quoted[1]), name + ': the quoted run is literally what they typed');
      assert(!PARTICLE.test(quoted[1]), name + ': the quoted run is a word, not a particle-bounded fragment');
      assert(Number(quoted[2]) > 0, name + ': a next step with no results is never offered');

      // The promise in the label is the number the click actually shows.
      await derived.first().click();
      await settle();
      const shown = Number((await page.locator('#results-count').innerText()).match(/顯示 (\d+)/)[1]);
      assert.equal(shown, Number(quoted[2]), name + ': the promised count is the real count');
      assert.equal(await page.locator('#query').inputValue(), quoted[1], name + ': the query becomes the quoted run');
      assert.equal(await page.locator('#empty').isVisible(), false, name + ': the dead end is gone');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'results-count', name + ': focus moves to the result summary');

      // Going back restores the question that failed, not a silent rewrite.
      await page.goBack();
      await page.waitForFunction(() => document.getElementById('query')?.value === '想學英文');
      await settle();
      assert.match(await page.locator('#results-count').innerText(), /顯示 0 \//, name + ': Back restores the original question');

      // A longer sentence with the same run gets the same step.
      await page.locator('#query').fill(proxied);
      await settle();
      const proxiedLabels = await page.locator('#empty-suggestions button[data-query-recovery]').allInnerTexts();
      assert(proxiedLabels.some(label => label.includes('「學英文」')), name + ': the run inside a longer sentence is found');

      // The site-wide task list is still there, behind the derived step.
      assert(await page.locator('#empty-suggestions .recovery-problem-tag').count() > 0, name + ': the task directory is still offered');
      const order = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('#empty-suggestions button')];
        return buttons.findIndex(button => button.dataset.queryRecovery) < buttons.findIndex(button => button.classList.contains('recovery-problem-tag'));
      });
      assert.equal(order, true, name + ': the visitor\'s own words come before the shared directory');

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(overflow <= 0, name + ': no horizontal overflow (' + overflow + ')');

      // Keyboard: the new control is reachable and operable.
      await page.locator('#empty-suggestions button[data-query-recovery]').first().focus();
      assert.equal(await page.locator('#empty-suggestions button[data-query-recovery]').first().evaluate(node => document.activeElement === node), true, name + ': the recovery step is focusable');
      await page.keyboard.press('Enter');
      await settle();
      assert.match(await page.locator('#results-count').innerText(), new RegExp('顯示 ' + quoted[2] + ' /'));

      // When a builder that already reads the question's own vocabulary has
      // something to say, the character-level reader stays out of the way.
      await page.locator('#query').fill(question);
      await settle();
      await ensureFiltersVisible(page);
      await page.locator('#scenario').selectOption('工作');
      await settle();
      const derivedNow = await page.locator('#empty-suggestions button[data-query-recovery]').allInnerTexts();
      assert(derivedNow.length > 0, name + ': the narrowed question still gets a next step');
      assert.deepEqual(derivedNow.filter(label => label.includes('文字命中')), [],
        name + ': the character-level reader defers to the vocabulary one: ' + derivedNow.join(' ‖ '));
      await page.locator('#scenario').selectOption('');
      await settle();

      // A question that already matches is untouched: no empty state, no rewrite.
      await page.locator('#query').fill(matched);
      await settle();
      assert.equal(await page.locator('#empty').isVisible(), false, name + ': a matching question shows results');
      assert.equal(await page.locator('#query').inputValue(), matched, name + ': the query is never rewritten without a click');

      // Accessibility of the state that changed.
      await page.locator('#query').fill(question);
      await settle();
      const axe = await new AxeBuilder({ page }).include('#explore').analyze();
      assert.equal(axe.violations.length, 0, name + ': axe found ' + axe.violations.map(v => v.id).join(','));

      assert.deepEqual(errors, [], name + ': no page errors');
      report.push({ viewport: name, quoted: quoted[1], promised: Number(quoted[2]), taskChips: await page.locator('#empty-suggestions .recovery-problem-tag').count(), axeViolations: axe.violations.length });
      await context.close();
    }
    console.log('Substring recovery QA passed: ' + report.map(entry => entry.viewport + ' ' + entry.quoted + '=' + entry.promised + ' axe=' + entry.axeViolations).join(' | '));
    if (process.env.QA_OUT) {
      require('node:fs').mkdirSync(process.env.QA_OUT, { recursive: true });
      require('node:fs').writeFileSync(process.env.QA_OUT + '/report.json', JSON.stringify({ origin, report }, null, 2));
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
