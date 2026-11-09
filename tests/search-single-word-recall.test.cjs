'use strict';
// A visitor who types one common word must be able to find the cases that use
// that word. Several phrase rewrites used to apply to the bare word and replace
// it with an AND of other words (失敗 → 做不好+降級, 詐騙 → 留言+審查,
// 派工 → 調度+重活), so a case tagged 失敗 was invisible to a search for 失敗.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8')
  .split('/* Browser event bindings. */')[0];

function setupEnvironment() {
  function createElement(tag) {
    return {
      tagName: String(tag).toUpperCase(), className: '', textContent: '', children: [], dataset: {}, attributes: {}, style: {}, open: false, value: '',
      append(...nodes) { this.children.push(...nodes); }, appendChild(node) { this.children.push(node); return node; },
      addEventListener() {}, removeEventListener() {}, setAttribute(key, value) { this.attributes[key] = value; },
      getAttribute(key) { return this.attributes[key]; }, querySelector() { return createElement('div'); }, querySelectorAll() { return []; },
      insertBefore(node) { this.children.push(node); return node; }, remove() {}, replaceChildren() {}, focus() {}, click() {}, showModal() {},
      get lastChild() { return this.children[this.children.length - 1]; }
    };
  }
  const documentMock = {
    createElement, createTextNode: text => ({ tagName: '#text', textContent: String(text) }),
    getElementById: () => createElement('div'), querySelector: () => createElement('div'), querySelectorAll: () => [],
    addEventListener() {}, body: createElement('body'), documentElement: createElement('html')
  };
  const context = vm.createContext({
    document: documentMock,
    window: { document: documentMock },
    console,
    URL,
    URLSearchParams,
    crypto: { randomUUID: () => 'single-word-recall' },
    location: { href: 'https://example.test/ai-agent-use-cases/' },
    history: { state: null, pushState() {}, replaceState() {} },
    Discovery: require('../assets/discovery.js'),
    displayCopy: JSON.parse(fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8')),
    activeScenario: ''
  });
  vm.runInContext(appSource + '\nthis.api={tokenize,filterEntries,rankEntries,termVariants,metadata,parseFile};', context);
  return context.api;
}

function loadCorpus(api) {
  const entries = [];
  for (const folder of ['cases', 'evidence']) {
    for (const file of fs.readdirSync(path.join(root, folder)).filter(name => name.endsWith('.md')).sort()) {
      const relative = `${folder}/${file}`;
      entries.push(api.metadata(fs.readFileSync(path.join(root, relative), 'utf8'), relative, folder === 'evidence' ? 'evidence' : 'case'));
    }
  }
  const pending = path.join(root, 'sources/pending.md');
  if (fs.existsSync(pending)) entries.push(...api.parseFile('sources/pending.md', fs.readFileSync(pending, 'utf8')));
  return entries;
}

test('a single indexed word survives tokenisation instead of becoming an AND of other words', () => {
  const api = setupEnvironment();
  assert.deepEqual(Array.from(api.tokenize('失敗')), ['失敗']);
  assert.deepEqual(Array.from(api.tokenize('詐騙')), ['詐騙']);
  assert.deepEqual(Array.from(api.tokenize('派工')), ['派工']);
  assert.deepEqual(Array.from(api.tokenize('公開資料')), ['公開資料']);
  assert.deepEqual(Array.from(api.tokenize('數據儀表板')), ['數據', '儀表板']);
  assert.deepEqual(Array.from(api.tokenize('重活')), ['重活']);
});

test('the phrases those rewrites exist for still collapse to their task words', () => {
  const api = setupEnvironment();
  const words = query => Array.from(api.tokenize(query));
  assert.deepEqual(words('做不好就降級'), ['做不好', '降級']);
  assert.deepEqual(words('只負責調度重活'), ['調度', '重活']);
  assert.deepEqual(words('重活交給雲端電腦'), ['重活', '雲端電腦']);
  assert.deepEqual(words('可疑留言'), ['留言', '審查']);
  assert.deepEqual(words('Grok Bot 讀公開新聞'), ['grok', 'bot', '公開', '新聞']);
  assert.deepEqual(words('分層派工'), ['分層', '派工', '額度']);
});

test('every case is retrievable by each of its own tags', () => {
  const api = setupEnvironment();
  const entries = loadCorpus(api);
  const misses = [];
  for (const entry of entries) {
    for (const tag of entry.tags || []) {
      if (!tag || tag.length < 2) continue;
      const terms = Array.from(api.tokenize(tag));
      if (!terms.length) continue;
      if (!api.filterEntries(entries, terms, {}).some(hit => hit.id === entry.id)) misses.push(`${entry.id}「${tag}」→ ${terms.join('+')}`);
    }
  }
  assert.deepEqual(misses, [], 'these cases cannot be found by their own tag: ' + misses.slice(0, 10).join('; '));
});

test('the failure cases the site advertises are reachable from 失敗', () => {
  const api = setupEnvironment();
  const entries = loadCorpus(api);
  const terms = Array.from(api.tokenize('失敗'));
  const hits = api.filterEntries(entries, terms, {});
  const ids = hits.map(hit => hit.id);
  assert.ok(hits.length >= 30, `失敗 should reach the corpus of failure cases, got ${hits.length}`);
  for (const id of ['UC-159', 'UC-169', 'UC-362']) assert.ok(ids.includes(id), `失敗 must reach ${id}`);
  const ranked = api.rankEntries(hits, terms);
  assert.ok((ranked[0].tags || []).some(tag => tag.includes('失敗')), 'the first 失敗 result should carry the tag');
});

test('scam and dispatch words reach their own cases rather than unrelated review words', () => {
  const api = setupEnvironment();
  const entries = loadCorpus(api);
  const find = query => api.filterEntries(entries, Array.from(api.tokenize(query)), {}).map(hit => hit.id);
  assert.ok(find('詐騙').includes('UC-275'), '詐騙 must reach the scam-call case');
  assert.ok(find('派工').includes('UC-061'), '派工 must reach the dispatch-window case');
  assert.ok(find('數據儀表板').includes('UC-459'), '數據儀表板 must reach the dashboard case');
});
