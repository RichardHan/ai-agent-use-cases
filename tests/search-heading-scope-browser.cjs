'use strict';
// A full-text match can be nothing but the section label every case page carries
// (`## 所需連接、權限與限制` is on 216 of 515 pages). The results line used to call all
// of that "body text", and the card quoted the label back as if it were prose. This
// check pins the three claims the screen now makes: the split names the label-only
// part, the card says 章節標題 and shows the section's own opening, and 命中範圍 can
// drop the labels without hiding the cases that do discuss the word.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {AxeBuilder} = require('@axe-core/playwright');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8123/ai-agent-use-cases/';

const setQuery = (page, value) => page.evaluate(query => {
  const input = document.getElementById('query');
  input.value = query;
  input.dispatchEvent(new Event('input', {bubbles: true}));
}, value);

const read = page => page.evaluate(() => {
  const note = document.getElementById('match-scope');
  const count = document.getElementById('results-count').textContent.trim();
  const message = note.hidden ? '' : document.getElementById('match-scope-message').textContent.trim();
  const numbers = message.match(/這\s*(\d+)\s*筆裡，(\d+)\s*筆/);
  const rest = message.match(/其餘\s*(\d+)\s*筆/);
  const bodySplit = message.match(/(\d+)\s*筆在正文或頁首資料提到；另有\s*(\d+)\s*筆要算上章節標題才符合/);
  return {
    count,
    total: Number((count.match(/顯示\s*(\d+)/) || [])[1]),
    noteHidden: note.hidden,
    mode: note.dataset.mode || '',
    message,
    stated: numbers ? Number(numbers[2]) : null,
    rest: rest ? Number(rest[1]) : null,
    bodyCount: bodySplit ? Number(bodySplit[1]) : null,
    headingCount: bodySplit ? Number(bodySplit[2]) : null,
    headingLabelNamed: /要算上章節標題才符合（例如〈[^〉]+〉）/.test(message),
    empty: !document.getElementById('empty').hidden,
    recovery: [...document.querySelectorAll('#empty-suggestions button')].map(button => button.textContent.trim()).slice(0, 3),
    scope: document.getElementById('search-scope').value,
    chips: [...document.querySelectorAll('#active-filters button')].map(button => button.textContent.trim()),
    url: location.href,
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
});

const cardSamples = (page, limit = 24) => page.evaluate(limit => [...document.querySelectorAll('#results .card')]
  .slice(0, limit)
  .map(card => ({
    id: card.dataset.caseId,
    title: (card.querySelector('h3')?.innerText || '').trim(),
    labels: [...card.querySelectorAll('.search-context-label')].map(node => node.innerText.trim()),
    excerpts: [...card.querySelectorAll('.search-context-excerpt')].map(node => node.innerText.trim()),
    cautions: [...card.querySelectorAll('.search-context-caution')].map(node => node.innerText.trim()),
  })), limit);

const selectScope = (page, value) => page.evaluate(scope => {
  const select = document.getElementById('search-scope');
  select.value = scope;
  select.dispatchEvent(new Event('change', {bubbles: true}));
}, value);

(async () => {
  const browser = await chromium.launch();
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844], ['small', 320, 740]]) {
      const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(origin, {waitUntil: 'networkidle'});
      await page.locator('#results .card').first().waitFor({timeout: 60000});

      // 1. A shared template label is disclosed as a label, with real numbers that add up.
      await setQuery(page, '提示詞');
      await page.waitForTimeout(400);
      const prompt = await read(page);
      assert.equal(prompt.noteHidden, false, `${name}: a label-heavy tail is disclosed: ${prompt.count}`);
      assert.notEqual(prompt.headingCount, null, `${name}: the split names the label-only part: ${prompt.message}`);
      assert.ok(prompt.headingCount > 0, `${name}: 提示詞 has label-only matches: ${prompt.headingCount}`);
      assert.equal(prompt.stated + prompt.rest, prompt.total, `${name}: the two halves add up to the count (${prompt.stated} + ${prompt.rest} vs ${prompt.total})`);
      assert.equal(prompt.bodyCount + prompt.headingCount, prompt.rest,
        `${name}: the body/label split explains the whole tail (${prompt.bodyCount} + ${prompt.headingCount} vs ${prompt.rest})`);
      assert.equal(prompt.headingLabelNamed, true, `${name}: the label is named, not described in the abstract: ${prompt.message}`);
      assert.equal(prompt.overflow, 0, `${name}: the notice does not overflow horizontally`);

      // 2. Ranking puts the cases that describe themselves first, so this page is
      // mostly prose; step 5 checks the label-only cards on a phrase they dominate.
      // What must hold here is that no prose hit is dressed up as a section label.
      const samples = await cardSamples(page);
      const labelled = samples.filter(sample => sample.labels.some(label => label.startsWith('章節標題')));
      for (const sample of labelled) {
        assert.match(sample.labels.find(label => label.startsWith('章節標題')), /「提示詞」.*章節標題「[^」]+」/,
          `${name}/${sample.id}: the label names the section: ${sample.labels.join(' / ')}`);
        assert.ok(sample.cautions.some(text => /只出現在章節標題/.test(text)), `${name}/${sample.id}: the card discloses the label hit`);
        for (const excerpt of sample.excerpts) {
          assert.doesNotMatch(excerpt, /^可複製提示詞/, `${name}/${sample.id}: the heading is not quoted as the case's own sentence: ${excerpt}`);
        }
      }

      // 3. 命中範圍 can drop the labels, and the promise is the number it printed.
      const promisedBody = prompt.stated + prompt.bodyCount;
      await selectScope(page, 'body');
      await page.waitForTimeout(350);
      const bodyOnly = await read(page);
      assert.equal(bodyOnly.total, promisedBody, `${name}: the body scope shows the ${promisedBody} cases the sentence counted: ${bodyOnly.count}`);
      assert.equal(bodyOnly.scope, 'body', `${name}: the scope control keeps the choice`);
      assert.match(bodyOnly.url, /scope=body/, `${name}: the shared URL carries the scope: ${bodyOnly.url}`);
      assert.ok(bodyOnly.chips.some(chip => chip.includes('命中範圍')), `${name}: the scope is a removable condition: ${bodyOnly.chips.join(' / ')}`);
      assert.doesNotMatch(bodyOnly.message, /要算上章節標題才符合/, `${name}: a body-scoped count has no heading tail left to disclose: ${bodyOnly.message}`);
      assert.equal(bodyOnly.overflow, 0, `${name}: narrowed results do not overflow`);
      const stillLabelled = await cardSamples(page);
      assert.equal(stillLabelled.some(sample => sample.labels.some(label => label.startsWith('章節標題'))), false,
        `${name}: no visible card is explained by a section label after narrowing`);
      const axe = await new AxeBuilder({page}).analyze();
      assert.equal(axe.violations.length, 0, `${name}: axe violations: ${axe.violations.map(v => v.id).join(', ')}`);

      // 4. Reload and Back keep the narrowed condition.
      await page.reload({waitUntil: 'networkidle'});
      await page.locator('#results .card').first().waitFor({timeout: 60000});
      const reloaded = await read(page);
      assert.equal(reloaded.total, promisedBody, `${name}: a reload of a shared scope URL keeps ${promisedBody}: ${reloaded.count}`);
      assert.equal(reloaded.scope, 'body', `${name}: the reloaded control shows 正文`);

      // 5. A phrase that only exists as a label must say so instead of implying prose.
      await page.goto(new URL('?q=所需連接#explore', origin).href, {waitUntil: 'networkidle'});
      await page.locator('#results .card').first().waitFor({timeout: 60000});
      await page.waitForTimeout(300);
      const labelOnly = await read(page);
      assert.equal(labelOnly.noteHidden, false, `${name}: the label-only phrase is explained: ${labelOnly.message}`);
      assert.match(labelOnly.message, /都要算上章節標題才符合（例如〈所需連接、權限與限制〉）/,
        `${name}: the sentence names the template section: ${labelOnly.message}`);
      assert.equal(labelOnly.overflow, 0, `${name}: the label-only notice fits the viewport`);
      const labelCards = await cardSamples(page, 4);
      assert.ok(labelCards.every(sample => sample.labels.every(label => label.includes('章節標題'))),
        `${name}: every visible hit for this phrase is a section label: ${JSON.stringify(labelCards.map(sample => sample.labels))}`);

      // 6. Narrowing a phrase no prose carries lands on a recoverable empty state.
      await selectScope(page, 'body');
      await page.waitForTimeout(350);
      const none = await read(page);
      assert.equal(none.total, 0, `${name}: no case prose uses this phrase: ${none.count}`);
      assert.equal(none.empty, true, `${name}: the empty state explains the zero`);
      assert.ok(none.recovery.length > 0, `${name}: the empty state offers a way back: ${none.recovery.join(' / ')}`);

      // 6b. A multi-word query is split per case, and the sentence says so: one word
      // can be in the prose while another only appears in a section label.
      await page.goto(new URL('?q=AI%20權限#explore', origin).href, {waitUntil: 'networkidle'});
      await page.locator('#results .card').first().waitFor({timeout: 60000});
      await page.waitForTimeout(350);
      const compound = await read(page);
      assert.equal(compound.noteHidden, false, `${name}: the compound tail is disclosed: ${compound.message}`);
      assert.match(compound.message, /要算上章節標題才符合/, `${name}: a per-case split must not claim every word is a label: ${compound.message}`);
      assert.doesNotMatch(compound.message, /只在章節標題/, `${name}: the older absolute wording is gone: ${compound.message}`);
      assert.equal(compound.stated + compound.rest, compound.total, `${name}: compound halves add up (${compound.stated} + ${compound.rest} vs ${compound.total})`);
      assert.equal(compound.bodyCount + compound.headingCount, compound.rest, `${name}: compound tail split adds up`);
      await selectScope(page, 'body');
      await page.waitForTimeout(300);
      const compoundBody = await read(page);
      assert.equal(compoundBody.total, compound.stated + compound.bodyCount,
        `${name}: the body scope shows every case that never needs a heading (${compoundBody.total} vs ${compound.stated + compound.bodyCount})`);

      // 7. A query the corpus answers directly keeps the quiet screen.
      await selectScope(page, '');
      await setQuery(page, '會議');
      await page.waitForTimeout(400);
      const direct = await read(page);
      assert.equal(direct.noteHidden, true, `${name}: 會議 is answered by title/purpose, so no notice: ${direct.message}`);
      assert.equal(errors.length, 0, `${name}: page errors: ${errors.join(' | ')}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log('PASS search heading provenance and body scope across 1440/390/320');
})();
