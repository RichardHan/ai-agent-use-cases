'use strict';
// Measured on the merged build (`da01ab66`, 1440x900): `?q=怎麼整理會議記錄` ->
// 「工作省點力」 shows the notice with one click back to 7 results. Pressing
// 「生活」 next hides that notice and the way back (`#scenario-reset` hidden, query
// still empty, 101 / 515) even though the query the first press removed is still
// gone — the reader has no route back to their own words. Pressing the same
// scenario again keeps the notice in the DOM but scrolls the reader from
// scrollY 1915 to 128, so the notice they were reading is off screen.
//
// This check pins the persistence: a press that clears nothing of its own must not
// take away the way back the previous press created, must re-describe the scenario
// now chosen, and must leave the notice where the reader lands. With nothing
// pending, the drawn card keeps the handoff it has today.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {AxeBuilder} = require('@axe-core/playwright');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8184/ai-agent-use-cases/';

const read = page => page.evaluate(() => {
  const notice = document.getElementById('scenario-reset');
  const box = notice.getBoundingClientRect();
  const card = document.querySelector('#drawn-case h3 button');
  const cardBox = card ? card.getBoundingClientRect() : null;
  return {
    query: document.getElementById('query').value,
    scenario: document.getElementById('scenario').value,
    count: document.getElementById('results-count').textContent.trim(),
    url: decodeURIComponent(location.href),
    noticeHidden: notice.hidden,
    message: document.getElementById('scenario-reset-message').textContent.trim(),
    action: document.getElementById('scenario-reset-action').textContent.trim(),
    noticeFullyVisible: !notice.hidden && box.height > 0 && box.top >= 0 && box.bottom <= innerHeight,
    cardInView: !!cardBox && cardBox.top >= 0 && cardBox.top < innerHeight,
    focus: document.activeElement && (document.activeElement.id || document.activeElement.className || document.activeElement.tagName),
    focusInDrawnCase: !!document.activeElement && !!document.activeElement.closest('#drawn-case'),
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
});

const load = async (page, url) => {
  await page.goto(origin + url, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => !document.getElementById('guide-options').disabled &&
    !/正在讀取/.test(document.getElementById('results-count').textContent), null, {timeout: 60000});
};

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['small', 320, 740]]) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const audit = async label => {
      const {violations} = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(violations.map(v => v.id), [], `${name} ${label}: axe violations`);
    };

    // 1. The notice says what the first press cleared.
    await load(page, '?q=' + encodeURIComponent('怎麼整理會議記錄'));
    const before = await read(page);
    const beforeCount = Number((before.count.match(/顯示\s*(\d+)/) || [])[1]);
    assert.ok(beforeCount > 0 && beforeCount < 515, 'the query narrows the collection: ' + before.count);
    await page.locator('#guide-options [data-scenario="工作"]').click();
    await page.waitForTimeout(400);
    const first = await read(page);
    assert.equal(first.noticeHidden, false, `${name}: the first switch explains itself`);
    assert.ok(first.noticeFullyVisible, `${name}: the notice is where the reader lands`);
    assert.ok(first.message.includes('關鍵字「怎麼整理會議記錄」'), first.message);
    assert.equal(first.action, `回到原本的搜尋（${beforeCount} 筆）`);
    await audit('first switch');

    // 2. A second scenario press clears nothing of its own: the way back must survive
    // and describe the scenario now chosen.
    await page.locator('#guide-options [data-scenario="生活"]').click();
    await page.waitForTimeout(400);
    const second = await read(page);
    assert.equal(second.noticeHidden, false, `${name}: the pending way back survives another scenario press`);
    assert.ok(second.noticeFullyVisible, `${name}: and stays where the reader lands`);
    assert.ok(second.message.includes('生活'), `${name}: it describes the scenario now chosen: ${second.message}`);
    assert.ok(!second.message.includes('使用情境「工作」'), `${name}: the chooser itself is not a loss: ${second.message}`);
    assert.ok(second.message.includes('關鍵字「怎麼整理會議記錄」'), `${name}: the cleared query is still named`);
    assert.equal(second.action, first.action, `${name}: it still promises the same set`);
    assert.equal(second.scenario, '生活');
    await audit('second switch');

    // 3. The way back still returns the visitor's own words.
    await page.locator('#scenario-reset-action').click();
    await page.waitForTimeout(400);
    const restored = await read(page);
    assert.equal(restored.query, '怎麼整理會議記錄', `${name}: the query is recoverable after two presses`);
    assert.match(restored.count, new RegExp(`顯示\\s*${beforeCount}\\s*/`), `${name}: the same result set comes back`);
    assert.equal(restored.noticeHidden, true, 'restoring the search clears the notice');
    assert.equal(restored.url.includes('scenario='), false, 'the scenario the presses applied is gone: ' + restored.url);

    // 4. Pressing the same scenario twice is the same rule.
    await load(page, '?q=' + encodeURIComponent('怎麼整理會議記錄'));
    await page.locator('#guide-options [data-scenario="工作"]').click();
    await page.waitForTimeout(400);
    await page.locator('#guide-options [data-scenario="工作"]').click();
    await page.waitForTimeout(400);
    const repeated = await read(page);
    assert.equal(repeated.noticeHidden, false, `${name}: a repeated press keeps the notice`);
    assert.ok(repeated.noticeFullyVisible, `${name}: and the reader is not scrolled away from it`);
    await page.locator('#scenario-reset-action').click();
    await page.waitForTimeout(400);
    assert.equal((await read(page)).query, '怎麼整理會議記錄', 'the repeated press did not cost the way back');

    // 5. With nothing pending and nothing to clear, the drawn card keeps the handoff.
    await load(page, '');
    await page.locator('#guide-options [data-scenario="開發"]').click();
    await page.waitForTimeout(400);
    const chooserOnly = await read(page);
    assert.equal(chooserOnly.noticeHidden, true, `${name}: a scenario-only switch stays silent`);
    assert.equal(chooserOnly.focusInDrawnCase, true, `${name}: the card keeps the handoff it had`);

    assert.deepEqual(errors, [], `${name}: page errors`);
    results.push({name, beforeCount, first: first.message, second: second.message, action: second.action});
    await context.close();
  }
  await browser.close();
  console.log('SCENARIO_RESET_PERSISTENCE_OK ' + JSON.stringify(results));
})().catch(error => { console.error(error); process.exit(1); });
