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

const withBase = (count, remaining, base) => ({
  latestBatch: '2026-10-22 20:50 台灣時間增量核對\n\n- 嚴格合格 **' + count + '／1,000，尚差' + remaining +
    '**，不是目前全庫累計；' + (base === null ? '' : [].concat(base).map(size => '主要案例頁' + size + '不是合格數').join('；')) + '未重驗所有舊案。'
});

test('the batch card names the corpus the batch was measured on', () => {
  const summary = parseSummary(withBase(370, 630, 420));
  assert.equal(summary.pageBase, 420);

  const text = statusText(summary);
  assert.match(text, /2026-10-22 20:50（台灣時間）/, 'the batch keeps its own timestamp');
  assert.match(text, /當時 420 個主要案例頁為母體/, 'the batch denominator is stated');
  assert.match(text, /不是目前全庫累計/, 'the snapshot is not presented as a running total');
  assert.doesNotMatch(text, /成功率|重現成功/, 'no success rate may be implied');
});

test('a missing or impossible corpus size is not invented', () => {
  const missing = statusText(parseSummary(withBase(370, 630, null)));
  assert.doesNotMatch(missing, /母體/, 'no denominator is claimed when the batch has none');

  for (const base of [0, -1, 369, 1.5, 100001, '420<script>']) {
    const summary = parseSummary(withBase(370, 630, base));
    assert.equal(summary.pageBase, 0, `page base ${base} must be rejected`);
    assert.doesNotMatch(statusText(summary), /母體/, `page base ${base} must not reach the page`);
  }
});

test('a batch that states two different corpus sizes does not get to pick one', () => {
  for (const claims of [[420, 500], [420, 420]]) {
    const summary = parseSummary(withBase(370, 630, claims));
    if (claims[0] === claims[1]) assert.equal(summary.pageBase, 420, 'the same claim twice is one claim');
    else {
      assert.equal(summary.pageBase, 0, 'conflicting claims leave the corpus unknown');
      assert.doesNotMatch(statusText(summary), /母體/, 'no conflicting size reaches the page');
    }
  }
});

test('the repository batch exposes the corpus size it was measured against', () => {
  const source = fs.readFileSync(path.join(root, 'sources/qualification-audit-2026-10-16.md'), 'utf8');
  const latestBatch = source.split(/^## /m)[1];
  const summary = parseSummary({ latestBatch });
  assert.ok(summary, 'the current batch still parses');
  assert.ok(Number.isInteger(summary.pageBase) && summary.pageBase >= summary.count,
    `the batch corpus (${summary.pageBase}) must include every qualified case (${summary.count})`);
  assert.match(latestBatch, new RegExp('主要案例頁' + summary.pageBase + '不是合格數'),
    'the disclosed corpus size must be the one the source file declares');
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
  assert.equal(entries.length, 3, 'every lead in the file is still listed');
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
