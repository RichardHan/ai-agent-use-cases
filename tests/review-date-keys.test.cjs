'use strict';
// A review date the extractor does not know is dropped in silence: the detail
// badge keeps an older 「頁首核對」 than the same lead block writes two lines
// above, and `?sort=reviewed` files the page behind cases it is newer than.
// Nine pages wrote 「- 本次增補查證：」 and none of them was read until this check
// existed. The corpus may keep inventing spellings; this test refuses to let the
// next one disappear without a diff that says so.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const REVIEW_ACTION = /(?:查證|查閱|核對|查核)/;
const DATE = /\b20\d{2}-\d{2}-\d{2}\b/;

function load() {
  const context = vm.createContext({ URL, Discovery: require('../assets/discovery.js') });
  vm.runInContext(
    fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0]
      + '\nthis.api={reviewDate};',
    context
  );
  return context.api;
}

function corpus() {
  return ['cases', 'evidence']
    .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
    .map(file => ({ file, markdown: fs.readFileSync(path.join(root, file), 'utf8') }));
}

const leadOf = markdown => markdown.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];
// Same field boundary the extractor uses: a body line is not a lead line, so a
// `- 查證日期：` under `## 來源` never dates the page.
const reviewLines = markdown => leadOf(markdown)
  .split('\n')
  .map(line => ({ line, key: line.match(/^-\s*([^：:]{1,40})[：:]/)?.[1].trim() || '' }))
  .filter(({ key }) => REVIEW_ACTION.test(key));

test('a lead key that names a review never loses its date in silence', () => {
  const { reviewDate } = load();
  const unread = [];
  const seen = new Set();
  for (const { file, markdown } of corpus()) {
    for (const { line, key } of reviewLines(markdown)) {
      const dates = (line.match(/\b20\d{2}-\d{2}-\d{2}\b/g) || []).filter(date => {
        const parsed = new Date(date + 'T00:00:00Z');
        return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
      });
      if (!dates.length) continue; // 「尚未查證」 lines carry no date, so nothing is lost
      seen.add(key);
      const expected = dates.sort().pop();
      const actual = reviewDate('# 案例\n' + line);
      if (actual !== expected) unread.push(`${file} 「${key}」 ${line.trim()} → ${actual || '(未讀)'}，應為 ${expected}`);
    }
  }
  assert.deepEqual(
    unread,
    [],
    'A lead field that names a 查證/查閱/核對/查核 and carries a date must be read as the page-level '
      + 'review date. Add the spelling to REVIEW_DATE_KEY in assets/app.js, or — if it dates something '
      + 'other than this page — teach reviewDate to skip it explicitly, with the reason in a comment.'
  );
  // The guard is only worth its runtime if it actually covers the vocabulary the
  // corpus uses today; an empty scan would pass silently.
  for (const key of ['查證日期', '查閱日期', '核對日期', '研究核對日', '本次增補查證', '首次收錄／最近查證', '首次收錄、最近查證', '首次收錄／查證', '查證']) {
    assert.ok(seen.has(key), `corpus no longer uses 「${key}」; drop it from this list instead of leaving a dead assertion`);
  }
});

test('every page that writes 本次增補查證 carries the newest date its lead declares', () => {
  const { reviewDate } = load();
  const pages = corpus().filter(({ markdown }) => /^-\s*(?:本次)?增補查證\s*[：:]/m.test(leadOf(markdown)));
  // The count is not the contract: the corpus keeps adding supplemental reviews as
  // research batches amend existing pages. What must hold is that each one is read.
  assert.ok(pages.length >= 9, 'the corpus still declares supplemental reviews');
  for (const { file, markdown } of pages) {
    const supplementals = [...leadOf(markdown).matchAll(/^-\s*(?:本次)?增補查證\s*[：:]\s*(\d{4}-\d{2}-\d{2})/gm)].map(m => m[1]);
    assert.equal(
      supplementals.length,
      1,
      `${file}: lead must carry at most one 「本次增補查證」 line (found ${supplementals.join(', ')})`
    );
    const supplemental = supplementals[0];
    const actual = reviewDate(markdown);
    assert.equal(
      actual,
      supplemental,
      `${file}: 「本次增補查證」 (${supplemental}) must match the newest review date the lead declares (${actual || '(未讀)'})`
    );
  }
});
