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

// The label a case shows must be the class its own evidence line declares first.
// A later mention of supporting material (a shared template page, an official
// doc used only for comparison) describes where the material came from, not
// what the author did, so it must not outrank the leading declaration.
const openingClause = markdown => {
  const line = evidenceLine(markdown).replace(/`/g, '');
  return line.split(/[＋；。]/)[0] || '';
};

test('a case that opens with an author execution record is never filed under template material', () => {
  const offenders = entries
    .filter(entry => entry.kind === 'case')
    .filter(entry => {
      const clause = openingClause(entry.markdown);
      return /author-(?:demo|self-report)|作者/.test(clause) && !/^(?:原)?模板/.test(clause);
    })
    .filter(entry => entry.proof === '模板／文件核讀')
    .map(entry => `${entry.id} → ${entry.proof}`);

  assert.deepEqual(offenders, [], 'a passing template mention must not override the author’s own execution record');
});

test('a case that opens with a vendor or official statement keeps the first-party claimant', () => {
  // A leading vendor/official statement covers graded vendor grades
  // (V級, V＋B，), service providers reporting their own test (服務商自己), and any
  // employee of the publisher (產品員工, 服務商員工), while excluding an official
  // channel that merely selects or relays an external user's quote (官方轉述, 官方挑選).
  const firstPartyLead = /^(?:[VAB](?:\s*[＋+]\s*[VAB])?級?\s*[，,、:：]?\s*)?(?:(?:廠商|原廠|產品|服務商|公司|官方)?員工|服務商自己|廠商|原廠|官方(?!(?:轉述|挑選|引用|引述)(?!的?(?:(?:廠商|原廠|產品|服務商|公司|官方|內部|自家)(?:員工|團隊)|員工|內部))))/;
  const offenders = entries
    .filter(entry => entry.kind === 'case')
    .filter(entry => firstPartyLead.test(openingClause(entry.markdown)))
    .filter(entry => entry.proof !== '官方自報')
    .map(entry => `${entry.id} → ${entry.proof}`);

  // Showing a vendor's own claim as 「公開文獻／第三方分析」 or 「作者報告／示範」
  // hides the conflict of interest.
  assert.deepEqual(offenders, []);
});

test('backtick-quoted unverified and designed tokens are read as their own class', () => {
  const quotedUnverified = entries
    .filter(entry => /^`(?:unverified|待驗證|待定|尚待查證)`/i.test(evidenceLine(entry.markdown)))
    .filter(entry => entry.proof !== '尚待查證')
    .map(entry => `${entry.id} → ${entry.proof}`);
  const quotedDesigned = entries
    .filter(entry => /^`designed`/i.test(evidenceLine(entry.markdown)))
    .filter(entry => entry.proof !== '設計／未實跑')
    .map(entry => `${entry.id} → ${entry.proof}`);

  assert.deepEqual(quotedUnverified, []);
  assert.deepEqual(quotedDesigned, []);
});

test('cases whose evidence line declares author-demo, external tester quote, or a vendor grade land on the matching label', () => {
  const expected = {
    'UC-347': '作者報告／示範', 'UC-352': '作者報告／示範', 'UC-422': '作者報告／示範',
    'UC-407': '作者報告／示範', 'UC-054': '作者報告／示範', 'UC-072': '作者報告／示範',
    'UC-344': '作者報告／示範', 'UC-274': '作者報告／示範', 'UC-039': '作者報告／示範',
    'UC-179': '作者報告／示範', 'UC-024': '作者報告／示範',
    'UC-154': '官方自報', 'UC-152': '官方自報', 'UC-221': '官方自報',
    'UC-260': '官方自報', 'UC-167': '官方自報', 'UC-020': '官方自報', 'UC-033': '官方自報',
    'UC-107': '官方自報', 'UC-108': '官方自報', 'UC-328': '官方自報'
  };
  for (const [id, label] of Object.entries(expected)) {
    const entry = entries.find(item => item.id === id);
    assert.ok(entry, `${id} exists in the corpus`);
    assert.equal(entry.proof, label, `${id} must show the class its evidence line declares`);
  }
});

test('merged cases do not leave an older source count or partial source list in their lead evidence note', () => {
  const offenders = [];
  for (const entry of entries.filter(item => item.kind === 'case')) {
    const line = evidenceLine(entry.markdown);
    const bodySources = [...new Set(
      [...entry.markdown.matchAll(/^#{2,3}\s+.*?(S-\d+[A-Z]|來源[A-Z])(?![a-zA-Z])/gm)].map(m => m[1])
    )];
    if (bodySources.length <= 1) continue;
    const namedOrdinal = [...new Set([...line.matchAll(/來源[A-Z]/g)].map(m => m[0]))];
    if (namedOrdinal.includes('來源A') && namedOrdinal.length >= 2) {
      const expectedOrdinal = bodySources.filter(label => label.startsWith('來源'));
      if (namedOrdinal.join(',') !== expectedOrdinal.join(',')) {
        offenders.push(`${entry.id}: - 證據狀態 lists ${namedOrdinal.join(',')} but body has ${expectedOrdinal.join(',')}`);
      }
    }
    const namedCode = [...new Set([...line.matchAll(/S-\d+[A-Z]/g)].map(m => m[0]))];
    if (namedCode.some(code => code.endsWith('A')) && namedCode.length >= 2) {
      const expectedCode = bodySources.filter(label => label.startsWith('S-'));
      if (namedCode.join(',') !== expectedCode.join(',')) {
        offenders.push(`${entry.id}: - 證據狀態 lists ${namedCode.join(',')} but body has ${expectedCode.join(',')}`);
      }
    }
  }
  for (const [id, pattern, expected] of [
    ['UC-089', /S-\d+[A-Z]/g, 'S-089A,S-089B,S-089C,S-089D,S-089E'],
    ['UC-336', /S-\d+[A-Z]/g, 'S-336A,S-336B,S-336C'],
    ['UC-351', /來源[A-Z]/g, '來源A,來源B,來源C,來源D,來源E,來源F,來源G'],
    ['UC-359', /來源[A-Z]/g, '來源A,來源B,來源C']
  ]) {
    const found = [...new Set([...evidenceLine(entries.find(item => item.id === id).markdown).matchAll(pattern)].map(m => m[0]))].join(',');
    if (found !== expected) {
      offenders.push(`${id}: - 證據狀態 must list ${expected} (found ${found || 'none'})`);
    }
  }
  assert.deepEqual(offenders, []);
});
