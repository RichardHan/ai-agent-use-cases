'use strict';
// A shared search link lands on the result line, not on the field: measured on the
// published site (2026-11-11) the field ended 381px above a 390x844 viewport and
// 527px above a 320x640 one, while the only pointer route back (the in-flow
// "回到搜尋與篩選" row) started 4,878px down. The count therefore named how many
// cases matched without naming the words, and changing them needed a swipe.
// This walks what a reader sees and does instead: the labelled button beside the
// count, the field it returns to, and the states that must not show it.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const out = process.env.QA_OUT || 'qa-artifacts/refine-from-results';
const report = [];

const box = async (page, selector) => page.evaluate((sel) => {
  const node = document.querySelector(sel);
  if (!node) return null;
  const rect = node.getBoundingClientRect();
  return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height), hidden: node.hidden === true || getComputedStyle(node).display === 'none' };
}, selector);

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const base = process.env.REFINE_URL || 'http://127.0.0.1:8081/ai-agent-use-cases/';
  const browser = await chromium.launch();
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844], ['small-phone', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      const row = { viewport: name, width, height };
      report.push(row);

      // 1. A plain collection has no condition to change: the header stays as it was.
      await page.goto(base, { waitUntil: 'load' });
      await page.locator('#results-count').filter({ hasText: '顯示' }).waitFor({ timeout: 90000 });
      row.plain = { refine: await box(page, '#refine-query'), empty: await box(page, '#edit-query') };
      assert(row.plain.refine, name + ': the results header ships the refine entry');
      assert.equal(row.plain.refine.hidden, true, name + ': no refine entry without a condition');

      // 2. Arriving on a shared search link: the entry has to be on the first screen.
      await page.goto(base + '?q=' + encodeURIComponent('旅遊') + '#explore', { waitUntil: 'load' });
      await page.locator('#results .card').first().waitFor({ timeout: 90000 });
      await page.waitForFunction(() => document.activeElement?.id === 'results-count', null, { timeout: 30000 }).catch(() => {});
      const refine = await box(page, '#refine-query');
      const title = await box(page, '#results .card h3');
      const countBefore = (await page.locator('#results-count').innerText()).trim();
      row.arrival = { refine, title, count: countBefore };
      assert.equal(refine.hidden, false, name + ': a shared search link offers a way back to the words');
      assert(refine.top >= 0 && refine.bottom <= height, name + ': the refine entry is on the first screen (' + JSON.stringify(refine) + ' of ' + height + ')');
      assert(refine.height >= 44, name + ': the refine entry keeps a 44px target (' + refine.height + 'px)');
      assert(title.top >= 0 && title.bottom <= height, name + ': the first case title still shares the first screen (' + JSON.stringify(title) + ' of ' + height + ')');
      const label = (await page.locator('#refine-query').innerText()).trim();
      row.label = label;
      assert.equal(label, '修改「旅遊」', name + ': the entry names the words the results came from');
      assert.equal(await page.locator('#refine-query').getAttribute('aria-label'), null, name + ': the visible label is the accessible name');

      // 3. One tap returns to the field with the words selected, and nothing else moves.
      await page.locator('#refine-query').click();
      await page.waitForTimeout(150);
      const after = await page.evaluate(() => {
        const field = document.querySelector('#query');
        const rect = field.getBoundingClientRect();
        return {
          focus: document.activeElement.id,
          value: field.value,
          selected: field.selectionEnd - field.selectionStart,
          fieldTop: Math.round(rect.top),
          fieldBottom: Math.round(rect.bottom),
        };
      });
      row.returned = after;
      assert.equal(after.focus, 'query', name + ': the entry returns focus to the search field');
      assert.equal(after.selected, after.value.length, name + ': the words are selected for replacing (' + after.selected + ' of ' + after.value.length + ')');
      assert(after.fieldTop >= 0 && after.fieldBottom <= height, name + ': the field it returns to is on screen (' + after.fieldTop + '-' + after.fieldBottom + ' of ' + height + ')');
      assert.equal((await page.locator('#results-count').innerText()).trim(), countBefore, name + ': returning to the field does not change the results');

      // 4. With the field on screen the row stays away: it would push the
      //    match-scope notice past the fold (390x844 measured 865 > 844 when the
      //    whole row was always visible). Scrolling away brings it back.
      await page.goto(base, { waitUntil: 'load' });
      await page.locator('#results .card').first().waitFor({ timeout: 90000 });
      await page.locator('.hero-search-link').click();
      await page.locator('#query').fill('安全防護');
      await page.waitForFunction(() => document.querySelector('#results-count').textContent.includes('顯示'));
      await page.waitForTimeout(400);
      row.searchVisible = await page.evaluate(() => ({
        refineHidden: document.querySelector('#refine-query').hidden,
        heading: Math.round(document.querySelector('.results-heading').getBoundingClientRect().height),
        noticeBottom: Math.round(document.getElementById('match-scope').getBoundingClientRect().bottom),
        viewport: innerHeight,
      }));
      assert.equal(row.searchVisible.refineHidden, true, name + ': the entry waits while the search field is on screen');
      // 320x740 has no room above the fold even without this row (match-scope-note-browser
      // records the same size separately), so the budget is checked where it exists.
      if (width >= 390) assert(row.searchVisible.noticeBottom <= row.searchVisible.viewport, name + ': the match-scope notice stays readable without scrolling (' + row.searchVisible.noticeBottom + ' of ' + row.searchVisible.viewport + ')');
      await page.evaluate(() => window.scrollBy(0, 700));
      await page.waitForTimeout(350);
      row.scrolledAway = await page.evaluate(() => ({ hidden: document.querySelector('#refine-query').hidden, text: document.querySelector('#refine-query').textContent }));
      assert.equal(row.scrolledAway.hidden, false, name + ': scrolling the field away brings the entry back');
      assert.match(row.scrolledAway.text, /安全防護/, name + ': the returned entry names the current words');
      await page.evaluate(() => window.scrollBy(0, -700));
      await page.waitForTimeout(350);
      assert.equal(await page.locator('#refine-query').isHidden(), true, name + ': scrolling back to the field takes it away again');

      // 5. Facets without words are a condition too, and zero results keep the
      //    empty state's own recovery instead of two duplicate entries.
      await page.goto(base + '?scenario=' + encodeURIComponent('生活') + '#explore', { waitUntil: 'load' });
      await page.locator('#results .card').first().waitFor({ timeout: 90000 });
      await page.evaluate(() => window.scrollBy(0, 700));
      await page.waitForTimeout(350);
      row.facetOnly = { refine: await box(page, '#refine-query'), label: await page.locator('#refine-query').getAttribute('aria-label') };
      assert.equal(row.facetOnly.refine.hidden, false, name + ': filters without words still offer the way back (' + JSON.stringify(row.facetOnly) + ')');
      assert.equal(row.facetOnly.label, '修改關鍵字（目前 1 項篩選）', name + ': the filters-only entry says how many filters it edits');

      // A long query is clipped to one row instead of wrapping the header.
      const longQuery = '長途旅程規劃與住宿比較表單整理清單核對';
      await page.goto(base + '?q=' + encodeURIComponent(longQuery) + '#explore', { waitUntil: 'load' });
      await page.locator('#results .card').first().waitFor({ timeout: 90000 });
      row.longQuery = {
        label: (await page.locator('#refine-query').innerText()).trim(),
        overflow: await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth)),
      };
      assert(row.longQuery.label.endsWith('…」'), name + ': a long query is shortened with an ellipsis (' + row.longQuery.label + ')');
      assert.equal(row.longQuery.overflow, 0, name + ': a long query keeps the header inside the viewport');
      await page.goto(base + '?q=' + encodeURIComponent('no-such-visitor-journey-20261111') + '#explore', { waitUntil: 'load' });
      await page.locator('#empty').waitFor({ state: 'visible', timeout: 90000 });
      row.empty = { refine: await box(page, '#refine-query'), edit: await box(page, '#edit-query') };
      assert.equal(row.empty.refine.hidden, true, name + ': the empty state keeps one recovery entry, not two');
      assert.equal(row.empty.edit.hidden, false, name + ': the empty state keeps its own 修改關鍵字 entry');

      // 6. Keyboard: the summary keeps its first Tab to the share action, then the entry.
      await page.goto(base + '?q=' + encodeURIComponent('旅遊') + '#explore', { waitUntil: 'load' });
      await page.locator('#results .card').first().waitFor({ timeout: 90000 });
      await page.waitForFunction(() => document.activeElement?.id === 'results-count', null, { timeout: 30000 });
      const tabs = [];
      for (let index = 0; index < 2; index += 1) {
        await page.keyboard.press('Tab');
        tabs.push(await page.evaluate(() => document.activeElement.id || document.activeElement.tagName));
      }
      row.tabs = tabs;
      assert.deepEqual(tabs, ['copy-search-link', 'refine-query'], name + ': Tab from the result line reaches share and then the refine entry (' + tabs.join(' → ') + ')');
      await page.keyboard.press('Enter');
      row.keyboardFocus = await page.evaluate(() => document.activeElement.id);
      assert.equal(row.keyboardFocus, 'query', name + ': Enter on the entry returns to the field');

      // 7. Layout and assistive-tech checks on the arrival state.
      await page.goto(base + '?q=' + encodeURIComponent('旅遊') + '#explore', { waitUntil: 'load' });
      await page.locator('#results .card').first().waitFor({ timeout: 90000 });
      await page.waitForTimeout(300);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      row.axe = axe.violations.map((violation) => violation.id);
      row.overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth));
      row.errors = errors;
      assert.deepEqual(row.axe, [], name + ': no axe violations in the arrival state');
      assert.equal(row.overflow, 0, name + ': no horizontal overflow');
      assert.deepEqual(errors, [], name + ': no page errors');
      await page.screenshot({ path: out + '/' + name + '-arrival.png' });
      row.passed = true;
      await context.close();
    }
    fs.writeFileSync(out + '/report.json', JSON.stringify(report, null, 2));
    console.log('REFINE_FROM_RESULTS ' + JSON.stringify(report));
    await browser.close();
  } catch (error) {
    fs.writeFileSync(out + '/report.json', JSON.stringify(report, null, 2));
    await browser.close();
    throw error;
  }
})().catch((error) => { console.error(error); process.exit(1); });
