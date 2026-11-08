'use strict';
// Regression: the 53-task directory must not push the value panel and case
// cards more than a screen down on phones. Phones disclose nine tasks first;
// wide screens keep the full directory. Every task link stays in the DOM.
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8099/ai-agent-use-cases/';

(async () => {
  const browser = await chromium.launch();
  const report = [];
  for (const vp of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'smallMobile', width: 320, height: 740 }
  ]) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof discoveryReady !== 'undefined' && discoveryReady, null, { timeout: 120000 });

    const nav = page.locator('#hero-problem-tags');
    const toggle = page.locator('#problem-tags-toggle');
    const total = await nav.locator('a.problem-tag').count();
    assert.ok(total >= 45, `${vp.name}: all task links stay in the DOM (got ${total})`);

    const visibleTasks = () => page.evaluate(() =>
      [...document.querySelectorAll('#hero-problem-tags a.problem-tag')]
        .filter(link => link.getClientRects().length > 0).length
    );
    const navHeight = () => nav.evaluate(node => node.getBoundingClientRect().height);
    const axe = async state => {
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.equal(result.violations.length, 0, `${vp.name} ${state}: axe ${JSON.stringify(result.violations.map(v => v.id))}`);
    };

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert.equal(overflow, false, `${vp.name}: no horizontal overflow`);

    if (vp.width > 760) {
      assert.equal(await toggle.isVisible(), false, `${vp.name}: wide screens do not need the disclosure`);
      assert.equal(await visibleTasks(), total, `${vp.name}: wide screens show every task link`);
      report.push({ viewport: vp.name, state: 'wide', total, visible: total, navHeight: Math.round(await navHeight()) });
    } else {
      assert.equal(await toggle.isVisible(), true, `${vp.name}: disclosure control is visible`);
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false', `${vp.name}: directory starts collapsed`);
      assert.match(await toggle.innerText(), new RegExp(`顯示全部 ${total} 個任務`), `${vp.name}: control names the full count`);
      assert.equal(await visibleTasks(), 9, `${vp.name}: nine tasks are shown first`);

      const lateTask = nav.locator('a.problem-tag[href*="安全防護"]');
      assert.equal(await lateTask.isVisible(), false, `${vp.name}: a late task starts hidden`);

      const collapsedHeight = await navHeight();
      assert.ok(collapsedHeight < 300, `${vp.name}: collapsed directory is not a wall (got ${Math.round(collapsedHeight)}px)`);
      const valueTop = await page.locator('.hero-value-props').evaluate(node => node.getBoundingClientRect().top + scrollY);
      assert.ok(valueTop < 1250, `${vp.name}: value panel sits near the first screen (got ${Math.round(valueTop)}px)`);
      await axe('collapsed');

      await toggle.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#problem-tags-toggle').getAttribute('aria-expanded') === 'true');
      assert.equal(await visibleTasks(), total, `${vp.name}: expanding shows every task link`);
      assert.equal(await lateTask.isVisible(), true, `${vp.name}: late task is reachable after expanding`);
      const expandedHeight = await navHeight();
      assert.ok(expandedHeight > collapsedHeight + 100, `${vp.name}: expanded directory is taller (got ${Math.round(expandedHeight)}px)`);
      await axe('expanded');

      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#problem-tags-toggle').getAttribute('aria-expanded') === 'false');
      assert.equal(await visibleTasks(), 9, `${vp.name}: collapsing hides late tasks again`);
      await axe('collapsed-again');

      report.push({
        viewport: vp.name,
        state: 'narrow',
        total,
        visibleCollapsed: 9,
        collapsedHeight: Math.round(collapsedHeight),
        expandedHeight: Math.round(expandedHeight),
        valueTop: Math.round(valueTop)
      });
    }

    assert.deepEqual(errors, [], `${vp.name}: page errors ${errors.join(', ')}`);
    await context.close();
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
