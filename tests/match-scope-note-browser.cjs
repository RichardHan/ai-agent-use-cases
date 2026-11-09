'use strict';
// The result line says "顯示 220 / 512 筆收錄", but a full-text search matches body
// text too: for 安全防護 only 24 of those 220 cases describe themselves with the
// words. The screen owed the reader that split and one click to the 24; before this
// check it printed the headline number alone and offered no way to narrow.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8123/ai-agent-use-cases/';

const setQuery = (page, value) => page.evaluate(query => {
  const input = document.getElementById('query');
  input.value = query;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}, value);

const read = page => page.evaluate(() => {
  const note = document.getElementById('match-scope');
  const action = document.getElementById('match-scope-action');
  const count = document.getElementById('results-count').textContent.trim();
  return {
    count,
    total: Number((count.match(/顯示\s*(\d+)/) || [])[1]),
    noteHidden: note?.hidden ?? null,
    noteMode: note?.dataset.mode ?? '',
    message: document.getElementById('match-scope-message')?.textContent.trim() ?? '',
    actionHidden: action?.hidden ?? null,
    actionText: action?.textContent.trim() ?? '',
    actionHeight: action ? Math.round(action.getBoundingClientRect().height) : 0,
    scope: document.getElementById('search-scope')?.value ?? '',
    url: location.href,
    chips: [...document.querySelectorAll('#active-filters button')].map(button => button.textContent.trim()),
    focus: document.activeElement?.id ?? ''
  };
});

