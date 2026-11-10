'use strict';
// The homepage scenario buttons and the detail handoff both start over on purpose.
// What they must never do is drop the visitor's own conditions without a word: the
// notice names every condition that actually went away and offers one click back.
// These cases pin the sentence, the honesty of its count, and where the panel lives
// for each trigger (the reader's viewport differs: card stage vs result line).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
const context = vm.createContext({ URL });
vm.runInContext(source + '\nthis.api={scenarioResetCopy,scenarioResetAnchor,FILTER_LABELS};', context);
const api = context.api;

const dropped = [
  { key: 'query', label: '關鍵字', display: '怎麼整理會議記錄' },
  { key: 'difficulty', label: '實作門檻', display: '入門對話' }
];

test('a scenario switch names every cleared condition and the way back', () => {
  const copy = api.scenarioResetCopy({ scenario: '', count: 7 }, '工作', dropped, { partial: false });
  assert.match(copy.message, /已切換到「工作」情境/);
  for (const condition of dropped) {
    assert.ok(copy.message.includes(condition.label + '「' + condition.display + '」'), 'names ' + condition.label);
  }
  assert.equal(copy.action, '回到原本的搜尋（7 筆）');
});

test('the all-scenarios button never prints an empty scenario label', () => {
  const copy = api.scenarioResetCopy({ scenario: '工作', count: 3 }, '', dropped, { partial: false });
  assert.ok(!copy.message.includes('「」'), 'no empty quoted label');
  assert.match(copy.message, /已切換到全部情境/);
  assert.match(copy.message, /關鍵字「怎麼整理會議記錄」/);
});

test('re-pressing the scenario already in use says what it cleared, not that it switched', () => {
  const copy = api.scenarioResetCopy({ scenario: '工作', count: 12 }, '工作', dropped, { partial: false });
  assert.ok(!copy.message.includes('已切換'), 'no switch happened');
  assert.match(copy.message, /已清除原本的關鍵字「怎麼整理會議記錄」、實作門檻「入門對話」/);
  assert.match(copy.message, /改為列出「工作」情境的全部條目/);
  assert.equal(copy.action, '回到原本的搜尋（12 筆）');
});

test('a partial load offers the way back without a result count it cannot stand behind', () => {
  const copy = api.scenarioResetCopy({ scenario: '', count: 7 }, '工作', dropped, { partial: true });
  assert.equal(copy.action, '回到原本的搜尋');
  assert.ok(!/（\d/.test(copy.action), 'no result count while sources are missing');
  assert.match(copy.message, /已切換到「工作」情境/, 'the message still explains the switch');
});

test('the notice lives where the reader is looking', () => {
  assert.deepEqual({...api.scenarioResetAnchor('discover')}, { host: 'discover', anchor: 'drawn-case' },
    'the draw stage puts the notice where the reader lands, with the new card under it');
  assert.deepEqual({...api.scenarioResetAnchor('explore')}, { host: 'explore', anchor: 'partial-load' },
    'the result screen keeps the notice above the result line');
  assert.deepEqual({...api.scenarioResetAnchor(undefined)}, { host: 'explore', anchor: 'partial-load' },
    'an unlabelled trigger is the result screen, as before this round');
  assert.deepEqual({...api.scenarioResetAnchor('nonsense')}, { host: 'explore', anchor: 'partial-load' });
});

test('conditions are labelled with the same vocabulary the filter bar uses', () => {
  assert.equal(api.FILTER_LABELS.query, '關鍵字');
  assert.equal(api.FILTER_LABELS.difficulty, '實作門檻');
  assert.equal(api.FILTER_LABELS.tool, '提及工具');
});
