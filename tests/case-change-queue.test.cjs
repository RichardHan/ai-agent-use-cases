const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.join(__dirname, '../scripts/case-change-queue.py');

test('queue preserves net additions, edits, deletions, renames and unusual filenames', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'case-queue-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  function git(...args) {
    const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  }
  const put = (name, value) => fs.writeFileSync(path.join(root, 'cases', name), value);
  git('init', '-q');
  git('config', 'user.name', 'Fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  fs.mkdirSync(path.join(root, 'cases'));
  put('old.md', 'unchanged rename'); put('edit.md', 'before'); put('gone.md', 'gone');
  git('add', '.'); git('commit', '-qm', 'base');
  const base = git('rev-parse', 'HEAD');
  fs.renameSync(path.join(root, 'cases/old.md'), path.join(root, 'cases/new.md'));
  fs.unlinkSync(path.join(root, 'cases/gone.md'));
  put('edit.md', 'after'); put('空 白\nfile.md', 'added');
  fs.writeFileSync(path.join(root, 'outside.md'), 'ignored');
  git('add', '-A'); git('commit', '-qm', 'target');
  const target = git('rev-parse', 'HEAD');
  put('edit.md', 'uncommitted');
  const run = spawnSync('python3', [script, base, target, '--root', root], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.base, base); assert.equal(report.target, target);
  assert.deepEqual(report.counts, { A: 2, D: 2, M: 1 });
  const byPath = Object.fromEntries(report.cases.map(item => [item.path, item]));
  assert.equal(byPath['cases/old.md'].status, 'D');
  assert.equal(byPath['cases/new.md'].status, 'A');
  assert.equal(byPath['cases/空 白\nfile.md'].status, 'A');
  assert.equal(byPath['cases/gone.md'].after, null);
  assert.equal(byPath['cases/edit.md'].after.blob, git('rev-parse', `${target}:cases/edit.md`));
  assert.notEqual(spawnSync('python3', [script, target, base, '--root', root]).status, 0);
  assert.notEqual(spawnSync('python3', [script, 'not-a-revision', target, '--root', root]).status, 0);
});
