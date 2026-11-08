'use strict';
// A first-time visitor asks in a full sentence ("怎麼讓 AI 幫我檢查合約有沒有
// 問題") and used to land on 0 results. The page may now re-read that sentence
// with the library's own words, but only with a visible explanation, a way back
// to the whole sentence, and no effect on a query that already matches.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { ensureFiltersVisible } = require('./filter-controls.cjs');

const sentence = '怎麼讓 AI 幫我檢查合約有沒有問題';
const pairSentence = '我想把家裡的帳單自動記帳';

(async () => {
  const browser = await chromium.launch();
  const report = [];
  try {
    const origin = process.env.ROUND_URL || 'http://127.0.0.1:8172/ai-agent-use-cases/';
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['small', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.locator('#results .card').first().waitFor();

      // The sentence has no literal match; the re-read explains itself.
      await page.locator('#query').fill(sentence);
      await page.waitForFunction(() => /顯示 \d+ \/ \d+/.test(document.getElementById('results-count')?.textContent || ''));
      const note = page.locator('#search-split');
      assert.equal(await note.isVisible(), true, name + ': sentence note is visible');
      const message = await page.locator('#search-split-message').innerText();
      assert.match(message, /句中包含站上既有的詞「合約」/, name + ': the chosen word is named');
      assert.match(message, /這是字面比對，不是語意理解/);
      const countText = await page.locator('#results-count').innerText();
      const shown = Number(countText.match(/顯示 (\d+)/)[1]);
      const claimed = Number(message.match(/顯示 (\d+) 筆/)[1]);
      assert.equal(claimed, shown, name + ': the note count equals the displayed count');
      assert(shown > 0 && shown < 170, name + ': the answer narrows instead of matching everything: ' + countText);
      assert.equal(await page.locator('#empty').isVisible(), false, name + ': no empty state while results exist');
      assert.equal(await page.locator('#search-split-exact').innerText(), '只找完整句子');

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(overflow <= 0, name + ': no horizontal overflow (' + overflow + ')');

      // Keyboard: the way back is reachable, and focus lands on the result summary.
      await page.locator('#search-split-exact').focus();
      assert.equal(await page.locator('#search-split-exact').evaluate(node => document.activeElement === node), true, name + ': toggle is focusable');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.getElementById('empty')?.hidden === false || /顯示 0 /.test(document.getElementById('results-count')?.textContent || ''));
      assert.match(await page.locator('#results-count').innerText(), /顯示 0 \//, name + ': whole-sentence search keeps the honest zero');
      assert.equal(await page.locator('#empty').isVisible(), true, name + ': empty state returns');
      assert.match(await page.locator('#search-split-message').innerText(), /目前只找完整包含整句的案例/);
      assert.equal(await page.locator('#search-split-exact').innerText(), '改用句中詞');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'results-count', name + ': focus moves to the result summary');

      // Back to the re-read results without retyping.
      await page.locator('#search-split-exact').click();
      await page.waitForFunction(() => document.getElementById('empty')?.hidden === true);
      assert.match(await page.locator('#results-count').innerText(), new RegExp('顯示 ' + shown + ' / '));

      // Editing after the toggle resets the choice for the new question.
      await page.locator('#search-split-exact').click();
      await page.waitForFunction(() => document.getElementById('search-split')?.dataset.mode === 'suppressed');
      await page.locator('#query').fill('有沒有辦法讓 AI 幫我整理文獻回顧');
      await page.waitForFunction(() => document.getElementById('search-split')?.dataset.mode === 'expanded', null, { timeout: 5000 });
      assert.match(await page.locator('#search-split-message').innerText(), /整句沒有直接命中案例/, name + ': a new question is read fresh, not suppressed');
      assert.equal(await page.locator('#search-split-exact').innerText(), '只找完整句子');

      // Two library words form a narrower answer and are both named.
      await page.locator('#query').fill(pairSentence);
      await page.waitForFunction(() => /顯示 \d+ \/ / .test(document.getElementById('results-count')?.textContent || ''));
      const pairMessage = await page.locator('#search-split-message').innerText();
      assert.match(pairMessage, /「記帳」＋「帳單」|「帳單」＋「記帳」/, name + ': both words are named');
      assert.match(pairMessage, /這些詞同時符合/);
      const pairCount = Number((await page.locator('#results-count').innerText()).match(/顯示 (\d+)/)[1]);
      assert.equal(Number(pairMessage.match(/顯示 (\d+) 筆/)[1]), pairCount, name + ': pair note count matches the page');

      // A query that already matches keeps its results, unexplained.
      await page.locator('#query').fill('我想用 AI 幫我寫社群貼文');
      await page.waitForFunction(() => /顯示 \d+ \/ /.test(document.getElementById('results-count')?.textContent || ''));
      assert.equal(await page.locator('#search-split').isVisible(), false, name + ': an existing match is never re-read');
      const directCount = await page.locator('#results-count').innerText();

      // A facet the visitor chose is their own narrowing: the empty state names it.
      await page.locator('#query').fill(pairSentence);
      await page.waitForFunction(() => document.getElementById('search-split')?.hidden === false);
      await ensureFiltersVisible(page);
      await page.locator('#scenario').selectOption('學習');
      await page.waitForFunction(() => document.getElementById('empty')?.hidden === false);
      assert.equal(await page.locator('#search-split').isVisible(), false, name + ': filtered empty keeps the facet explanation');
      assert.ok(await page.locator('#empty-suggestions .recovery-option').first().isVisible(), name + ': facet removal stays offered');
      await page.locator('#scenario').selectOption('');
      await page.waitForFunction(() => document.getElementById('search-split')?.hidden === false);

      // The typed sentence stays in the URL, so a shared link reproduces the state.
      assert.equal(new URL(page.url()).searchParams.get('q'), pairSentence, name + ': URL keeps the typed sentence');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#results .card').first().waitFor();
      assert.equal(await page.locator('#search-split').isVisible(), true, name + ': reload reproduces the explained state');
      assert.match(await page.locator('#query').inputValue(), /帳單/);

      // Reading a result from the re-read set, then returning to the same set.
      await page.locator('#results .card h3 button').first().click();
      await page.locator('#detail[open]').waitFor();
      assert.match(await page.locator('#detail-body').innerText(), /作者|官方|公開|尚待查證/);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.getElementById('search-split')?.hidden === false);
      assert.equal(await page.locator('#detail[open]').isVisible(), false, name + ': Escape returns to the results');

      await page.locator('#search-split-exact').click();
      await page.waitForFunction(() => document.getElementById('empty')?.hidden === false);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      assert.equal(axe.violations.length, 0, name + ': axe findings ' + JSON.stringify(axe.violations.map(v => [v.id, v.nodes.length])));
      assert.deepEqual(errors, [], name + ': no page errors');
      report.push({ viewport: name, width, sentenceCount: shown, pairCount, directCount, claimed, axeViolations: 0 });
      await context.close();
    }
    console.log('Sentence fallback QA passed: ' + report.map(entry => entry.viewport + ' ' + entry.sentenceCount + '/' + entry.pairCount + ' axe=' + entry.axeViolations).join(' | '));
    if (process.env.QA_OUT) {
      require('node:fs').mkdirSync(process.env.QA_OUT, { recursive: true });
      require('node:fs').writeFileSync(process.env.QA_OUT + '/report.json', JSON.stringify({ origin, report }, null, 2));
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
