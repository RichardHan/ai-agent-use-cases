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
  assert.deepEqual(Array.from(p002.mergedInto), ['UC-028'], 'P-002 must point at the case it was merged into');

  const p004 = pendingEntries.find(entry => entry.id === 'P-004');
  assert.ok(p004, 'P-004 must be parsed as its own lead, not as a paragraph inside P-003');
  assert.equal(p004.resolved, true, 'P-004 states 已處理 and 已併入 UC-101, so it must be resolved');
  assert.deepEqual(Array.from(p004.mergedInto), ['UC-101', 'UC-102'], 'P-004 names two destinations in its own status line, so the site must carry both');

  for (const id of ['P-001', 'P-003']) {
    const entry = pendingEntries.find(item => item.id === id);
    assert.ok(entry, `${id} must be parsed`);
    assert.notEqual(entry.resolved, true, `${id} is still an open lead and must stay unresolved`);
    assert.deepEqual(Array.from(entry.mergedInto), [], `${id} has no merged destination`);
  }
});

test('the pending counter counts open leads, matching the source document and the static index', () => {
  const counts = api.catalogCounts(pendingEntries);
  assert.equal(counts.pending, 2, 'only P-001 and P-003 remain open leads');
  assert.equal(counts.resolvedPending, 2, 'P-002 and P-004 are reported separately instead of being dropped');
  assert.equal(counts.pending + counts.resolvedPending, pendingEntries.length, 'every lead is either open or reported as resolved');

  const index = fs.readFileSync(path.join(root, 'INDEX.md'), 'utf8');
  const indexLine = index.match(/## 待查來源（(\d+)，另 P-002、P-004 已處理）/);
  assert.ok(indexLine, 'INDEX.md keeps the pending heading');
  assert.equal(Number(indexLine[1]), counts.pending, 'the site counter and INDEX.md must use the same rule');
});

test('the 待查線索 filter keeps every lead reachable while marking the resolved one', () => {
  // Hiding the merged lead would break the facet total (503 + 3 + 2 ≠ 509) and
  // make it unreachable from the filter, so it stays listed with its state.
  const listed = api.filterEntries(pendingEntries, [], { kind: 'pending' });
  assert.deepEqual(listed.map(entry => entry.id), ['P-001', 'P-002', 'P-003', 'P-004']);
  assert.deepEqual(listed.filter(entry => entry.resolved).map(entry => entry.id), ['P-002', 'P-004']);
  assert.deepEqual(Array.from(listed.find(entry => entry.id === 'P-002').mergedInto), ['UC-028']);

  const terms = Array.from(api.tokenize('電信帳單'));
  const found = api.filterEntries(pendingEntries, terms, {});
  assert.ok(found.some(entry => entry.id === 'P-002'), 'the merged lead must remain findable by its own text');
});

test('the old pending terms still find every pending record through the search index', () => {
  for (const term of ['還在查證', '待查想法', '待查線索']) {
    const found = api.filterEntries(pendingEntries, Array.from(api.tokenize(term)), {});
    assert.deepEqual(found.map(entry => entry.id).sort(), ['P-001', 'P-002', 'P-003', 'P-004'], `${term} must still find all pending records`);
  }
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
