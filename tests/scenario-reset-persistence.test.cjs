'use strict';
// The homepage scenario buttons may be pressed again after a press that cleared the
// visitor's own words. The conditions that press removed are still gone, so the
// pending snapshot — not the empty one from the repeat press — is what the notice
// has to describe. Only the scenario itself is dropped: choosing a direction is the
// switch, not a loss.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
const context = vm.createContext({ URL });
vm.runInContext(source + '\nthis.api={pendingScenarioReset};this.setScenarioReset=value=>{scenarioReset=value;};', context);
const { api, setScenarioReset } = context;

const conditions = [
  { key: 'query', label: '關鍵字', display: '怎麼整理會議記錄' },
  { key: 'scenario', label: '使用情境', display: '工作' }
];

test('nothing pending means nothing to say', () => {
  setScenarioReset(null);
  assert.equal(api.pendingScenarioReset(), null);
});

test('a pending notice is reused with the scenario chooser removed', () => {
  setScenarioReset({ url: 'https://example.test/?q=x', query: '怎麼整理會議記錄', count: 7, scenario: '工作', conditions });
  const pending = api.pendingScenarioReset();
  assert.ok(pending, 'the earlier press is still pending');
  assert.equal(pending.count, 7, 'the way back keeps promising the same set');
  assert.equal(pending.query, '怎麼整理會議記錄');
  assert.deepEqual(pending.conditions.map(c => c.key), ['query'], 'the scenario is the switch, not a loss');
});

test('a notice that only described the scenario has nothing left to say', () => {
  setScenarioReset({ count: 162, scenario: '', conditions: [{ key: 'scenario', label: '使用情境', display: '工作' }] });
  assert.equal(api.pendingScenarioReset(), null, 'a bare scenario switch must stay silent');
});

test('the pending snapshot is copied, not mutated', () => {
  const original = { count: 3, scenario: '', conditions };
  setScenarioReset(original);
  const pending = api.pendingScenarioReset();
  assert.equal(original.conditions.length, 2, 'the stored snapshot keeps every condition it recorded');
  assert.notEqual(pending.conditions, original.conditions, 'the dropped list is a new array');
});
