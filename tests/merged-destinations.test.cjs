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
vm.runInContext(source + '\nthis.api={parseFile,resolvedPendingNote,mergedDestinations,mergedDestinationText,card,pendingStateBadge,cardKindBadge,resolvedPendingTally,copyNoteText,mergeHandoffSentence};', context);
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
  const note = api.resolvedPendingNote(lead);
  assert.match(note, /已結束/, 'the closure is still stated');
  assert.match(note, /未記錄併入的主案例/, 'the note names the missing destination');
  assert.doesNotMatch(note, /已併入\s*(?:（|$|[，。、])/, 'it must not claim a merge with no destination');
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

// The merged round (#305) kept the destination list, but a lead marked handled
// without naming a case still printed "已併入 " with nothing after it, lost its
// closure note, and let the statistics call it a merge. These pin the honest state.
test('a handled lead with no recorded destination says so instead of printing an empty list', () => {
  const markdown = [
    '# 待查來源',
    '',
    '## P-901：已處理但沒有編號的線索',
    '',
    '- 狀態：2026-11-10 已處理。內容重複，已整理不再重查。',
    '- 缺漏：原帖沒有保留併入的案例編號。'
  ].join('\n');
  const [lead] = api.parseFile('sources/pending.md', markdown);
  assert.equal(lead.resolved, true);
  assert.deepEqual([...lead.mergedInto], []);

  const badge = api.pendingStateBadge(lead);
  const card = api.card(lead).children.flatMap(node => node.children || []).flatMap(node => node.children || [])
    .find(node => node.className === 'kind');
  const note = api.resolvedPendingNote(lead);
  for (const [surface, text] of [['detail badge', badge], ['card badge', card.textContent], ['closure note', note]]) {
    assert.doesNotMatch(text, /null|undefined|NaN/, `${surface} must not print a placeholder: ${text}`);
    assert.doesNotMatch(text, /已併入\s*(?:（|$|[，。、])/, `${surface} must not claim a merge with no destination: ${text}`);
  }
  assert.match(badge, /已處理/);
  assert.match(badge, /未記錄併入案例/, 'the detail badge names the missing destination');
  assert.match(card.textContent, /不另計數/, 'the card still explains why the entry is not counted');
  assert.match(note, /已結束/);
  assert.match(note, /未記錄併入的主案例/);
});

test('the statistics only count recorded merges as merges', () => {
  const tally = api.resolvedPendingTally(pendingEntries);
  assert.deepEqual({ ...tally }, { resolved: 2, merged: 2, unrecorded: 0 });
  const mixed = api.resolvedPendingTally([
    ...pendingEntries,
    { kind: 'pending', resolved: true, mergedInto: [] }
  ]);
  assert.deepEqual({ ...mixed }, { resolved: 3, merged: 2, unrecorded: 1 });
});

test('a copied note carries the closure state instead of reading like an open lead', () => {
  const merged = api.copyNoteText(pending('P-004'), 'https://example.test/?case=P-004');
  assert.match(merged, /🔁 狀態：已併入 UC-101、UC-102，不另計一案/);
  const open = api.copyNoteText(pending('P-001'), 'https://example.test/?case=P-001');
  assert.doesNotMatch(open, /🔁 狀態/, 'an open lead has no closure state to report');
  const unrecorded = api.copyNoteText({ id: 'P-901', title: 'x', what: 'y', resolved: true, mergedInto: [] }, 'u');
  assert.match(unrecorded, /🔁 狀態：已處理，來源檔未記錄併入案例/);
});

test('a title that only describes merging records is not a merge declaration', () => {
  const titleOnly = '# UC-994：合併 UC-993 重複資料的檢查\n\n- 情境：工作\n- 來源證據：`author-demo`。\n';
  assert.deepEqual([...api.parseFile('cases/994-test.md', titleOnly)[0].mergedInto], [],
    'the 已合併 form is the only title wording that declares a destination');
  const evidenceLine = '# UC-995：來源補充\n\n- 情境：工作\n- 來源證據：重複流程；合併UC-993，不另計。\n';
  assert.deepEqual([...api.parseFile('cases/995-test.md', evidenceLine)[0].mergedInto], ['UC-993'],
    'the evidence line keeps its loose 合併 form, as UC-250 writes it');
});
