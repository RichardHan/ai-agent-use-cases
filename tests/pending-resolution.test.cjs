'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];

class Node {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.textContent = '';
  }
  append(...children) {
    this.children.push(...children);
  }
  setAttribute(name, value) {
    this[name] = value;
  }
}

const context = vm.createContext({
  URL,
  Discovery: require('../assets/discovery.js'),
  document: {
    createElement: tag => new Node(tag),
    createTextNode: text => ({ textContent: text })
  }
});

vm.runInContext(
  source + '\nthis.api={metadata,parseFile,filterEntries,tokenize,catalogCounts};',
  context
);
const api = context.api;
vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);

const pendingMarkdown = fs.readFileSync(path.join(root, 'sources/pending.md'), 'utf8');
const pendingEntries = Array.from(api.parseFile('sources/pending.md', pendingMarkdown));

test('a pending lead resolved into a case is parsed as resolved with its destination', () => {
  const p002 = pendingEntries.find(entry => entry.id === 'P-002');
  assert.ok(p002, 'P-002 must be parsed from sources/pending.md');
  assert.equal(p002.resolved, true, 'P-002 states 已處理 and 已併入 UC-028, so it must be resolved');
  assert.equal(p002.mergedInto, 'UC-028', 'P-002 must point at the case it was merged into');

  for (const id of ['P-001', 'P-003']) {
    const entry = pendingEntries.find(item => item.id === id);
    assert.ok(entry, `${id} must be parsed`);
    assert.notEqual(entry.resolved, true, `${id} is still an open lead and must stay unresolved`);
    assert.equal(entry.mergedInto, null, `${id} has no merged destination`);
  }
});

test('the pending counter counts open leads, matching the source document and the static index', () => {
  const counts = api.catalogCounts(pendingEntries);
  assert.equal(counts.pending, 2, 'only P-001 and P-003 remain open leads');
  assert.equal(counts.resolvedPending, 1, 'P-002 is reported separately instead of being dropped');
  assert.equal(counts.pending + counts.resolvedPending, pendingEntries.length, 'every lead is either open or reported as resolved');

  const index = fs.readFileSync(path.join(root, 'INDEX.md'), 'utf8');
  const indexLine = index.match(/## 待查來源（(\d+)，另 P-002 已處理）/);
  assert.ok(indexLine, 'INDEX.md keeps the pending heading');
  assert.equal(Number(indexLine[1]), counts.pending, 'the site counter and INDEX.md must use the same rule');
});

test('the 還在查證 filter keeps every lead reachable while marking the resolved one', () => {
  // Hiding the merged lead would break the facet total (503 + 3 + 2 ≠ 509) and
  // make it unreachable from the filter, so it stays listed with its state.
  const listed = api.filterEntries(pendingEntries, [], { kind: 'pending' });
  assert.deepEqual(listed.map(entry => entry.id), ['P-001', 'P-002', 'P-003']);
  assert.deepEqual(listed.filter(entry => entry.resolved).map(entry => entry.id), ['P-002']);
  assert.equal(listed.find(entry => entry.id === 'P-002').mergedInto, 'UC-028');

  const terms = Array.from(api.tokenize('電信帳單'));
  const found = api.filterEntries(pendingEntries, terms, {});
  assert.ok(found.some(entry => entry.id === 'P-002'), 'the merged lead must remain findable by its own text');
});

test('catalog counts separate case, evidence and pending entries', () => {
  const items = [
    { kind: 'case' }, { kind: 'case' },
    { kind: 'evidence' },
    { kind: 'pending' }, { kind: 'pending', resolved: true }
  ];
  const counts = api.catalogCounts(items);
  assert.equal(counts.case, 2);
  assert.equal(counts.evidence, 1);
  assert.equal(counts.pending, 1);
  assert.equal(counts.resolvedPending, 1);
});
