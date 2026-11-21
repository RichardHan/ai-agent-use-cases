const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.join(__dirname, '../scripts/audit-reference-scan.py');

test('direct ledger links retain line evidence without guessing verdicts', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-scan-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'cases'));
  fs.mkdirSync(path.join(root, 'sources'));
  fs.writeFileSync(path.join(root, 'cases', '001-one.md'), [
    '# Case',
    '- 來源證據：`author-demo`，未重現。',
    '原文 [first](https://example.org/report)；亦見 https://example.org/other。',
    '引用 [first](https://example.org/report#detail) 和 [path](https://example.org/a%20(copy)/file)。',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'cases', '002-two.md'), '- 證據狀態：author-demo');
  fs.writeFileSync(path.join(root, 'sources', 'qualification-audit-2026-10-16.md'), [
    '[UC-001](../cases/001-one.md) and [again](../cases/001-one.md#section)',
    'UC-002 mentioned, but not linked',
    '[missing](../cases/003-gone.md)',
    '[historical](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/001-one.md)',
  ].join('\n'));
  const run = spawnSync('python3', [script, '--root', root], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.case_files, 2);
  assert.equal(report.files_with_direct_links, 1);
  assert.equal(report.files_without_direct_links, 1);
  assert.deepEqual(report.cases[0].ledger_lines, [1, 4]);
  assert.deepEqual(report.cases[1].ledger_lines, []);
  assert.deepEqual(report.cases[0].evidence_declarations, [
    { line: 2, text: '- 來源證據：`author-demo`，未重現。' },
  ]);
  assert.deepEqual(report.cases[0].url_occurrences, [
    { line: 3, url: 'https://example.org/report' },
    { line: 3, url: 'https://example.org/other' },
    { line: 4, url: 'https://example.org/report#detail' },
    { line: 4, url: 'https://example.org/a%20(copy)/file' },
  ]);
  assert.deepEqual(report.cases[1].url_occurrences, []);
  assert.deepEqual(report.cases[1].evidence_declarations, [
    { line: 1, text: '- 證據狀態：author-demo' },
  ]);
  assert.deepEqual(report.unresolved_link_targets, { '003-gone.md': [3] });
  assert.equal('qualified' in report.cases[0], false);
});

test('joins shared normalized sources to each case without duplicating groups', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-overlap-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'cases', 'nested'), { recursive: true });
  fs.mkdirSync(path.join(root, 'sources'));
  fs.writeFileSync(path.join(root, 'sources', 'qualification-audit-2026-10-16.md'),
    '[nested](../cases/nested/001.md)\n[top](../cases/001.md)\n');
  fs.writeFileSync(path.join(root, 'cases', '001.md'),
    'https://example.org/story?utm_source=news#one\nhttps://example.org/story\n');
  fs.writeFileSync(path.join(root, 'cases', 'nested', '001.md'), 'https://example.org/story#two\n');
  fs.writeFileSync(path.join(root, 'cases', '003.md'), 'https://example.org/unique\n');
  const run = spawnSync('python3', [script, '--root', root], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.case_files, 3);
  assert.deepEqual(report.shared_url_groups, [{
    normalized_url: 'https://example.org/story',
    occurrences: [
      { path: 'cases/001.md', line: 1, url: 'https://example.org/story?utm_source=news#one' },
      { path: 'cases/001.md', line: 2, url: 'https://example.org/story' },
      { path: 'cases/nested/001.md', line: 1, url: 'https://example.org/story#two' },
    ],
  }]);
  assert.deepEqual(report.cases.find(c => c.path === 'cases/nested/001.md').shared_url_keys,
    ['https://example.org/story']);
  assert.deepEqual(report.cases.find(c => c.path === 'cases/003.md').shared_url_keys, []);
  assert.deepEqual(report.cases.find(c => c.path === 'cases/nested/001.md').ledger_lines, [1]);
  assert.deepEqual(report.cases.find(c => c.path === 'cases/001.md').ledger_lines, [2]);
  assert.deepEqual(report.unresolved_link_targets, {});
});

test('ambiguous URL fails the entire worklist rather than publishing a partial join', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-ambiguous-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'cases'));
  fs.mkdirSync(path.join(root, 'sources'));
  fs.writeFileSync(path.join(root, 'sources', 'qualification-audit-2026-10-16.md'), '');
  fs.writeFileSync(path.join(root, 'cases', '001.md'), 'https://example.org/a(b(c))');
  const run = spawnSync('python3', [script, '--root', root], { encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.equal(run.stdout, '');
  assert.match(run.stderr, /ambiguous URL/);
});

test('missing ledger or empty corpus fails closed', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-scan-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.notEqual(spawnSync('python3', [script, '--root', root]).status, 0);
  fs.mkdirSync(path.join(root, 'cases'));
  fs.writeFileSync(path.join(root, 'cases', '001.md'), 'case');
  assert.notEqual(spawnSync('python3', [script, '--root', root]).status, 0);
});
