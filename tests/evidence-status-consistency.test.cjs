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
  source + '\nthis.api={parseFile,PROOF_DEFINITIONS,PROOF_CLAIMANTS,PROOF_VERIFICATION_STATUS,PROOF_SAFE_ADOPTION_TIP};',
  context
);
const api = context.api;
vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);

const files = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .concat('sources/pending.md');
const entries = files.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));

const evidenceLine = markdown => (markdown.match(/^-\s*(?:來源證據|證據狀態|證據等級|證據)\s*[：:]\s*(.+)$/m) || [])[1] || '';

test('a case that only shares a designed prompt is not labelled as an author execution record', () => {
  const offenders = entries
    .filter(entry => entry.kind === 'case')
    .filter(entry => /^\s*`?designed`?/i.test(evidenceLine(entry.markdown)))
    .filter(entry => entry.proof !== '設計／未實跑')
    .map(entry => `${entry.id} → ${entry.proof}`);

  assert.deepEqual(offenders, [], 'a designed-only evidence line must not be shown as 作者報告／示範');
});

test('cases declaring designed-only evidence stay searchable and keep their proof definition', () => {
  const designed = entries.filter(entry => entry.proof === '設計／未實跑');
  assert.ok(designed.length >= 1, 'at least one designed-only case exists in the corpus');
  for (const entry of designed) {
    assert.ok(entry.title && entry.summary, `${entry.id} still renders a card`);
    assert.match(api.PROOF_DEFINITIONS['設計／未實跑'], /未附執行結果/);
    assert.match(api.PROOF_VERIFICATION_STATUS['設計／未實跑'], /沒有執行結果/);
    assert.ok(api.PROOF_CLAIMANTS['設計／未實跑'], 'claimant wording is defined');
    assert.ok(api.PROOF_SAFE_ADOPTION_TIP['設計／未實跑'], 'safe adoption tip is defined');
  }
});

test('an unverified evidence line is never presented as an author demonstration', () => {
  const offenders = entries
    .filter(entry => /^\s*(?:unverified|待驗證|待定|尚待查證)/i.test(evidenceLine(entry.markdown)))
    .filter(entry => entry.proof === '作者報告／示範')
    .map(entry => `${entry.id} → ${entry.proof}`);
  assert.deepEqual(offenders, []);
});

test('every proof bucket used by the corpus has a definition, claimant, status and safety tip', () => {
  for (const entry of entries) {
    assert.ok(api.PROOF_DEFINITIONS[entry.proof], `${entry.id} proof ${entry.proof} has a definition`);
    assert.ok(api.PROOF_CLAIMANTS[entry.proof], `${entry.id} proof ${entry.proof} has a claimant`);
    assert.ok(api.PROOF_VERIFICATION_STATUS[entry.proof], `${entry.id} proof ${entry.proof} has a verification status`);
    assert.ok(api.PROOF_SAFE_ADOPTION_TIP[entry.proof], `${entry.id} proof ${entry.proof} has a safety tip`);
  }
});
