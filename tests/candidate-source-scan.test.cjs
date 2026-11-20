const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.join(__dirname, '../scripts/candidate-source-scan.py');

test('batch scan reports traceable source matches without declaring duplicates', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'candidate-scan-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'cases'));
  fs.mkdirSync(path.join(root, 'evidence'));
  fs.writeFileSync(path.join(root, 'cases', 'one.md'), 'Source: https://twitter.com/alice/status/123?utm_source=mail\n');
  fs.writeFileSync(path.join(root, 'evidence', 'two.md'), 'https://example.org/doc?id=1\nhttps://example.org/search?q=+\n');
  const candidate = path.join(root, 'batch.md');
  fs.writeFileSync(candidate, [
    '[post](https://x.com/alice/status/123#reply)',
    'https://example.org/doc?id=1&gclid=abc',
    'https://example.org/doc?id=2',
    'https://example.org/doc/?id=1',
    'https://example.org/search?q=%20',
  ].join('\n'));
  const run = spawnSync('python3', [script, '--root', root, candidate], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.corpus_files_scanned, 2);
  assert.equal(report.candidate_url_occurrences, 5);
  assert.equal(report.matched_occurrences, 2);
  assert.equal(report.results[0].matches[0].path, 'cases/one.md');
  assert.equal(report.results[0].matches[0].line, 1);
  assert.equal(report.results[1].matches[0].path, 'evidence/two.md');
  assert.deepEqual(report.results[2].matches, []);
  assert.deepEqual(report.results[3].matches, []);
  assert.deepEqual(report.results[4].matches, []);
  assert.equal('qualified' in report.results[0], false);
});

test('missing corpus and unreadable inputs fail instead of reporting no matches', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'candidate-scan-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.notEqual(spawnSync('python3', [script, '--root', root, 'missing']).status, 0);
  fs.mkdirSync(path.join(root, 'cases'));
  fs.mkdirSync(path.join(root, 'evidence'));
  assert.notEqual(spawnSync('python3', [script, '--root', root, 'missing']).status, 0);
});
