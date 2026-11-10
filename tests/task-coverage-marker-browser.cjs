'use strict';
// Contract: a hero task link carries the 「僅相關詞」 marker exactly when the
// results screen for that task has no case that describes itself in its own
// title/purpose/pain (the overview scope). The expectation is measured through
// the URL the link points at, not through the function that draws the marker,
// so the two surfaces have to agree on their own.
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8099/ai-agent-use-cases/';
const ready = page => page.waitForFunction(() => typeof discoveryReady !== 'undefined' && discoveryReady, null, { timeout: 120000 });
const settled = page => page.waitForFunction(() => {
  const el = document.getElementById('results-count');
  return el && !/讀取|正在/.test(el.textContent);
}, null, { timeout: 120000 });
const countOf = page => page.evaluate(() => Number((document.getElementById('results-count').textContent.match(/(\d+)\s*\/\s*[\d,]+/) || [])[1]));
const markedQueries = page => page.evaluate(() => [...document.querySelectorAll('#hero-problem-tags a.problem-tag[data-coverage="none"], .hero-task-examples a[data-coverage="none"]')]
  .map(link => new URL(link.href).searchParams.get('q')));

(async () => {
  const browser = await chromium.launch();
  const report = [];

  // One pass over every task link: the marker state must match the overview count.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await ready(page);
    const links = await page.evaluate(() => [...document.querySelectorAll('#hero-problem-tags a.problem-tag, .hero-task-examples a[data-task-entry]')]
      .map(link => ({ query: new URL(link.href).searchParams.get('q'), marked: link.dataset.coverage === 'none' })));
    assert.equal(links.length, 56, 'three task entries plus the 53-task directory');

    const mismatches = [];
    for (const link of links) {
      await page.goto(`${origin}?q=${encodeURIComponent(link.query)}&scope=overview#explore`, { waitUntil: 'domcontentloaded' });
      await settled(page);
      const claims = await countOf(page);
      if ((claims === 0) !== link.marked) mismatches.push({ query: link.query, claims, marked: link.marked });
    }
    assert.deepEqual(mismatches, [], 'marker state must equal "no case describes this task"');
    const marked = links.filter(link => link.marked).map(link => link.query);
    assert.ok(marked.length > 0 && marked.length < links.length, `both states appear: ${marked.join(',')}`);
    report.push({ viewport: 'desktop-directory', links: links.length, marked: marked.length, markedQueries: marked });

    // The legend must explain the marker only while a marker exists.
    await page.goto(origin, { waitUntil: 'networkidle' });
    await ready(page);
    assert.equal(await page.locator('#task-coverage-note').isVisible(), true, 'legend explains the marker');
    assert.match(await page.locator('#task-coverage-note').innerText(), /沒有案例自述在做這項任務/, 'legend states the claim boundary');

    // A covered task keeps its plain link: no badge, no rewritten accessible name.
    const plainTag = page.locator('a.problem-tag[href*="q=發票#explore"]');
    assert.equal(await plainTag.locator('.task-coverage-none').count(), 0, 'covered tasks carry no marker');
    assert.equal(await plainTag.getAttribute('aria-label'), null, 'covered tasks keep their own text as the name');
    assert.equal(await plainTag.getAttribute('aria-describedby'), null, 'covered tasks carry no marker description');
    await context.close();
    assert.deepEqual(errors, [], `page errors: ${errors.join(', ')}`);
  }

  for (const vp of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'smallMobile', width: 320, height: 740 }
  ]) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await ready(page);
    const marked = await markedQueries(page);
    assert.ok(marked.length > 0, `${vp.name}: the marker renders`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, `${vp.name}: no horizontal overflow`);

    const badge = page.locator('a.problem-tag[href*="q=隱私審查#explore"] .task-coverage-none');
    assert.equal(await badge.innerText(), '僅相關詞', `${vp.name}: badge names the state`);
    const link = page.locator('a.problem-tag[href*="q=隱私審查#explore"]');
    if (await link.isVisible()) {
      const box = await link.boundingBox();
      assert.ok(box.height >= 44, `${vp.name}: marked link keeps the 44px target (got ${Math.round(box.height)}px)`);
      assert.equal(await link.getAttribute('aria-label'), null, `${vp.name}: the visible text stays the accessible name`);
      assert.equal(await link.getAttribute('aria-describedby'), 'task-coverage-note', `${vp.name}: the legend is the description`);
      assert.match((await link.innerText()).replace(/\s+/g, ''), /隱私審查僅相關詞/, `${vp.name}: the marker is part of the visible link text`);
    } else {
      // Collapsed phones keep nine tasks; the marked one may sit behind the disclosure.
      assert.equal(await page.locator('#problem-tags-toggle').getAttribute('aria-expanded'), 'false', `${vp.name}: directory starts collapsed`);
      assert.equal(await page.locator('#hero-problem-tags a.problem-tag[href*="q=出差報銷#explore"] .task-coverage-none').count(), 1, `${vp.name}: a marked task is still reachable in the first nine`);
    }

    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(axe.violations.length, 0, `${vp.name}: axe ${JSON.stringify(axe.violations.map(v => v.id))}`);
    report.push({ viewport: vp.name, marked: marked.length, navHeight: Math.round(await page.locator('#hero-problem-tags').evaluate(node => node.getBoundingClientRect().height)) });
    assert.deepEqual(errors, [], `${vp.name}: page errors ${errors.join(', ')}`);
    await context.close();
  }

  // Clicking a marked task must land on the disclosed split and the exit, and the
  // promised related-word count must be the number the screen shows.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await ready(page);
    if (await page.locator('#problem-tags-toggle').isVisible() && await page.locator('#problem-tags-toggle').getAttribute('aria-expanded') === 'false') {
      await page.locator('#problem-tags-toggle').click();
      await page.waitForFunction(() => document.querySelector('#problem-tags-toggle').getAttribute('aria-expanded') === 'true');
    }
    const promise = await page.locator('a.problem-tag[href*="q=發票辨識#explore"]').getAttribute('title');
    const promised = Number((promise.match(/(\d+)\s*筆提到相關詞/) || [])[1]);
    assert.ok(promised > 0, `the link promises a related-word count: ${promise}`);
    await page.locator('a.problem-tag[href*="q=發票辨識#explore"]').click();
    await settled(page);
    assert.equal(await countOf(page), promised, 'the screen shows the number the link promised');
    assert.equal(await page.locator('#match-scope').getAttribute('data-mode'), 'none', 'the screen says no case claims the task');
    assert.match(await page.locator('#match-scope-message').innerText(), /不代表案例在做這件事/, 'the screen keeps the honesty sentence');
    assert.equal(await page.locator('#match-scope-action').isVisible(), true, 'an alternative search stays one click away');
    await page.locator('#match-scope-action').click();
    await settled(page);
    assert.ok(await countOf(page) > 0, 'the alternative search lands on cases');
    assert.deepEqual(errors, [], `page errors ${errors.join(', ')}`);
    report.push({ viewport: 'marked-click', promised, afterAlternative: await countOf(page) });
    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})().catch(error => {
  console.error(error);
  process.exit(1);
});
