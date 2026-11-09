'use strict';
// A resolved pending lead can name more than one home, and so can a case page
// that was merged into another. P-004's 狀態 line merges the original posts into
// UC-101 and separately records UC-102, but parsing kept only the first id, so the
// badge, the handoff sentence and the only in-site button all named one case and
// the second was reachable only by leaving the site for GitHub.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];

function createElement(tag, className = '', textContent = '') {
  const node = {
    tagName: String(tag).toUpperCase(),
    className,
    textContent,
    children: [],
    dataset: {},
    attributes: {},
    append(...nodes) { for (const item of nodes) if (item) this.children.push(item); },
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    focus() {},
    scrollIntoView() {},
    setAttribute(key, value) { this.attributes[key] = String(value); },
    getAttribute(key) { return this.attributes[key] ?? null; }
  };
  node.replaceChildren = (...nodes) => { node.children = nodes.filter(Boolean); };
  return node;
}
const context = vm.createContext({
  URL,
  Discovery: require('../assets/discovery.js'),
  document: {
    createElement,
    createTextNode: text => ({ textContent: String(text) }),
    getElementById: () => createElement('div')
  }
});
vm.runInContext(source + '\nthis.api={parseFile,resolvedPendingNote,mergedDestinations,mergedDestinationText,card};', context);
const api = context.api;
vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);

const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(name => name.endsWith('.md'));
const caseEntries = caseFiles.flatMap(file => Array.from(api.parseFile('cases/' + file, fs.readFileSync(path.join(root, 'cases', file), 'utf8'))));
const caseIds = new Set(caseEntries.map(entry => entry.id));
const pendingEntries = Array.from(api.parseFile('sources/pending.md', fs.readFileSync(path.join(root, 'sources/pending.md'), 'utf8')));
const pending = id => pendingEntries.find(entry => entry.id === id);

test('every destination a pending lead records is kept, not only the first', () => {
  assert.deepEqual([...pending('P-004').mergedInto], ['UC-101', 'UC-102'],
    'sources/pending.md records UC-101 and UC-102 for P-004');
  assert.deepEqual([...pending('P-002').mergedInto], ['UC-028'],
    'P-002 names a single destination and must not gain a second one');
  for (const id of ['P-001', 'P-003']) {
    assert.notEqual(pending(id).resolved, true, `${id} is still an open lead`);
    assert.deepEqual([...pending(id).mergedInto], [], `${id} has no destination`);
  }
});

test('a comparison to another case is not a destination', () => {
  const markdown = [
    '# 待查來源',
    '',
    '## P-900：與既有案例比較的線索',
    '',
    '- 狀態：2026-10-20 已處理，與 UC-005 的分工差異見下。',
    '- 缺漏：沒有可讀產物。'
  ].join('\n');
  const [lead] = api.parseFile('sources/pending.md', markdown);
  assert.equal(lead.resolved, true, 'the dated 已處理 status is what marks a lead resolved');
  assert.deepEqual([...lead.mergedInto], [], 'naming UC-005 for comparison must not become a destination');
  assert.equal(api.resolvedPendingNote(lead), '',
    'a resolved lead with no recorded destination must not claim it was merged somewhere');
});

test('the status sentence names every destination and stays silent when there is none', () => {
  assert.match(api.resolvedPendingNote(pending('P-004')), /UC-101、UC-102/);
  assert.match(api.mergedDestinationText(pending('P-004')), /UC-101、UC-102/);
  assert.match(api.mergedDestinationText(pending('P-002')), /UC-028/);
  assert.doesNotMatch(api.mergedDestinationText(pending('P-002')), /UC-101/);
});

test('each destination exists as a case page', () => {
  for (const lead of pendingEntries) {
    for (const id of lead.mergedInto) assert.ok(caseIds.has(id), `${lead.id} points at ${id}, which is not a case page`);
  }
  for (const entry of caseEntries) {
    for (const id of entry.mergedInto) assert.ok(caseIds.has(id), `${entry.id} points at ${id}, which is not a case page`);
  }
});

test('the result card lists every destination', () => {
  const badge = api.card(pending('P-004')).children
    .flatMap(node => node.children || [])
    .flatMap(node => node.children || [])
    .find(node => node.className === 'kind');
  assert.ok(badge, 'the pending card keeps a kind badge');
  assert.match(badge.textContent, /UC-101、UC-102/, 'both destinations must be readable on the card');
  assert.doesNotMatch(badge.textContent, /undefined|null/);
});
