'use strict';
// Measured on the live site before this round: `?q=怎麼整理會議記錄` (7 / 515) on the
// homepage, then 「工作省點力」 under 換個情境 — the query box emptied, 實作門檻 was
// reset, the address bar became `?scenario=工作` with 162 / 515, and nothing on
// screen said a query had ever existed. The card the button drew is at the top of
// the page, far above the result line, so a notice parked next to the results would
// be invisible from where the reader actually lands.
//
// This check pins the whole handoff: the notice is in the viewport together with the
// drawn card, it names every cleared condition, the way back restores the same
// result set and URL, and a switch that cleared nothing stays silent. The detail
// handoff keeps landing on the result screen.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {AxeBuilder} = require('@axe-core/playwright');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8123/ai-agent-use-cases/';

const read = page => page.evaluate(() => {
  const notice = document.getElementById('scenario-reset');
  const box = notice.getBoundingClientRect();
  const card = document.querySelector('#drawn-case h3 button');
  const cardBox = card ? card.getBoundingClientRect() : null;
  return {
    query: document.getElementById('query').value,
    difficulty: document.getElementById('difficulty').value,
    scenario: document.getElementById('scenario').value,
    tool: document.getElementById('tool').value,
    sort: document.getElementById('sort').value,
    scope: document.getElementById('search-scope').value,
    count: document.getElementById('results-count').textContent.trim(),
    url: decodeURIComponent(location.href),
    noticeHidden: notice.hidden,
    message: document.getElementById('scenario-reset-message').textContent.trim(),
    action: document.getElementById('scenario-reset-action').textContent.trim(),
    noticeInDiscover: !!notice.closest('#discover'),
    noticeInExplore: !!notice.closest('#explore'),
    noticeCount: document.querySelectorAll('#scenario-reset').length,
    noticeFullyVisible: !notice.hidden && box.top >= 0 && box.bottom <= innerHeight && box.height > 0,
    cardInView: !!cardBox && cardBox.top >= 0 && cardBox.top < innerHeight,
    focus: document.activeElement && (document.activeElement.id || document.activeElement.tagName),
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

    // 1. A visitor with a search open hands off to a scenario through the homepage buttons.
    await load(page, '?q=' + encodeURIComponent('怎麼整理會議記錄') + '&difficulty=' + encodeURIComponent('入門對話'));
    const before = await read(page);
    assert.equal(before.query, '怎麼整理會議記錄');
    assert.equal(before.difficulty, '入門對話');
    const beforeCount = Number((before.count.match(/顯示\s*(\d+)/) || [])[1]);
    assert.ok(beforeCount > 0 && beforeCount < 515, 'the query narrows the collection: ' + before.count);
    await page.locator('#guide-options [data-scenario="工作"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const after = await read(page);
    assert.equal(after.query, '', 'the scenario switch still starts the search over');
    assert.equal(after.noticeHidden, false, `${name}: the switch says what it cleared`);
    assert.ok(after.message.includes('關鍵字「怎麼整理會議記錄」'), `${name}: names the query: ${after.message}`);
    assert.ok(after.message.includes('實作門檻「入門對話」'), `${name}: names the threshold: ${after.message}`);
    assert.equal(after.action, `回到原本的搜尋（${beforeCount} 筆）`);
    assert.equal(after.noticeCount, 1, 'one notice element, relocated rather than duplicated');
    assert.equal(after.noticeInDiscover, true, `${name}: the notice sits with the card the button drew`);
    assert.equal(after.noticeInExplore, false);
    assert.equal(after.noticeFullyVisible, true, `${name}: the notice is readable where the reader lands`);
    assert.equal(after.cardInView, true, `${name}: the drawn card is still on screen`);
    assert.equal(after.focus, 'scenario-reset-action', `${name}: keyboard focus continues at the way back`);
    assert.equal(after.overflow, 0, `${name}: no horizontal overflow`);
    await audit('scenario-notice');

    // 2. One click back restores the search the switch removed.
    await page.locator('#scenario-reset-action').click();
    await page.waitForTimeout(400);
    const restored = await read(page);
    assert.equal(restored.query, '怎麼整理會議記錄');
    assert.equal(restored.difficulty, '入門對話');
    assert.equal(restored.noticeHidden, true, 'restoring the search clears the notice');
    assert.match(restored.count, new RegExp(`顯示\\s*${beforeCount}\\s*/`), 'the same result set comes back');
    assert.ok(restored.url.includes('怎麼整理會議記錄'), 'the way back puts the query in the address bar: ' + restored.url);
    assert.equal(restored.url.includes('scenario='), false, 'the scenario filter the switch applied is gone: ' + restored.url);
    assert.equal(restored.focus, 'results-count', 'the way back lands on the result count');

    // 3. Nothing was cleared, so nothing is announced.
    await load(page, '');
    await page.locator('#guide-options [data-scenario="生活"]').click();
    await page.waitForTimeout(400);
    const clean = await read(page);
    assert.equal(clean.noticeHidden, true, `${name}: a switch that cleared nothing stays silent`);
    assert.equal(clean.focusInDrawnCase, true, 'the card keeps the handoff it had before this round');

    // 4. 隨便逛逛 is a switch to all scenarios and must not print an empty label.
    await load(page, '?q=' + encodeURIComponent('怎麼整理會議記錄'));
    await page.locator('#guide-options [data-scenario=""]').click();
    await page.waitForTimeout(400);
    const all = await read(page);
    assert.equal(all.noticeHidden, false);
    assert.ok(!all.message.includes('「」'), 'no empty quoted scenario: ' + all.message);
    assert.ok(all.message.includes('全部情境'), all.message);


    // 6. The scenario chooser is not a loss, but the way back it leaves behind is.
    await load(page, '?q=' + encodeURIComponent('旅遊') + '&scenario=' + encodeURIComponent('工作') +
      '&tool=' + encodeURIComponent('Grok Bot') + '&sort=reviewed');
    const filtered = await read(page);
    assert.equal(filtered.sort, 'reviewed');
    assert.equal(filtered.tool, 'Grok Bot');
    await page.locator('#guide-options [data-scenario="生活"]').click();
    await page.waitForTimeout(400);
    const switched = await read(page);
    assert.equal(switched.noticeHidden, false, `${name}: losing the query is still announced`);
    assert.ok(switched.message.includes('提及工具「Grok Bot」'), `${name}: names the tool: ${switched.message}`);
    assert.ok(!switched.message.includes('使用情境「工作」'), `${name}: the chooser itself is not a loss: ${switched.message}`);
    // The switch leaves sort alone, so the way back can only be shown to restore it
    // if the reader changes it after the switch.
    await page.evaluate(() => {
      const sort = document.getElementById('sort');
      sort.value = '';
      sort.dispatchEvent(new Event('change', {bubbles: true}));
    });
    await page.waitForTimeout(200);
    assert.equal((await read(page)).sort, '', 'the sort is now different from the snapshot');
    await page.locator('#scenario-reset-action').click();
    await page.waitForTimeout(400);
    const back = await read(page);
    for (const [field, value] of [['query', '旅遊'], ['scenario', '工作'], ['tool', 'Grok Bot'], ['sort', 'reviewed']]) {
      assert.equal(back[field], value, `${name}: the way back restores ${field}`);
    }
    assert.equal(back.url.includes('sort=reviewed'), true, 'sort survives in the address bar');

    // 7. Pressing the scenario that is already active changes no search state, so it
    // must not throw away the pending way back to the query the first press removed.
    await load(page, '?q=' + encodeURIComponent('怎麼整理會議記錄'));
    await page.locator('#guide-options [data-scenario="工作"]').click();
    await page.waitForTimeout(400);
    const firstPress = await read(page);
    assert.equal(firstPress.noticeHidden, false);
    await page.locator('#guide-options [data-scenario="工作"]').click();
    await page.waitForTimeout(400);
    const secondPress = await read(page);
    assert.equal(secondPress.noticeHidden, false, `${name}: the pending way back survives a no-op press`);
    assert.equal(secondPress.action, firstPress.action, 'and it still promises the same set');
    assert.ok(secondPress.message.includes('關鍵字「怎麼整理會議記錄」'), secondPress.message);
    await page.locator('#scenario-reset-action').click();
    await page.waitForTimeout(400);
    assert.equal((await read(page)).query, '怎麼整理會議記錄', 'the query is still recoverable after the repeat press');

    // 8. With nothing pending and nothing to clear, a scenario press is silent.
    await load(page, '');
    await page.locator('#guide-options [data-scenario="開發"]').click();
    await page.waitForTimeout(400);
    const chooserOnly = await read(page);
    assert.equal(chooserOnly.noticeHidden, true, `${name}: switching scenario with nothing else active stays silent`);
    assert.equal(chooserOnly.focusInDrawnCase, true, `${name}: and the card keeps the handoff`);

    // 5. The detail handoff keeps the notice on the result screen where it belongs.
    await load(page, '?q=' + encodeURIComponent('旅遊') + '&difficulty=' + encodeURIComponent('入門對話'));
    await page.locator('#results .card .card-bottom button').first().click();
    await page.locator('#detail[open]').waitFor();
    await page.locator('.plain-overview .detail-action-scenario').click();
    await page.waitForTimeout(500);
    const handoff = await read(page);
    assert.equal(handoff.noticeHidden, false, 'the detail handoff still explains itself');
    assert.equal(handoff.noticeInExplore, true, 'the detail handoff keeps the notice above the result line');
    assert.equal(handoff.noticeInDiscover, false);
    assert.equal(handoff.noticeFullyVisible, true, `${name}: the result-screen notice is in view`);
    assert.equal(handoff.overflow, 0);
    await audit('detail-notice');

    assert.deepEqual(errors, [], `${name}: page errors`);
    results.push({name, beforeCount, message: after.message, action: after.action, handoff: handoff.message});
    await context.close();
  }
  await browser.close();
  console.log('SCENARIO_CLEAR_NOTICE_OK ' + JSON.stringify(results));
})().catch(error => { console.error(error); process.exit(1); });
