'use strict';
// A visitor's everyday phrase ("客戶抱怨", "合約到期提醒") is one CJK token and
// matches nothing verbatim. The page may then read it as adjacent library terms,
// but only with a visible explanation, a way back to the exact phrase, and no
// change to any query that already has results.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { ensureFiltersVisible } = require('./filter-controls.cjs');

const phrase = '客戶抱怨';
const expected = /「客戶」＋「抱怨」/;

(async () => {
  const browser = await chromium.launch();
  const report = [];
  try {
    const origin = process.env.ROUND_URL || 'http://127.0.0.1:8171/ai-agent-use-cases/';
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['small', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.locator('#results .card').first().waitFor();

      // The exact phrase still has no literal match; the split explains itself.
      await page.locator('#query').fill(phrase);
      await page.waitForFunction(() => /顯示 \d+ \/ \d+/.test(document.getElementById('results-count')?.textContent || ''));
      const note = page.locator('#search-split');
      assert.equal(await note.isVisible(), true, name + ': split note is visible');
      assert.match(await page.locator('#search-split-message').innerText(), expected);
      assert.match(await page.locator('#search-split-message').innerText(), /字面拆詞，不是語意理解/);
      const count = await page.locator('#results-count').innerText();
      const shown = Number(count.match(/顯示 (\d+)/)[1]);
      assert(shown > 0 && shown < 200, name + ': split narrows instead of matching everything: ' + count);
      assert.equal(await page.locator('#empty').isVisible(), false, name + ': no empty state while results exist');
      assert.equal(await page.locator('#search-split-exact').innerText(), '只找完整句子');

      // No horizontal overflow from the long note on narrow screens.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(overflow <= 0, name + ': no horizontal overflow (' + overflow + ')');

      // Keyboard: the toggle is reachable and focus lands on the result summary.
      await page.locator('#search-split-exact').focus();
      assert.equal(await page.locator('#search-split-exact').evaluate(node => document.activeElement === node), true);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.getElementById('empty')?.hidden === false || /顯示 0 /.test(document.getElementById('results-count')?.textContent || ''));
      assert.equal(await page.locator('#empty').isVisible(), true, name + ': exact-only shows the empty state');
      const exactOnlyCount = await page.locator('#results-count').innerText();
      assert.match(exactOnlyCount, /顯示 0 \//, name + ': exact-only keeps the honest zero');
      assert.match(await page.locator('#search-split-message').innerText(), /目前只找完整包含/);
      assert.equal(await page.locator('#search-split-exact').innerText(), '改用拆詞結果');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'results-count', name + ': focus moves to the result summary');

      // Back to the expanded result set without retyping.
      await page.locator('#search-split-exact').click();
      await page.waitForFunction(() => document.getElementById('empty')?.hidden === true);
      assert.match(await page.locator('#results-count').innerText(), /顯示 (\d+) \/ /);

      // Escape the split by editing the phrase: the new query decides for itself.
      await page.locator('#query').fill('員工請假');
      await page.waitForFunction(() => /顯示 0 /.test(document.getElementById('results-count')?.textContent || ''));
      assert.equal(await page.locator('#search-split').isVisible(), false, name + ': no invented match without full coverage');
      assert.equal(await page.locator('#empty').isVisible(), true);

      // A query that already had results keeps them, unsplit.
      await page.locator('#query').fill('客服');
      await page.waitForFunction(() => /顯示 \d+ \/ \d+/.test(document.getElementById('results-count')?.textContent || ''));
      assert.equal(await page.locator('#search-split').isVisible(), false, name + ': existing results are never split');
      const baseline = await page.locator('#results-count').innerText();

      // A facet the visitor chose is never silently re-read as a wording problem:
      // the empty state names the facet to remove instead.
      await page.locator('#query').fill('代碼審查');
      await page.waitForFunction(() => /顯示 \d+ \/ /.test(document.getElementById('results-count')?.textContent || ''));
      await ensureFiltersVisible(page);
      await page.locator('#scenario').selectOption('生活');
      await page.locator('#difficulty').selectOption('入門對話');
      await page.waitForFunction(() => document.getElementById('empty')?.hidden === false);
      assert.equal(await page.locator('#search-split').isVisible(), false, name + ': filtered empty keeps the facet explanation');
      assert.ok(await page.locator('#empty-suggestions .recovery-option').first().isVisible(), name + ': facet removal stays offered');
      await page.locator('#scenario').selectOption('');
      await page.locator('#difficulty').selectOption('');
      await page.waitForFunction(() => document.getElementById('search-split')?.hidden === true && /顯示 \d+ \/ /.test(document.getElementById('results-count')?.textContent || ''));

      // The phrase itself stays in the URL, so a shared link reproduces the note.
      await page.locator('#query').fill(phrase);
      await page.waitForFunction(() => document.getElementById('search-split')?.hidden === false);
      assert.equal(new URL(page.url()).searchParams.get('q'), phrase, name + ': URL keeps the typed phrase');
      const withFacet = shown;

      // A shared link reproduces the same explained state after reload.
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#results .card').first().waitFor();
      assert.equal(await page.locator('#search-split').isVisible(), true);
      assert.match(await page.locator('#search-split-message').innerText(), expected);

      // Detail from a split result set: the reading view is the case, not a stub.
      await page.locator('#results .card h3 button').first().click();
      await page.locator('#detail[open]').waitFor();
      assert.match(await page.locator('#detail-body').innerText(), /作者|官方|公開|尚待查證/);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#search-split').isVisible(), true);

      await ensureFiltersVisible(page);
      await page.locator('#scenario').selectOption('');
      await page.locator('#search-split-exact').click();
      await page.waitForFunction(() => document.getElementById('empty')?.hidden === false);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      assert.equal(axe.violations.length, 0, name + ': axe findings ' + JSON.stringify(axe.violations.map(v => [v.id, v.nodes.length])));
      assert.deepEqual(errors, [], name + ': no page errors');
      report.push({ viewport: name, width, splitCount: shown, withFacet, exactOnlyCount, axeViolations: 0, baseline });
      await context.close();
    }
    console.log('Compound split QA passed: ' + report.map(entry => entry.viewport + ' ' + entry.splitCount + '/' + entry.withFacet + ' axe=' + entry.axeViolations).join(' | '));
    if (process.env.QA_OUT) {
      require('node:fs').mkdirSync(process.env.QA_OUT, { recursive: true });
      require('node:fs').writeFileSync(process.env.QA_OUT + '/report.json', JSON.stringify({ origin, report }, null, 2));
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
