'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
class Node { constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.textContent = ''; } append(...children) { this.children.push(...children); } }
const context = vm.createContext({
  URL,
  Discovery: require('../assets/discovery.js'),
  document: { createElement: tag => new Node(tag), createTextNode: text => ({ textContent: text }) }
});
vm.runInContext(source + '\nthis.api={metadata,parseFile,mapConcurrent,loadCorpus};', context);
const api = context.api;

test('mapConcurrent respects concurrency limit and preserves ordering', async () => {
  let activeWorkers = 0;
  let maxActive = 0;
  const items = Array.from({ length: 25 }, (_, i) => i);
  const limit = 4;

  const results = await api.mapConcurrent(items, limit, async (item) => {
    activeWorkers++;
    maxActive = Math.max(maxActive, activeWorkers);
    await new Promise(r => setTimeout(r, (item % 5) * 2 + 1));
    activeWorkers--;
    return item * 2;
  });

  assert.equal(maxActive <= limit, true, `maxActive (${maxActive}) should be <= limit (${limit})`);
  assert.deepEqual(Array.from(results), items.map(x => x * 2), 'results should match in exact item order');
});

test('mapConcurrent handles empty arrays and boundary limits', async () => {
  assert.deepEqual(Array.from(await api.mapConcurrent([], 5, async () => 1)), []);
  assert.deepEqual(Array.from(await api.mapConcurrent([1, 2], 0, async x => x)), [1, 2]);
  assert.deepEqual(Array.from(await api.mapConcurrent([1, 2], 50, async x => x + 10)), [11, 12]);
});

test('loadCorpus isolates single-file failure and preserves remaining cases', async () => {
  const paths = [
    'cases/001-travel-checkout.md',
    'cases/002-missing-file.md',
    'cases/003-network-error.md',
    'cases/004-valid-case.md'
  ];

  const mockFetch = async (url) => {
    if (url === 'cases/001-travel-checkout.md') {
      return { ok: true, status: 200, text: async () => '# UC-001：旅遊比價與結帳\n\n- 情境：生活\n- 分類：旅遊\n- 核心目標：結帳' };
    }
    if (url === 'cases/002-missing-file.md') {
      return { ok: false, status: 404, text: async () => 'Not found' };
    }
    if (url === 'cases/003-network-error.md') {
      throw new Error('Connection reset');
    }
    if (url === 'cases/004-valid-case.md') {
      return { ok: true, status: 200, text: async () => '# UC-004：日常自動化\n\n- 情境：工作\n- 分類：生產力\n- 核心目標：自動化' };
    }
    throw new Error('Unexpected URL ' + url);
  };

  const { entries, failed } = await api.loadCorpus(paths, { fetch: mockFetch, concurrency: 2 });

  assert.equal(entries.length, 2, 'should keep 2 valid cases');
  assert.deepEqual(Array.from(entries).map(e => e.id), ['UC-001', 'UC-004']);
  assert.deepEqual(Array.from(failed), ['cases/002-missing-file.md', 'cases/003-network-error.md']);
});

test('loadCorpus reports zero entries when all files fail', async () => {
  const paths = ['cases/bad1.md', 'cases/bad2.md'];
  const mockFetch = async () => ({ ok: false, status: 500, text: async () => 'Server error' });

  const { entries, failed } = await api.loadCorpus(paths, { fetch: mockFetch, concurrency: 2 });
  assert.equal(entries.length, 0);
  assert.deepEqual(Array.from(failed), paths);
});
