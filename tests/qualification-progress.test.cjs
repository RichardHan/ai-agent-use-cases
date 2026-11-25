'use strict';
const {hash} = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} = require('node:fs');
const {tmpdir} = require('node:os');
const {join} = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');

const repo = join(__dirname, '..');
const audit = 'sources/audit.md';
const source = 'https://example.com/report';

function run(root) {
  return spawnSync('python3', [join(repo, 'scripts', 'qualification-progress.py'), '--root', root], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'qualification-progress-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  for (const folder of ['cases', 'docs/qualification', 'sources']) {
    mkdirSync(join(root, folder), {recursive: true});
  }
  return {
    root,
    writeCase(number, {url = source, decision = 'qualified', missing = false, titleId} = {}) {
      const digits = String(number).padStart(3, '0');
      const id = 'UC-' + digits;
      const markdown = '# ' + (titleId || id) + '：Case\n\n- [Original](' + url + ')\n';
      if (!missing) writeFileSync(join(root, 'cases', digits + '-case.md'), markdown);
      return {
        id, decision, sha256: hash('sha256', markdown), reason: 'Audit finding',
        primary_source: url, source_type: 'original_research', source_line: 3,
      };
    },
    batch(name, decisions, note) {
      note ??= '# Audit note\n' + decisions.map(row =>
        '- [' + row.id + '](../cases/' + row.id.slice(3) + '-case.md)\n').join('');
      writeFileSync(join(root, audit), note);
      const audit_sha256 = hash('sha256', note);
      writeFileSync(join(root, 'docs/qualification', name + '.json'), JSON.stringify({audit, audit_sha256, decisions}));
    },
  };
}

test('the imported factory batch has one record per audited case', () => {
  const result = run(repo);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.match(report.scope, /incremental ledger only/);
  assert.equal(Object.values(report.counts).reduce((a, b) => a + b) - report.counts.missing, report.case_files);
  const batch = 'docs/qualification/2026-11-24-factory-operations.json';
  const decisions = JSON.parse(readFileSync(join(repo, batch), 'utf8')).decisions;
  const reported = report.cases.filter(row => row.batch === batch);
  assert.deepEqual(reported.map(row => row.id), ['UC-700', 'UC-701', 'UC-702', 'UC-703', 'UC-704', 'UC-705']);
  for (const row of reported) {
    const stored = decisions.find(decision => decision.id === row.id);
    assert.equal(row.decision, stored.decision);
    if (row.path && hash('sha256', readFileSync(join(repo, row.path))) === stored.sha256) {
      const note = join(repo, row.audit);
      const auditMatches = existsSync(note) && row.audit_sha256 === hash('sha256', readFileSync(note));
      assert.equal(row.status, auditMatches ? stored.decision : 'stale');
    }
  }
});

test('only current qualified decisions count, including past 999', t => {
  const f = fixture(t);
  const qualified = f.writeCase(2000);
  const pending = f.writeCase(1, {decision: 'pending'});
  const excluded = f.writeCase(2, {decision: 'excluded'});
  const missing = f.writeCase(3, {missing: true});
  const stale = f.writeCase(4);
  f.writeCase(5);
  writeFileSync(join(f.root, 'cases', '004-case.md'), '# UC-004：Revised\n');
  f.batch('first', [qualified, pending, excluded, missing, stale]);
  const result = run(f.root);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.case_files, 5);
  assert.deepEqual(report.counts, {excluded: 1, missing: 1, pending: 1, qualified: 1, stale: 1, untracked: 1});
  assert.deepEqual(report.cases.map(row => [row.id, row.status]), [
    ['UC-001', 'pending'], ['UC-002', 'excluded'], ['UC-003', 'missing'],
    ['UC-004', 'stale'], ['UC-005', 'untracked'], ['UC-2000', 'qualified'],
  ]);
  assert.equal(report.cases.at(-1).audit, audit);
  assert.equal(report.cases.find(row => row.id === 'UC-004').stale_reason, 'case_changed');
});

test('repeat decisions and duplicate case IDs fail with no subtotal', t => {
  const f = fixture(t);
  const row = f.writeCase(1);
  f.batch('first', [row]);
  f.batch('second', [row]);
  const duplicateDecision = run(f.root);
  assert.equal(duplicateDecision.status, 1);
  assert.match(duplicateDecision.stderr, /duplicate decision for UC-001/);
  assert.equal(duplicateDecision.stdout, '');
  rmSync(join(f.root, 'docs/qualification/second.json'));
  writeFileSync(join(f.root, 'cases/0001-conflicting.md'), '# Duplicate\n');
  const duplicateCase = run(f.root);
  assert.equal(duplicateCase.status, 1);
  assert.match(duplicateCase.stderr, /duplicate case ID UC-001/);
  assert.equal(duplicateCase.stdout, '');
});

test('normalized primary source collisions and unbound sources fail closed', t => {
  const f = fixture(t);
  const row = f.writeCase(1);
  const shared = f.writeCase(2, {url: source + '?utm_source=social#section'});
  f.batch('first', [row, shared]);
  const duplicateSource = run(f.root);
  assert.equal(duplicateSource.status, 1);
  assert.match(duplicateSource.stderr, /share a qualified primary source/);
  assert.equal(duplicateSource.stdout, '');
  f.batch('first', [{...row, primary_source: source + '/different-page'}]);
  const unbound = run(f.root);
  assert.equal(unbound.status, 1);
  assert.match(unbound.stderr, /primary source is absent/);
  assert.equal(unbound.stdout, '');
  f.batch('first', [{...row, source_line: 1}]);
  const wrongLine = run(f.root);
  assert.equal(wrongLine.status, 1);
  assert.match(wrongLine.stderr, /specified case line/);
});

test('audit text drift or deletion retires its previous subtotal', t => {
  const f = fixture(t);
  f.batch('first', [f.writeCase(1)]);
  writeFileSync(join(f.root, audit), '# Unrelated replacement\n');
  const edited = run(f.root);
  assert.equal(edited.status, 0, edited.stderr);
  const report = JSON.parse(edited.stdout);
  assert.equal(report.counts.qualified, 0);
  assert.equal(report.cases[0].stale_reason, 'audit_changed');
  rmSync(join(f.root, audit));
  const removed = run(f.root);
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(JSON.parse(removed.stdout).cases[0].stale_reason, 'audit_missing');
});

test('audit note links and title IDs must agree with the reviewed case', t => {
  const f = fixture(t);
  f.batch('first', [f.writeCase(1, {titleId: 'UC-002'})]);
  const titleConflict = run(f.root);
  assert.equal(titleConflict.status, 1);
  assert.match(titleConflict.stderr, /title and filename IDs must match/);
  assert.equal(titleConflict.stdout, '');
  f.batch('first', [f.writeCase(1)], '# Unrelated replacement\n');
  const unbound = run(f.root);
  assert.equal(unbound.status, 1);
  assert.match(unbound.stderr, /audit note needs a direct Markdown link/);
  assert.equal(unbound.stdout, '');
});
