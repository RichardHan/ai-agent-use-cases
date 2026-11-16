'use strict';
// Contract: the empty-result task directory must not hide most of its options
// inside an inner scroll box. Every width shows the first nine chips plus a
// labelled "show all" button; expanding puts the rest in the page flow.
// The visitor's own recovery buttons stay in front of the generic task list.
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');

const origin = process.env.EMPTY_TASKS_URL || 'http://127.0.0.1:8099/ai-agent-use-cases/';
const FIRST_VISIBLE = 9;

const ready = page => page.waitForFunction(() => typeof discoveryReady !== 'undefined' && discoveryReady, null, { timeout: 120000 });

async function openEmpty(page) {
  await page.goto(`${origin}?q=xyz987&scenario=開發#explore`, { waitUntil: 'networkidle' });
  await ready(page);
  await page.locator('#empty').waitFor({ state: 'visible' });
}

const visibleChips = page => page.locator('.recovery-problem-tag:visible').count();
const totalChips = page => page.locator('.recovery-problem-tag').count();
const chipsState = page => page.evaluate(() => {
  const chips = document.querySelector('.empty-problem-chips');
  const toggle = document.getElementById('empty-problem-toggle');
  return {
    innerScroll: chips.scrollHeight > chips.clientHeight + 1,
    height: chips.getBoundingClientRect().height,
    collapsed: chips.dataset.collapsed,
    toggleExists: Boolean(toggle),
    toggleHidden: toggle ? toggle.hidden : null,
    expanded: toggle ? toggle.getAttribute('aria-expanded') : null,
    toggleText: toggle ? toggle.textContent.trim() : '',
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});

(async () => {
  const browser = await chromium.launch();
  const report = [];
  try {
    for (const [name, width, height] of [['mobile', 390, 844], ['small-mobile', 320, 640]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await openEmpty(page);

      const total = await totalChips(page);
      assert.ok(total > FIRST_VISIBLE, `${name}: the fixture needs more than ${FIRST_VISIBLE} tasks, got ${total}`);
      let state = await chipsState(page);
      assert.equal(state.toggleExists, true, `${name}: the empty panel must offer a disclosure button for the task directory`);
      assert.equal(await visibleChips(page), FIRST_VISIBLE, `${name}: only the first nine tasks are offered before expanding`);
      assert.equal(state.innerScroll, false, `${name}: the directory must not scroll inside itself (${state.height}px)`);
      assert.ok(state.height <= 400, `${name}: collapsed directory is ${state.height}px`);
      assert.equal(state.toggleHidden, false, `${name}: the disclosure button must be visible`);
      assert.equal(state.expanded, 'false', `${name}: aria-expanded starts false`);
      assert.equal(state.collapsed, 'true', `${name}: the chip container records the collapsed state`);
      assert.match(state.toggleText, new RegExp(`^顯示全部 ${total} 個任務$`), `${name}: the button names the real task count`);
      assert.equal(state.overflow, 0, `${name}: no horizontal overflow`);

      // Nine chips, then the disclosure: Tab cannot walk through the hidden 41.
      await page.locator('.recovery-problem-tag:visible').first().focus();
      for (let i = 0; i < FIRST_VISIBLE; i++) await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'empty-problem-toggle',
        `${name}: tabbing past the ninth task lands on the disclosure, not on hidden chips`);

      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(v => v.id), [], `${name}: axe violations in the collapsed empty state`);

      // Expanding reveals every task in the page flow, still without an inner scroll.
      await page.locator('#empty-problem-toggle').click();
      state = await chipsState(page);
      assert.equal(await visibleChips(page), total, `${name}: expanding shows every task`);
      assert.equal(state.expanded, 'true', `${name}: aria-expanded follows the disclosure`);
      assert.equal(state.innerScroll, false, `${name}: expanded directory stays in the page flow`);
      assert.equal(await page.locator('#empty-problem-rest').isVisible(), true, `${name}: the extra list is visible when expanded`);

      // Collapsing from a chip inside the expanded list must not drop focus.
      await page.locator('#empty-problem-rest .recovery-problem-tag').last().focus();
      await page.locator('#empty-problem-toggle').click();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'empty-problem-toggle',
        `${name}: collapsing returns focus to the disclosure button`);
      assert.equal(await visibleChips(page), FIRST_VISIBLE, `${name}: collapsing hides the tail again`);

      // A task from the hidden tail is still reachable and actually searches.
      await page.locator('#empty-problem-toggle').click();
      const last = page.locator('#empty-problem-rest .recovery-problem-tag').last();
      const term = await last.getAttribute('data-problem-tag');
      await last.click();
      await page.waitForFunction(() => !document.getElementById('copy-search-link').disabled);
      assert.equal(await page.locator('#query').inputValue(), term, `${name}: the chosen task becomes the query`);
      const count = await page.evaluate(() => Number((document.getElementById('results-count').textContent.match(/^顯示 (\d+) \//) || [])[1]));
      assert.ok(count > 0, `${name}: choosing a task outside the first nine finds cases`);
      assert.deepEqual(errors, [], `${name}: no page errors`);
      report.push({ name, width, height, total, visibleBefore: FIRST_VISIBLE, chosen: term, results: count });
      await context.close();
    }

    // Wide screens use the same disclosure: nine chips keep the dead-end panel
    // shorter than the old 300px scroll box, and every task is one click away.
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await openEmpty(page);
      const total = await totalChips(page);
      const state = await chipsState(page);
      assert.equal(await visibleChips(page), FIRST_VISIBLE, 'desktop: nine tasks before expanding');
      assert.equal(state.toggleHidden, false, 'desktop: the disclosure button must be visible');
      assert.equal(state.expanded, 'false', 'desktop: the directory starts collapsed');
      assert.equal(state.innerScroll, false, 'desktop: the directory must not scroll inside itself');
      assert.equal(state.overflow, 0, 'desktop: no horizontal overflow');
      assert.ok(state.height <= 400, `desktop: collapsed directory is ${state.height}px`);
      const collapsedHeight = state.height;
      await page.locator('#empty-problem-toggle').click();
      assert.equal(await visibleChips(page), total, 'desktop: expanding shows every task');
      assert.equal((await chipsState(page)).innerScroll, false, 'desktop: expanded directory stays in the page flow');
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(v => v.id), [], 'desktop: axe violations in the empty state');
      assert.deepEqual(errors, [], 'desktop: no page errors');
      report.push({ name: 'desktop', width: 1440, height: 900, total, visibleBefore: FIRST_VISIBLE, collapsedHeight });
      await context.close();
    }

    console.log('PASS empty task directory:', JSON.stringify(report));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
