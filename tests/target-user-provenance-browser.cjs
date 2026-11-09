'use strict';
// An undeclared audience used to be replaced by one of six library personas and
// printed as 「👤 適合對象」, i.e. the page appeared to declare who it is for.
// This check holds the card and the reader to the same split: a declared page
// keeps its own sentence, an undeclared page says the persona is the library's
// scenario default, at three widths and with axe/overflow/page-error gates.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const origin = process.env.TARGET_USER_URL || 'http://127.0.0.1:8081/ai-agent-use-cases/';
const axe = page => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
const overflow = page => page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

const readDetail = page => page.evaluate(() => {
  const section = document.querySelector('.detail-target-user');
  if (!section) return null;
  const heading = section.querySelector('h2');
  return {
    source: section.dataset.targetUserSource || '',
    heading: heading?.textContent.trim() || '',
    text: section.querySelector('p')?.textContent.trim() || '',
    note: section.querySelector('.detail-target-user-source')?.textContent.trim() || '',
    noteBox: (() => {
      const el = section.querySelector('.detail-target-user-source');
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return { width: Math.round(box.width), fontSize: parseFloat(getComputedStyle(el).fontSize) };
    })(),
    sectionText: section.innerText.replace(/\s+/g, ' ').trim()
  };
});

const readCard = page => page.evaluate(() => {
  const card = document.querySelector('#results .card');
  if (!card) return null;
  const row = card.querySelector('.card-target-user');
  return {
    source: row?.dataset.targetUserSource || '',
    text: row?.textContent.trim() || '',
    aria: row?.getAttribute('aria-label') || '',
    title: row?.getAttribute('title') || '',
    cardHeight: Math.round(card.getBoundingClientRect().height)
  };
});

const openSearch = async (page, query) => {
  await page.goto(`${origin}?q=${encodeURIComponent(query)}#explore`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#results .card', { timeout: 90000 });
};

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844], ['small', 320, 740]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));

      // 1. A page that declares no audience must not claim one on the card.
      await openSearch(page, '整理');
      const declaredOnCard = await readCard(page);
      assert.ok(declaredOnCard, `${name}: the results list renders a card`);
      for (let i = 0; i < 24; i += 1) {
        const row = await page.evaluate(index => {
          const card = document.querySelectorAll('#results .card')[index];
          if (!card) return null;
          const target = card.querySelector('.card-target-user');
          return { source: target?.dataset.targetUserSource || '', text: target?.textContent.trim() || '', id: card.dataset.caseId || '' };
        }, i);
        if (!row) break;
        if (row.source === 'scenario') {
          assert.ok(row.text.includes('情境常見讀者：'), `${name}: an undeclared audience is labelled (${row.text})`);
          assert.ok(!row.text.includes('適合對象：'), `${name}: the library persona is not shown as a declared audience`);
        }
      }

      // 2. A declared page keeps its own sentence on the card and in the reader.
      await page.goto(`${origin}?q=UC-270#explore`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#results .card', { timeout: 90000 });
      const declared = await page.evaluate(() => {
        const card = document.querySelector('#results .card');
        if (!card) return null;
        const row = card.querySelector('.card-target-user');
        return { id: card.dataset.caseId, text: row?.textContent.trim() || '', aria: row?.getAttribute('aria-label') || '', source: row?.dataset.targetUserSource || '' };
      });
      assert.ok(declared, `${name}: the results list renders the declared-audience case`);
      assert.equal(declared.source, 'declared', `${name}: UC-270 declares its audience`);
      assert.ok(declared.text.includes('適合對象：'), `${name}: a declared page keeps the 適合對象 wording`);
      assert.ok(declared.aria.startsWith('適合對象，案例頁宣告：'), `${name}: the card names the claimant for screen readers`);

      await page.goto(`${origin}?case=${encodeURIComponent(declared.id)}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#detail[open]', { timeout: 90000 });
      const declaredDetail = await readDetail(page);
      assert.ok(declaredDetail, `${name}: the reader renders an audience section`);
      assert.equal(declaredDetail.source, 'declared', `${name}: the reader agrees with the card`);
      assert.equal(declaredDetail.heading, '適合對象');
      assert.ok(declaredDetail.note.includes('案例頁自行宣告適合對象'), `${name}: the reader states who made the claim`);
      assert.ok(!(await overflow(page)), `${name}: declared detail has no horizontal overflow`);
      assert.equal((await axe(page)).violations.length, 0, `${name}: declared detail axe violations`);

      // 3. A page without the field states the persona is the library default.
      await page.goto(`${origin}?case=UC-005`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#detail[open]', { timeout: 90000 });
      const fallback = await readDetail(page);
      assert.ok(fallback, `${name}: the reader still orients an undeclared page`);
      assert.equal(fallback.source, 'scenario');
      assert.equal(fallback.heading, '情境常見讀者');
      assert.ok(fallback.note.includes('案例頁未宣告適合對象'), `${name}: the reader says the page did not declare it (${fallback.note})`);
      assert.ok(fallback.note.includes('「開發」情境'), `${name}: the reader names the scenario the persona came from`);
      assert.ok(fallback.noteBox && fallback.noteBox.fontSize >= 12, `${name}: the disclosure is not hidden in tiny type (${fallback.noteBox && fallback.noteBox.fontSize}px)`);
      assert.ok(fallback.noteBox.width > 120, `${name}: the disclosure is readable, not clipped (${fallback.noteBox.width}px)`);
      assert.ok(!(await overflow(page)), `${name}: fallback detail has no horizontal overflow`);
      assert.equal((await axe(page)).violations.length, 0, `${name}: fallback detail axe violations`);
      assert.equal(errors.length, 0, `${name}: page errors: ${errors.join(' | ')}`);

      rows.push({
        name, width, height,
        declaredCase: declared.id, declaredCard: declared.text,
        fallbackHeading: fallback.heading, fallbackNote: fallback.note,
        cardHeight: declaredOnCard.cardHeight, axe: 0, pageErrors: errors.length
      });
      await context.close();
    }
    console.log('TARGET_USER ' + JSON.stringify(rows));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.stack || error); process.exit(1); });