const overflow = page => page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844], ['small', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.locator('#results .card').first().waitFor({ timeout: 60000 });

      // 1. A query whose matches are mostly body text has to say so.
      await setQuery(page, '安全防護');
      await page.waitForTimeout(300);
      const wide = await read(page);
      assert.equal(wide.noteHidden, false, `${name}: a body-only tail must be disclosed: ${wide.count}`);
      assert.equal(wide.noteMode, 'body', `${name}: the notice is in the body-tail mode: ${wide.noteMode}`);
      const promised = Number((wide.actionText.match(/(\d+)\s*筆/) || [])[1]);
      const stated = Number((wide.message.match(/這\s*(\d+)\s*筆裡，(\d+)\s*筆/) || [])[2]);
      const rest = Number((wide.message.match(/其餘\s*(\d+)\s*筆/) || [])[1]);
      assert.ok(Number.isFinite(stated) && stated > 0, `${name}: the notice names the cases that describe themselves with the words: ${wide.message}`);
      assert.equal(stated + rest, wide.total, `${name}: the two numbers must add up to the result count (${stated} + ${rest} vs ${wide.total})`);
      assert.equal(promised, stated, `${name}: the action promises the same count the sentence states: ${wide.actionText}`);
      assert.ok(promised < wide.total, `${name}: the narrower set is really narrower: ${promised} of ${wide.total}`);
      assert.equal(await overflow(page), false, `${name}: the notice must not overflow horizontally`);
      assert.ok(wide.actionHeight >= 44, `${name}: the action keeps a 44px touch target (${wide.actionHeight}px)`);
      // Arriving the way a visitor does (task link, then typing) is the geometry
      // that matters: the count, the split and its action have to be readable
      // without scrolling, and at desktop width the first card stays on screen.
      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.locator('#results .card').first().waitFor({ timeout: 60000 });
      await page.locator('.hero-search-link').click();
      await page.locator('#query').fill('安全防護');
      await page.waitForFunction(() => document.getElementById('results-count').textContent.includes('顯示'));
      await page.waitForTimeout(400);
      const geometry = await page.evaluate(() => ({
        noticeBottom: Math.round(document.getElementById('match-scope').getBoundingClientRect().bottom),
        cardTop: Math.round(document.querySelector('#results .card').getBoundingClientRect().top),
        vh: window.innerHeight
      }));
      // 320x740 has no room above the fold even before this change (the first card
      // already sat at 784px); the round's QA notes record that size separately.
      if (width >= 390) assert.ok(geometry.noticeBottom <= geometry.vh,
        `${name}: the notice and its action must be readable without scrolling (${geometry.noticeBottom} > ${geometry.vh})`);
      if (width >= 1440) assert.ok(geometry.cardTop < geometry.vh,
        `${name}: the first card stays on screen at desktop width (${geometry.cardTop} vs ${geometry.vh})`);

      // 2. One click narrows to exactly the promised count and carries the scope in the URL.
      await page.locator('#match-scope-action').click();
      await page.waitForTimeout(300);
      const narrowed = await read(page);
      assert.equal(narrowed.total, promised, `${name}: the promised ${promised} must be the count on screen: ${narrowed.count}`);
      assert.equal(narrowed.scope, 'overview', `${name}: the action switches to the title/purpose scope`);
      assert.match(narrowed.url, /scope=overview/, `${name}: the shared URL keeps the chosen scope: ${narrowed.url}`);
      assert.equal(narrowed.noteHidden, true, `${name}: no body-only tail is left to disclose`);
      assert.ok(narrowed.chips.some(chip => chip.includes('命中範圍')), `${name}: the applied scope is listed as a removable condition: ${narrowed.chips.join(' / ')}`);
      assert.equal(narrowed.focus, 'results-count', `${name}: focus moves to the result summary, not into a hidden notice`);
      assert.equal(await overflow(page), false, `${name}: narrowed results must not overflow horizontally`);

      // 3. Going back to full text restores the disclosure and the full count.
      await page.evaluate(() => {
        const scope = document.getElementById('search-scope');
        scope.value = '';
        scope.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(300);
      const restored = await read(page);
      assert.equal(restored.total, wide.total, `${name}: returning to full text restores ${wide.total}, got ${restored.total}`);
      assert.equal(restored.noteHidden, false, `${name}: the disclosure returns with the tail`);

      // 4. A query the corpus answers directly keeps a quiet screen.
      await setQuery(page, '會議');
      await page.waitForTimeout(300);
      const direct = await read(page);
      assert.equal(direct.noteHidden, true, `${name}: 會議 keeps half of its matches in title/purpose, so no notice: ${direct.message}`);
      assert.equal(direct.actionText, '', `${name}: a hidden notice must not keep the previous condition's promise: ${direct.actionText}`);

      // 5. No open query means no notice, even though the deck is large.
      await setQuery(page, '');
      await page.waitForTimeout(300);
      const blank = await read(page);
      assert.equal(blank.noteHidden, true, `${name}: an empty query never claims a body-only tail`);
      assert.equal(blank.actionText, '', `${name}: an empty query leaves no stale action label: ${blank.actionText}`);

      // 6. The split must stay true when a facet narrows the same query.
      await setQuery(page, '安全防護');
      await page.waitForTimeout(250);
      await page.evaluate(() => {
        const kind = document.getElementById('kind');
        kind.value = 'case';
        kind.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(300);
      const faceted = await read(page);
      if (faceted.noteMode === 'body') {
        const shownInFacet = Number((faceted.message.match(/這\s*(\d+)\s*筆裡，(\d+)\s*筆/) || [])[2]);
        const restInFacet = Number((faceted.message.match(/其餘\s*(\d+)\s*筆/) || [])[1]);
        assert.equal(shownInFacet + restInFacet, faceted.total, `${name}: the split follows the filtered condition (${shownInFacet} + ${restInFacet} vs ${faceted.total})`);
        await page.locator('#match-scope-action').click();
        await page.waitForTimeout(300);
        const narrowedFacet = await read(page);
        assert.equal(narrowedFacet.total, shownInFacet, `${name}: with a facet applied the promise still matches the screen (${narrowedFacet.total} vs ${shownInFacet})`);
        assert.ok(narrowedFacet.chips.some(chip => chip.includes('收錄狀態')), `${name}: the facet survives narrowing: ${narrowedFacet.chips.join(' / ')}`);
      }
      await page.evaluate(() => {
        const kind = document.getElementById('kind');
        kind.value = '';
        kind.dispatchEvent(new Event('change', { bubbles: true }));
        // The facet branch above may have narrowed the scope; the next step needs
        // the default full-text condition.
        const scope = document.getElementById('search-scope');
        scope.value = '';
        scope.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(200);

      // 7. The zero-purpose notice must not call a synonym hit a literal one.
      await setQuery(page, '播客摘要');
      await page.waitForTimeout(350);
      const noneMode = await read(page);
      assert.equal(noneMode.noteMode, 'none', `${name}: no case holds both words in title/purpose, so the older exit stays: ${noneMode.noteMode}`);
      assert.match(noneMode.message, /全文或同義詞命中/, `${name}: the notice names where the hits came from: ${noneMode.message}`);
      assert.doesNotMatch(noneMode.message, /字面命中/, `${name}: a synonym hit is not a literal hit: ${noneMode.message}`);

      // 8. Accessibility of the two states that show the notice.
      for (const query of ['安全防護', '播客摘要']) {
        await setQuery(page, query);
        await page.waitForTimeout(350);
        const results = await new AxeBuilder({ page }).analyze();
        assert.equal(results.violations.length, 0,
          `${name}/${query}: axe violations: ${results.violations.map(v => v.id).join(', ')}`);
      }

      // 9. A sentence that the site re-ran as its own words must keep those words:
      // before this, narrowing re-applied the raw sentence and showed 0 where the
      // button promised 15.
      await page.evaluate(() => {
        const scope = document.getElementById('search-scope');
        scope.value = '';
        scope.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await setQuery(page, '幫我每天早上整理信箱裡的重要郵件，並把需要回覆的挑出來');
      await page.waitForTimeout(600);
      const sentence = await read(page);
      assert.equal(await page.locator('#search-split').evaluate(node => node.hidden), false,
        `${name}: the fixture sentence still triggers the site's own word split`);
      if (sentence.noteMode === 'body') {
        const sentencePromised = Number((sentence.actionText.match(/(\d+)\s*筆/) || [])[1]);
        assert.ok(sentencePromised > 0, `${name}: the sentence notice promises a count: ${sentence.actionText}`);
        const sentenceQuery = await page.locator('#query').inputValue();
        await page.locator('#match-scope-action').click();
        await page.waitForTimeout(400);
        const sentenceNarrowed = await read(page);
        assert.equal(sentenceNarrowed.total, sentencePromised,
          `${name}: a split sentence keeps its words when narrowed (${sentenceQuery} -> ${sentenceNarrowed.total} vs promised ${sentencePromised})`);
      }

      // 9b. Words that the query rewrites do not hand back unchanged: joining them
      // with a space ("庫存 追蹤" -> ["庫存"]) would drop one, so the site has to
      // pick a join that round-trips or keep the promise out of reach.
      await page.evaluate(() => {
        const scope = document.getElementById('search-scope');
        scope.value = '';
        scope.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await setQuery(page, '請幫我時事追蹤庫存');
      await page.waitForTimeout(600);
      const rewritten = await read(page);
      if (rewritten.noteMode === 'body' && !rewritten.actionHidden) {
        const rewrittenPromised = Number((rewritten.actionText.match(/(\d+)\s*筆/) || [])[1]);
        await page.locator('#match-scope-action').click();
        await page.waitForTimeout(400);
        const rewrittenNarrowed = await read(page);
        assert.equal(rewrittenNarrowed.total, rewrittenPromised,
          `${name}: a rewritten query keeps both words when narrowed (${rewrittenNarrowed.total} vs promised ${rewrittenPromised})`);
        const field = await page.locator('#query').inputValue();
        assert.ok(field.length > 1, `${name}: the field still carries the searched words: ${field}`);
      }

      // 9c. A partial load is not a census: the sentence has to say so.
      const partialContext = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const partialPage = await partialContext.newPage();
      await partialPage.route('**/corpus.json*', route => route.fulfill({ status: 503, body: 'Unavailable' }));
      await partialPage.route('**/cases/065-*', route => route.fulfill({ status: 503, body: 'Unavailable' }));
      await partialPage.goto(origin + '?q=安全防護#explore', { waitUntil: 'networkidle' });
      await partialPage.locator('#partial-load').waitFor({ state: 'visible', timeout: 60000 });
      await partialPage.waitForTimeout(600);
      const partial = await partialPage.evaluate(() => ({
        partialShown: !document.getElementById('partial-load').hidden,
        count: document.getElementById('results-count').textContent.trim(),
        message: document.getElementById('match-scope-message').textContent.trim(),
        total: Number((document.getElementById('results-count').textContent.match(/顯示\s*(\d+)/) || [])[1]),
        stated: Number((document.getElementById('match-scope-message').textContent.match(/這\s*(\d+)\s*筆裡，(\d+)\s*筆/) || [])[1]),
        purpose: Number((document.getElementById('match-scope-message').textContent.match(/這\s*(\d+)\s*筆裡，(\d+)\s*筆/) || [])[2])
      }));
      assert.equal(partial.partialShown, true, `${name}: the fixture really simulates a partial load`);
      assert.match(partial.message, /個來源檔案未載入/, `${name}: a partial load must not read as a census: ${partial.message}`);
      assert.equal(partial.stated, partial.total, `${name}: the split still describes the loaded count (${partial.stated} vs ${partial.total})`);
      await partialContext.close();

      await page.evaluate(() => {
        const scope = document.getElementById('search-scope');
        scope.value = '';
        scope.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(200);

      // 10. Keyboard: the action is reachable and Enter narrows the set.
      await setQuery(page, '安全防護');
      await page.waitForTimeout(300);
      const keyboardTarget = await read(page);
      const keyboardPromised = Number((keyboardTarget.actionText.match(/(\d+)\s*筆/) || [])[1]);
      await page.locator('#match-scope-action').focus();
      assert.equal((await read(page)).focus, 'match-scope-action', `${name}: the action takes focus`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const keyboardDone = await read(page);
      assert.equal(keyboardDone.total, keyboardPromised, `${name}: Enter applies the same narrowing (${keyboardDone.total} vs ${keyboardPromised})`);

      assert.equal(errors.length, 0, `${name}: page errors: ${errors.join(' | ')}`);
      rows.push({ name, width, height, headline: wide.count, message: wide.message, action: wide.actionText, narrowed: narrowed.count, directHidden: direct.noteHidden, noticeBottom: geometry.noticeBottom, firstCardTop: geometry.cardTop, overflow: false, axe: 0, pageErrors: errors.length });
      await context.close();
    }
    console.log('MATCH_SCOPE ' + JSON.stringify(rows));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.stack || error); process.exit(1); });
