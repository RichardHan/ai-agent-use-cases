'use strict';
// A page that declared its goal as "- 目標：" or "- 問題：" used to lose that
// sentence everywhere: no 🎯 card line and no 核心目標 section. Pages with no
// declaration were silent, which reads the same as "nothing to solve". This check
// holds the card and the reader to one helper: declared pages print their own
// sentence, section pages point at the section they wrote, and the rest say the
// goal is not declared. Three widths, axe/overflow/page-error gates.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const origin = process.env.CORE_GOAL_URL || 'http://127.0.0.1:8081/ai-agent-use-cases/';
const axe = page => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
const overflow = page => page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

const DECLARED_GOAL = '把『幫我加功能』變成可驗收的開發交接，避免PR建立就被當作全部完成。';

const openCase = async (page, id) => {
  await page.goto(`${origin}?case=${id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#detail[open]', { timeout: 90000 });
  await page.waitForFunction(() => document.querySelector('#detail .plain-overview'), { timeout: 90000 });
};

const openCard = async (page, id) => {
  await page.goto(`${origin}?q=${id}#explore`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#results .card', { timeout: 90000 });
};

const readGoal = page => page.evaluate(() => {
  const section = document.querySelector('#detail .detail-core-goal');
  const note = document.querySelector('#detail .detail-core-goal-source');
  return {
    section: section ? {
      source: section.dataset.coreGoalSource || '',
      heading: section.querySelector('h2')?.textContent.trim() || '',
      text: section.querySelector('p')?.textContent.trim() || ''
    } : null,
    note: note ? {
      source: note.dataset.coreGoalSource || '',
      text: note.textContent.trim() || '',
      fontSize: parseFloat(getComputedStyle(note).fontSize),
      insidePurpose: Boolean(note.closest('.plain-overview section')),
      // The note must read as a note, not as a goal headline.
      isHeading: Boolean(note.closest('.detail-core-goal'))
    } : null
  };
});

const readCardGoal = page => page.evaluate(() => {
  const card = document.querySelector('#results .card');
  const line = card?.querySelector('.card-goal');
  return {
    present: Boolean(line),
    source: line?.dataset.coreGoalSource || '',
    text: line?.textContent.trim() || ''
  };
});

(async () => {
  const browser = await chromium.launch();
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844], ['small', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));

      // 1. A goal declared as "- 目標：" is the page's own sentence and must appear
      //    in the reader and on the card, labelled as declared.
      await openCase(page, 'UC-005');
      const declared = await readGoal(page);
      assert.ok(declared.section, `${name}: UC-005 declares a goal under 目標`);
      assert.equal(declared.section.source, 'declared', `${name}: the section names its source`);
      assert.equal(declared.section.heading, '核心目標', `${name}: the section keeps the reader's heading`);
      assert.equal(declared.section.text, DECLARED_GOAL, `${name}: the page's own sentence is shown verbatim`);
      assert.equal(declared.note, null, `${name}: a declared goal needs no gap note`);
      assert.equal(await overflow(page), false, `${name}: no horizontal overflow on the declared page`);
      assert.deepEqual((await axe(page)).violations.map(v => v.id), [], `${name}: axe clean on the declared page`);

      await openCard(page, 'UC-005');
      const declaredCard = await readCardGoal(page);
      assert.ok(declaredCard.present, `${name}: the card shows the declared goal`);
      assert.equal(declaredCard.source, 'declared', `${name}: the card line names its source`);
      assert.ok(declaredCard.text.startsWith('🎯 解決痛點：'), `${name}: the card keeps the reader's label`);
      assert.ok(declaredCard.text.includes('可驗收的開發交接'), `${name}: the card sentence is the page's own (${declaredCard.text})`);

      // 2. A page that writes the problem in a "## 問題…" section gets a pointer
      //    to that section, never a goal sentence the library wrote.
      await openCase(page, 'UC-101');
      const section = await readGoal(page);
      assert.equal(section.section, null, `${name}: a section-only page gets no 核心目標 section`);
      assert.ok(section.note, `${name}: a section-only page still says where the problem is`);
      assert.equal(section.note.source, 'section', `${name}: the note names the section source`);
      assert.ok(section.note.text.includes('〈問題與作者實際使用〉'), `${name}: the note quotes the page's section title (${section.note.text})`);
      assert.ok(section.note.text.includes('未在頁首宣告核心目標'), `${name}: the note says the page declares none`);
      assert.equal(section.note.insidePurpose, true, `${name}: the note sits with 可以幫你做什麼`);
      assert.equal(section.note.isHeading, false, `${name}: the note is not dressed up as a goal`);
      assert.ok(section.note.fontSize >= 12, `${name}: the note is readable (${section.note.fontSize}px)`);
      assert.equal(await overflow(page), false, `${name}: no horizontal overflow on the section page`);

      await openCard(page, 'UC-101');
      assert.equal((await readCardGoal(page)).present, false, `${name}: no 🎯 line for a page with no declared goal`);

      // 3. A page with neither declaration names the gap instead of dropping it.
      await openCase(page, 'UC-017');
      const missing = await readGoal(page);
      assert.equal(missing.section, null, `${name}: a page without a goal gets no invented section`);
      assert.ok(missing.note, `${name}: the gap is named`);
      assert.equal(missing.note.source, 'missing', `${name}: the note names the missing declaration`);
      assert.ok(missing.note.text.includes('未宣告核心目標'), `${name}: the gap says what is missing`);
      assert.equal(await overflow(page), false, `${name}: no horizontal overflow on the undeclared page`);
      assert.deepEqual((await axe(page)).violations.map(v => v.id), [], `${name}: axe clean on the undeclared page`);

      assert.deepEqual(errors, [], `${name}: no page errors`);
      await context.close();
      console.log(`${name}: goal provenance ok`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
