'use strict';
// A first-time visitor describes the task in their own words and the phrase is
// shorter than a sentence ("每月信用卡帳單整理", "找便宜的機票"). Those pages used
// to say 0 results even though the library covers 帳單, 機票 and 履歷; one filler
// character made the same question work. The re-read now starts at five
// characters, and it must still explain itself, keep the way back to the exact
// phrase, and never reinterpret a short keyword lookup.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const shortProse = '每月信用卡帳單整理';
const shortest = '整理履歷表';
const keywords = '照片 旅行';

(async () => {
  const browser = await chromium.launch();
  const report = [];
  try {
    const origin = process.env.ROUND_URL || 'http://127.0.0.1:8173/ai-agent-use-cases/';
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['small', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.locator('#results .card').first().waitFor();
      const notice = page.locator('#search-split');
      // A short wait turns a missing re-read into a readable failure instead of a
      // 30-second timeout, so the same script proves the defect on the old build.
      const reached = async mode => page.waitForFunction(
        expected => document.getElementById('search-split')?.dataset.mode === expected,
        mode, { timeout: 8000 }
      ).then(() => true, () => false);
      const count = async () => Number((await page.locator('#results-count').innerText()).match(/顯示 (\d+)/)[1]);

      // The 9-character task question: answered, explained, and counted honestly.
      await page.locator('#query').fill(shortProse);
      assert.equal(await reached('expanded'), true, name + ': a 9-character task question is re-read');
      assert.equal(await notice.isVisible(), true, name + ': the re-read is visible');
      const message = await page.locator('#search-split-message').innerText();
      assert.match(message, /「帳單」＋「整理」|「整理」＋「帳單」/, name + ': the words actually used are named');
      assert.match(message, /這是字面比對，不是語意理解/, name + ': the re-read says it is literal');
      const shown = await count();
      assert.equal(Number(message.match(/顯示 (\d+) 筆/)[1]), shown, name + ': the note count is the displayed count');
      assert(shown > 0 && shown < 170, name + ': the answer narrows instead of matching everything: ' + shown);
      assert.equal(await page.locator('#empty').isVisible(), false, name + ': no empty state while results exist');
      assert.equal(await page.locator('#search-split-exact').innerText(), '只找完整句子');
      assert.equal(new URL(page.url()).searchParams.get('q'), shortProse, name + ': the URL keeps what the visitor typed');

      // The way back states the honest zero and can be undone without retyping.
      await page.locator('#search-split-exact').click();
      await page.waitForFunction(() => document.getElementById('search-split')?.dataset.mode === 'suppressed');
      assert.match(await page.locator('#results-count').innerText(), /顯示 0 \//, name + ': the exact phrase keeps its honest zero');
      assert.equal(await page.locator('#empty').isVisible(), true, name + ': the empty state explains the exact search');
      await page.locator('#search-split-exact').click();
      await page.waitForFunction(() => document.getElementById('search-split')?.dataset.mode === 'expanded');
      assert.equal(await count(), shown, name + ': returning to the re-read restores the same results');

      // Five characters is the shortest prose boundary this round claims.
      await page.locator('#query').fill(shortest);
      assert.equal(await reached('expanded'), true, name + ': a 5-character task question is re-read');
      assert.match(await page.locator('#search-split-message').innerText(), /句中包含站上既有的詞「履歷」/, name + ': a 5-character task question is re-read too');
      assert((await count()) > 0, name + ': the 5-character re-read has results');

      // A short keyword lookup stays exact: no note, no substitution.
      await page.locator('#query').fill(keywords);
      await page.waitForFunction(() => /顯示 \d+ \/ /.test(document.getElementById('results-count')?.textContent || ''));
      assert.equal(await notice.isVisible(), false, name + ': two short keywords are never reinterpreted');
      const literal = await count();
      assert(literal > 0, name + ': the keyword lookup still finds its literal results');

      // A shared link reproduces the re-read, and reading a case returns to it.
      await page.locator('#query').fill(shortProse);
      assert.equal(await reached('expanded'), true, name + ': the re-read returns before reload');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#results .card').first().waitFor();
      assert.equal(await notice.isVisible(), true, name + ': reload reproduces the explained state');
      assert.equal(await count(), shown, name + ': reload keeps the same count');
      await page.locator('#results .card h3 button').first().click();
      await page.locator('#detail[open]').waitFor();
      assert.match(await page.locator('#detail-body').innerText(), /作者|官方|公開|尚待查證/);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.getElementById('search-split')?.dataset.mode === 'expanded');
      assert.equal(await page.locator('#detail[open]').isVisible(), false, name + ': Escape returns to the same re-read');

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(overflow <= 0, name + ': no horizontal overflow (' + overflow + ')');
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      assert.equal(axe.violations.length, 0, name + ': axe findings ' + JSON.stringify(axe.violations.map(v => [v.id, v.nodes.length])));
      await page.locator('#search-split-exact').click();
      await page.waitForFunction(() => document.getElementById('empty')?.hidden === false);
      const axeEmpty = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      assert.equal(axeEmpty.violations.length, 0, name + ': empty-state axe findings ' + JSON.stringify(axeEmpty.violations.map(v => [v.id, v.nodes.length])));
      assert.deepEqual(errors, [], name + ': no page errors');
      report.push({ viewport: name, width, shortProse: shown, shortest: shortest, keywords: literal, axeViolations: 0 });
      await context.close();
    }
    console.log('Short sentence QA passed: ' + report.map(entry => entry.viewport + ' ' + entry.shortProse + '/' + entry.keywords + ' axe=' + entry.axeViolations).join(' | '));
    if (process.env.QA_OUT) {
      require('node:fs').mkdirSync(process.env.QA_OUT, { recursive: true });
      require('node:fs').writeFileSync(process.env.QA_OUT + '/report.json', JSON.stringify({ origin, report }, null, 2));
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
