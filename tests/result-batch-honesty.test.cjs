'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function setup(total, initialVisible = 24) {
  const button = { hidden: false, textContent: '' };
  const appended = [];
  const results = {
    append(...nodes) { appended.push(...nodes); }
  };
  const context = vm.createContext({
    URL,
    location: { href: 'https://example.test/ai-agent-use-cases/#explore' },
    history: { state: {}, replaceState() {} },
    document: {
      getElementById: id => id === 'load-more-results' ? button : id === 'results' ? results : id === 'query' ? { value: '' } : null,
      createElement: tag => ({
        tagName: tag.toUpperCase(),
        dataset: {},
        children: [],
        append(...nodes) { this.children.push(...nodes); },
        addEventListener() {},
        querySelector: () => null
      }),
      createTextNode: text => ({ textContent: text })
    }
  });
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
  vm.runInContext(
    source +
    `\ncurrentFiltered = Array.from({ length: ${total} }, (_, i) => ({ id: 'UC-' + String(i + 1).padStart(3, '0'), title: 'Case ' + (i + 1), tags: [], tools: [] }));` +
    `\nvisibleResults = ${initialVisible};` +
    `\nresultCards = (items) => items.map(item => ({ dataset: { caseId: item.id }, querySelector: () => null }));` +
    `\nthis.api = { updateResultBatch, showMoreResults, ensureVisibleResult, getVisible: () => visibleResults, setVisible: v => { visibleResults = v; }, setTotal: n => { currentFiltered = Array.from({ length: n }, (_, i) => ({ id: 'UC-' + String(i + 1).padStart(3, '0') })); } };`,
    context
  );
  return { api: context.api, button, appended };
}

test('updateResultBatch aligns shown count, total matches, next batch size and remaining count', () => {
  // Full 527-entry collection: 24 shown, 24 next, 503 remaining
  const full = setup(527, 24);
  full.api.updateResultBatch();
  assert.equal(full.button.hidden, false);
  assert.equal(full.button.textContent, '已顯示 24 / 527 筆 · 再看 24 筆（尚有 503 筆）');

  // After advancing one batch: 48 shown, 24 next, 479 remaining
  full.api.showMoreResults();
  assert.equal(full.api.getVisible(), 48);
  assert.equal(full.button.hidden, false);
  assert.equal(full.button.textContent, '已顯示 48 / 527 筆 · 再看 24 筆（尚有 479 筆）');

  // Partial final batch (e.g. 36 matches on 旅遊): 24 shown, 12 next, 12 remaining
  const partial = setup(36, 24);
  partial.api.updateResultBatch();
  assert.equal(partial.button.hidden, false);
  assert.equal(partial.button.textContent, '已顯示 24 / 36 筆 · 再看 12 筆（尚有 12 筆）');

  // Completing the final batch hides the control and clears its text
  partial.api.showMoreResults();
  assert.equal(partial.api.getVisible(), 36);
  assert.equal(partial.button.hidden, true);
  assert.equal(partial.button.textContent, '');
});

test('updateResultBatch hides cleanly when all results fit or when narrowing leaves visibleResults ahead of matches', () => {
  const exact = setup(24, 24);
  exact.api.updateResultBatch();
  assert.equal(exact.button.hidden, true);
  assert.equal(exact.button.textContent, '');

  const narrowed = setup(48, 48);
  narrowed.api.setTotal(5);
  narrowed.api.updateResultBatch();
  assert.equal(narrowed.button.hidden, true);
  assert.equal(narrowed.button.textContent, '');

  const empty = setup(0, 24);
  empty.api.updateResultBatch();
  assert.equal(empty.button.hidden, true);
  assert.equal(empty.button.textContent, '');
});

test('ensureVisibleResult expands to the target batch boundary and updates the shown / total label', () => {
  const { api, button } = setup(100, 24);
  api.ensureVisibleResult('UC-031');
  assert.equal(api.getVisible(), 48);
  assert.equal(button.hidden, false);
  assert.equal(button.textContent, '已顯示 48 / 100 筆 · 再看 24 筆（尚有 52 筆）');

  api.ensureVisibleResult('UC-099');
  assert.equal(api.getVisible(), 100);
  assert.equal(button.hidden, true);
  assert.equal(button.textContent, '');
});

test('style.css allows .result-batch-actions button to wrap cleanly on 320px viewports', () => {
  const css = fs.readFileSync(path.join(root, 'assets/style.css'), 'utf8');
  const rule = css.match(/\.result-batch-actions button\{[^}]+\}/)?.[0] || '';
  assert.match(rule, /max-width:\s*100%/, 'batch button must bound its width to the container');
  assert.match(rule, /white-space:\s*normal/, 'batch button must allow multi-line wrapping on narrow screens');
  assert.match(rule, /overflow-wrap:\s*anywhere/, 'batch button must guard against horizontal overflow');
});
