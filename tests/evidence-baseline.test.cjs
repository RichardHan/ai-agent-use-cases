'use strict';
// The site's own evidence metadata must match its source files: the audit card
// names the corpus its batch was measured on, and pending leads carry the file's
// review date without pretending it is a per-lead review.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const { parseSummary, statusText } = require('../assets/audit.js');

const batchText = (count, remaining, lines = '') => ({
  latestBatch: '2026-10-22 20:50 台灣時間增量核對\n\n- 嚴格合格 **' + count + '／1,000，尚差' + remaining +
    '**，不是目前全庫累計。\n' + lines
});
const corpusLine = size => '- 批次母體：' + size + ' 個主要案例頁\n';

test('the batch card names the corpus from the batch\'s own declared field', () => {
  const summary = parseSummary(batchText(370, 630, corpusLine(420)));
  assert.equal(summary.pageBase, 420);

  const text = statusText(summary);
  assert.match(text, /2026-10-22 20:50（台灣時間）/, 'the batch keeps its own timestamp');
  assert.match(text, /當時 420 個主要案例頁為母體/, 'the batch denominator is stated');
  assert.match(text, /不是目前全庫累計/, 'the snapshot is not presented as a running total');
  assert.doesNotMatch(text, /成功率|重現成功/, 'no success rate may be implied');
});

test('prose alone never becomes a corpus size', () => {
  const prose = batchText(370, 630, '- 主要案例頁420不是合格數；未重驗所有舊案。\n');
  const summary = parseSummary(prose);
  assert.equal(summary.pageBase, 0, 'a sentence is not a declared field');
  assert.doesNotMatch(statusText(summary), /母體/, 'no denominator is claimed without the field');
});

test('a missing, repeated or impossible corpus field is not used', () => {
  const cases = [
    [batchText(370, 630), 0, 'missing'],
    [batchText(370, 630, corpusLine(420) + corpusLine(500)), 0, 'two fields'],
    [batchText(370, 630, corpusLine(420) + corpusLine(420)), 0, 'field repeated'],
    [batchText(370, 630, corpusLine(0)), 0, 'zero'],
    [batchText(370, 630, corpusLine(369)), 0, 'smaller than the qualified count'],
    [batchText(370, 630, corpusLine(100001)), 0, 'implausibly large'],
    [batchText(370, 630, '- 批次母體：420 個主要案例頁；更正：實際母體是500頁\n'), 0, 'correction on the field line']
  ];
  for (const [value, expected, label] of cases) {
    const summary = parseSummary(value);
    assert.equal(summary.pageBase, expected, label);
    if (expected === 0) assert.doesNotMatch(statusText(summary), /母體/, label + ' must not reach the page');
  }
});

test('the repository batch declares one corpus field that agrees with its prose', () => {
  const source = fs.readFileSync(path.join(root, 'sources/qualification-audit-2026-10-16.md'), 'utf8');
  const latestBatch = source.split(/^## /m)[1];
  const summary = parseSummary({ latestBatch });
  assert.ok(summary, 'the current batch still parses');
  assert.equal(summary.pageBase, 420, 'the batch declares its 420-page corpus');
  assert.match(latestBatch, /主要案例頁420不是合格數/,
    'the declared field and the batch prose must state the same corpus');
});

class Node {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.textContent = '';
  }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this[name] = value; }
}

function loadAppApi() {
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: {
      createElement: tag => new Node(tag),
      createTextNode: text => ({ textContent: text })
    }
  });
  vm.runInContext(source + '\nthis.api={parseFile,resolvedPendingNote};', context);
  return context.api;
}

const pendingMarkdown = fs.readFileSync(path.join(root, 'sources/pending.md'), 'utf8');
const pendingEntries = () => Array.from(loadAppApi().parseFile('sources/pending.md', pendingMarkdown));

test('pending leads carry the file review date without borrowing it as their own', () => {
  const entries = pendingEntries();
  // The file declares 2026-10-16 and a 2026-10-17 17:45 supplement; the file-level
  // date is the last one. Pinned explicitly so a parser that picks the first date,
  // drops the header, or promotes it to reviewedDate fails here.
  assert.equal(entries.length, 4, 'every lead in the file is still listed');
  for (const entry of entries) {
    assert.equal(entry.fileReviewed, '2026-10-17', `${entry.id} must expose the file-level review date`);
    assert.equal(entry.reviewedDate, '', `${entry.id} has no per-lead review date and must not fake one`);
  }
});

test('a resolved lead explains its closure before quoting the open-lead warning', () => {
  const api = loadAppApi();
  const read = id => pendingEntries().find(entry => entry.id === id);
  const note = api.resolvedPendingNote(read('P-002'));
  assert.match(note, /已結束/, 'a merged lead is stated as finished');
  assert.match(note, /UC-028/, 'the note names the case it was merged into');
  assert.match(note, /尚待查證/, 'the note explains what the remaining warning describes');

  for (const id of ['P-001', 'P-003']) {
    assert.equal(api.resolvedPendingNote(read(id)), '', `${id} is still open and gets no closure note`);
  }
  assert.equal(api.resolvedPendingNote(undefined), '', 'a missing entry is not described as closed');
  assert.equal(api.resolvedPendingNote({ resolved: true }), '', 'a resolved entry without a destination claims nothing');
});
