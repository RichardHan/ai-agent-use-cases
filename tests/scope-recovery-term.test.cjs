'use strict';
// The no-purpose notice offers one of the words the visitor typed as a way out.
// It used to offer the word with the *most* matches: "隱私審查" → "審查 → 61 筆"
// and "我想讓 AI 幫我整理會議紀錄" → "讓 → 273 筆". Both sent the reader to a
// larger, less specific set than the task word already in their sentence.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];

class Node {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.textContent = ''; }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this[name] = value; }
}

const context = vm.createContext({
  URL,
  Discovery: require('../assets/discovery.js'),
  document: { createElement: tag => new Node(tag), createTextNode: text => ({ textContent: text }) }
});
vm.runInContext(
  source + '\nthis.api={metadata,parseFile,filterEntries,norm,tokenize,searchExpansion,narrowestScopeTerm};',
  context
);
const api = context.api;

const files = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .concat('sources/pending.md');
const entries = files.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));

const rowsFor = terms => terms.map(term => ({
  term,
  scoped: api.filterEntries(entries, [term], { scope: 'overview' }).length,
  library: api.filterEntries(entries, [term], { scope: 'overview' }).length
}));

test('the recovery word is the narrowest positive set, not the widest', () => {
  const rows = [
    { term: '讓', scoped: 273 },
    { term: 'ai', scoped: 71 },
    { term: '整理', scoped: 129 },
    { term: '會議', scoped: 14 },
    { term: '筆記', scoped: 19 }
  ];
  const chosen = api.narrowestScopeTerm(rows, rows.map(row => row.term), 'scoped');
  assert.equal(chosen.term, '會議', 'the task word wins over the grammar word');
  assert.equal(chosen.scoped, 14, 'the returned count is the one the button will promise');
});

test('a one-character Chinese crumb is never offered as a search', () => {
  const rows = [{ term: '的', scoped: 2 }, { term: '發票', scoped: 8 }];
  assert.equal(api.narrowestScopeTerm(rows, ['的', '發票'], 'scoped').term, '發票');
  assert.equal(api.narrowestScopeTerm([{ term: '的', scoped: 2 }], ['的'], 'scoped'), null,
    'when the only candidate is a crumb, no action is offered');
});

test('zero-match words do not become the recovery', () => {
  const rows = [{ term: '不存在', scoped: 0 }, { term: '合約', scoped: 4 }];
  assert.equal(api.narrowestScopeTerm(rows, ['不存在', '合約'], 'scoped').term, '合約');
  assert.equal(api.narrowestScopeTerm([{ term: '不存在', scoped: 0 }], ['不存在'], 'scoped'), null);
});

test('a filter that excludes every scoped word falls back to the narrowest library word', () => {
  // renderSearchFeedback() sets resetFilters = !scopedBest and then uses the
  // library counts, so the same narrowest rule has to hold for that key too.
  const rows = [
    { term: '隱私', scoped: 0, library: 9 },
    { term: '審查', scoped: 0, library: 61 }
  ];
  assert.equal(api.narrowestScopeTerm(rows, ['隱私', '審查'], 'scoped'), null);
  const fallback = api.narrowestScopeTerm(rows, ['隱私', '審查'], 'library');
  assert.equal(fallback.term, '隱私', 'clearing filters must not fall back to the widest word');
  assert.equal(fallback.library, 9);
});

test('equal sets prefer the longer word, then the order the visitor typed', () => {
  const longer = api.narrowestScopeTerm([{ term: '客訴信', scoped: 5 }, { term: '抱怨', scoped: 5 }], ['客訴信', '抱怨'], 'scoped');
  assert.equal(longer.term, '客訴信');
  const same = api.narrowestScopeTerm([{ term: '客戶', scoped: 5 }, { term: '客訴', scoped: 5 }], ['客戶', '客訴'], 'scoped');
  assert.equal(same.term, '客戶');
});

test('real questions no longer offer the grammar word', () => {
  const cases = [
    { query: '隱私審查', forbidden: '審查' },
    { query: '我想讓 AI 幫我整理會議紀錄', forbidden: '讓' },
    { query: '出差報銷', forbidden: '報銷' }
  ];
  for (const { query, forbidden } of cases) {
    const terms = api.tokenize(query);
    const expansion = api.searchExpansion(entries, query, terms, {});
    const searchTerms = expansion ? expansion.terms : terms;
    const rows = rowsFor(searchTerms);
    const chosen = api.narrowestScopeTerm(rows, searchTerms, 'scoped');
    assert.ok(chosen, `${query}: a recovery word exists`);
    assert.notEqual(chosen.term, forbidden, `${query}: the wider grammar word is not offered`);
    const positive = rows.filter(row => row.scoped > 0).map(row => row.scoped);
    assert.equal(chosen.scoped, Math.min(...positive), `${query}: the offer is the narrowest positive set`);
  }
});

test('the offered count is the count that word really shows', () => {
  for (const query of ['隱私審查', '播客摘要', '寫履歷']) {
    const terms = api.tokenize(query);
    const expansion = api.searchExpansion(entries, query, terms, {});
    const searchTerms = expansion ? expansion.terms : terms;
    const chosen = api.narrowestScopeTerm(rowsFor(searchTerms), searchTerms, 'scoped');
    assert.ok(chosen, `${query}: a recovery word exists`);
    assert.equal(chosen.scoped, api.filterEntries(entries, [chosen.term], { scope: 'overview' }).length,
      `${query}: the promise is measured with the same scope the button applies`);
  }
});
