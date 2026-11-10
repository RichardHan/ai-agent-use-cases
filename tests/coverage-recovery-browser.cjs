'use strict';
// Contract: every task chip in the dead-end panel carries the 「僅相關詞」 marker
// exactly when the results screen that chip opens reports no case describing the
// task in its own title/purpose/pain. The expectation is measured by visiting the
// chip's own query, so the panel and the results screen have to agree on their own
// rather than through the function that draws the marker.
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8140/ai-agent-use-cases/';
const deadEnd = 'q=' + encodeURIComponent('幫我寫遺囑');
const ready = page => page.waitForFunction(() => typeof discoveryReady !== 'undefined' && discoveryReady, null, { timeout: 120000 });
const settled = page => page.waitForFunction(() => {
  const el = document.getElementById('results-count');
  return el && !/讀取|正在/.test(el.textContent);
}, null, { timeout: 120000 });
const countOf = page => page.evaluate(() => Number((document.getElementById('results-count').textContent.match(/(\d+)\s*\/\s*[\d,]+/) || [])[1]));
const chips = page => page.evaluate(() => [...document.querySelectorAll('#empty-suggestions .recovery-problem-tag')].map(chip => ({
  term: chip.dataset.problemTag,
  marked: chip.dataset.coverage === 'none',
  text: chip.innerText.replace(/\s+/g, ''),
  title: chip.title,
  describedBy: chip.getAttribute('aria-describedby'),
  aria: chip.getAttribute('aria-label')
})));

(async () => {
  const browser = await chromium.launch();
  const report = [];

  // 1. One pass over every chip: the marker state must equal the results screen.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '?' + deadEnd, { waitUntil: 'networkidle' });
    await ready(page);
    await settled(page);
    const listed = await chips(page);
    assert.ok(listed.length > 20, `the dead-end panel offers task chips (${listed.length})`);
    assert.equal(await page.locator('#empty').isVisible(), true, 'the visitor is on a dead end');

    const marked = listed.filter(chip => chip.marked);
    assert.ok(marked.length > 0 && marked.length < listed.length, `both states appear: ${marked.map(c => c.term).join(',')}`);

    // Unmarked tasks stay in front: the panel is a 300px scroll box.
    const firstMarked = listed.findIndex(chip => chip.marked);
    assert.ok(listed.slice(firstMarked).every(chip => chip.marked), 'no covered task sits behind a marked one');

    const legend = page.locator('#empty-coverage-legend');
    assert.equal(await legend.isVisible(), true, 'the legend explains the marker');
    assert.match(await legend.innerText(), /僅相關詞/, 'the legend names the marker');
    assert.match(await legend.innerText(), /沒有案例自述在做這項任務/, 'the legend states the claim boundary');

    for (const chip of listed) {
      if (!chip.marked) {
        assert.equal(chip.describedBy, null, `${chip.term}: a covered chip carries no marker description`);
        continue;
      }
      assert.equal(chip.describedBy, 'empty-coverage-legend', `${chip.term}: the legend describes the marker`);
      assert.ok(chip.text.endsWith('僅相關詞'), `${chip.term}: the marker is part of the visible text`);
      assert.ok(chip.aria && chip.aria.endsWith('僅相關詞'), `${chip.term}: the marker is part of the accessible name`);
      assert.match(chip.title, /沒有案例.*自述/, `${chip.term}: the tooltip states the claim boundary`);
    }

    const mismatches = [];
    for (const chip of listed) {
      await page.goto(origin + '?q=' + encodeURIComponent(chip.term), { waitUntil: 'domcontentloaded' });
      await ready(page);
      await settled(page);
      const mode = await page.locator('#match-scope').getAttribute('data-mode');
      const shown = await countOf(page);
      if ((mode === 'none') !== chip.marked) mismatches.push(`${chip.term}: marked=${chip.marked} match-scope=${mode}`);
      if (chip.marked) {
        const promised = Number((chip.title.match(/(\d+)\s*筆相關詞命中/) || [])[1]);
        if (promised !== shown) mismatches.push(`${chip.term}: promised ${promised} but the screen shows ${shown}`);
      }
    }
    assert.deepEqual(mismatches, [], 'marker state must equal the results screen it opens');
    assert.deepEqual(errors, [], `page errors: ${errors.join(', ')}`);
    report.push({ viewport: 'desktop', chips: listed.length, marked: marked.length, markedTerms: marked.map(chip => chip.term) });
    await context.close();
  }

  // 2. The promise is kept on click: a marked chip lands on the disclosed split,
  //    a covered chip lands on cases that describe themselves.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '?' + deadEnd, { waitUntil: 'networkidle' });
    await ready(page);
    await settled(page);
    const listed = await chips(page);
    const marked = listed.find(chip => chip.marked);
    const covered = listed.find(chip => !chip.marked);

    const promise = Number((marked.title.match(/(\d+)\s*筆相關詞命中/) || [])[1]);
    await page.locator(`#empty-suggestions .recovery-problem-tag[data-problem-tag="${marked.term}"]`).click();
    await settled(page);
    assert.equal(await countOf(page), promise, 'the screen shows the number the chip promised');
    assert.equal(await page.locator('#match-scope').getAttribute('data-mode'), 'none', 'the screen says no case claims the task');
    assert.equal(await page.locator('#match-scope-action').isVisible(), true, 'an alternative search stays one click away');

    await page.goto(origin + '?' + deadEnd, { waitUntil: 'networkidle' });
    await ready(page);
    await settled(page);
    await page.locator(`#empty-suggestions .recovery-problem-tag[data-problem-tag="${covered.term}"]`).click();
    await settled(page);
    assert.ok(await countOf(page) > 0, 'a covered chip lands on cases');
    assert.notEqual(await page.locator('#match-scope').getAttribute('data-mode'), 'none', 'a covered chip needs no split notice');
    assert.deepEqual(errors, [], `page errors: ${errors.join(', ')}`);
    report.push({ viewport: 'marked-click', markedTerm: marked.term, promised: promise, coveredTerm: covered.term });
    await context.close();
  }

  // 3. Phones: no overflow, the marker still readable, the legend still there.
  for (const vp of [{ name: '390x844', width: 390, height: 844 }, { name: '320x740', width: 320, height: 740 }]) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '?' + deadEnd, { waitUntil: 'networkidle' });
    await ready(page);
    await settled(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, `${vp.name}: no horizontal overflow`);
    assert.equal(await page.locator('#empty-coverage-legend').isVisible(), true, `${vp.name}: legend renders`);
    const markedChip = page.locator('#empty-suggestions .recovery-problem-tag[data-coverage="none"]').first();
    assert.equal(await markedChip.locator('.task-coverage-none').innerText(), '僅相關詞', `${vp.name}: badge names the state`);
    const box = await markedChip.boundingBox();
    assert.ok(box.height >= 44, `${vp.name}: marked chip keeps the 44px target (got ${Math.round(box.height)}px)`);
    await markedChip.focus();
    assert.equal(await page.evaluate(() => document.activeElement?.dataset?.coverage), 'none', `${vp.name}: the marked chip takes keyboard focus`);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(axe.violations.length, 0, `${vp.name}: axe ${JSON.stringify(axe.violations.map(v => v.id))}`);
    assert.deepEqual(errors, [], `${vp.name}: page errors ${errors.join(', ')}`);
    report.push({ viewport: vp.name, legendHeight: Math.round(await page.locator('#empty-coverage-legend').evaluate(node => node.getBoundingClientRect().height)) });
    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})().catch(error => {
  console.error(error);
  process.exit(1);
});
