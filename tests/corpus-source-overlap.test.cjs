const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.join(__dirname, '../scripts/corpus-source-overlap.py');

test('groups shared sources across pages with their exact locations, not a duplicate verdict', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'overlap-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'cases'));
  fs.mkdirSync(path.join(root, 'cases/nested'));
  fs.writeFileSync(path.join(root, 'cases/001-one.md'), 'https://example.org/a?utm_source=x\nhttps://example.org/a#section\n');
  fs.writeFileSync(path.join(root, 'cases/002-two.md'), 'first\nhttps://example.org/a\nhttps://example.org/b\n');
  fs.writeFileSync(path.join(root, 'cases/nested/003-three.md'), 'https://example.org/b\n');
  const run = spawnSync('python3', [script, '--root', root], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.case_files, 3);
  assert.equal(result.shared_url_groups, 2);
  assert.deepEqual(result.groups[0].occurrences.map(({path, line}) => [path, line]), [
    ['cases/001-one.md', 1], ['cases/001-one.md', 2], ['cases/002-two.md', 2],
  ]);
  assert.equal(result.groups[1].normalized_url, 'https://example.org/b');
  assert.deepEqual(result.groups[1].occurrences.map(({path}) => path), ['cases/002-two.md', 'cases/nested/003-three.md']);
  assert.equal('duplicate' in result.groups[0], false);
});

test('empty corpora and ambiguous URLs fail rather than yielding incomplete results', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'overlap-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'cases'));
  assert.notEqual(spawnSync('python3', [script, '--root', root]).status, 0);
  fs.writeFileSync(path.join(root, 'cases/001-one.md'), 'https://example.org/a(b(c))');
  const run = spawnSync('python3', [script, '--root', root], { encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.equal(run.stdout, '');
});
