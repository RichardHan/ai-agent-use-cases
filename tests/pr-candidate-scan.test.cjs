const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.join(__dirname, '../scripts/pr-candidate-scan.py');

function fixture(t, mode = '') {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'pr-scan-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const dir of ['cases', 'evidence', 'bin']) fs.mkdirSync(path.join(root, dir));
  fs.writeFileSync(path.join(root, 'cases/001-old.md'), 'https://example.org/shared\n');
  const gh = `#!/usr/bin/env node
const fs = require('node:fs');
const endpoint = process.argv[3];
const root = process.env.FIXTURE_ROOT;
const mode = process.env.FIXTURE_MODE;
const m = endpoint.match(/pulls\\/(\\d+)/);
const n = m && Number(m[1]);
const sha = (n === 1 ? 'a' : 'b').repeat(40);
let result;
if (endpoint.includes('/files?')) {
  result = [[{filename: n === 1 ? 'cases/001-new.md' : 'cases/002-new.md', status: 'added'}]];
  if (mode === 'incomplete') result = [[]];
} else if (endpoint.includes('/trees/')) {
  const first = endpoint.includes('/' + 'a'.repeat(40));
  result = {truncated: mode === 'tree-truncated', tree:[{path:first ? 'cases/001-new.md' : 'cases/002-new.md', type:'blob', mode:mode === 'symlink' ? '120000' : '100644', sha:'e'.repeat(40)}]};
} else if (endpoint.includes('/blobs/')) {
  const body = 'https://example.org/shared?utm_source=pr\\n';
  result = {sha:'e'.repeat(40), encoding:'base64', size:Buffer.byteLength(body), content:Buffer.from(body).toString('base64')};
  if (mode === 'truncated') result.size++;
} else {
  const marker = root + '/calls-' + n;
  const count = fs.existsSync(marker) ? Number(fs.readFileSync(marker)) : 0;
  fs.writeFileSync(marker, String(count + 1));
  result = {state:'open', head:{sha: (mode === 'moved' && count || mode === 'batch-moved' && n === 1 && count >= 2) ? 'c'.repeat(40) : sha, repo:{private:false, full_name:'owner/repo'}}, base:{sha:'d'.repeat(40)}, changed_files:1};
}
console.log(JSON.stringify(result));
`;
  fs.writeFileSync(path.join(root, 'bin/gh'), gh, { mode: 0o755 });
  const run = (...prs) => spawnSync('python3', [script, '--root', root, ...prs], {
    encoding: 'utf8', env: { ...process.env, PATH: `${root}/bin:${process.env.PATH}`, FIXTURE_ROOT: root, FIXTURE_MODE: mode },
  });
  return { root, run };
}

test('pins two PRs and reports corpus, cross-PR and ID matches with usable provenance', t => {
  const { root, run } = fixture(t);
  const result = run('1', '2', '1');
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.pull_requests.length, 2);
  assert.equal(report.scan.matched_occurrences, 2);
  assert.equal(report.scan.candidate_url_groups.length, 1);
  assert.match(report.scan.candidate_url_groups[0].occurrences[0].path, /^PR#1@a{40}:cases\/001-new\.md$/);
  assert.equal(report.scan.case_id_collisions[0].id, 1);
  assert.match(report.scan.case_id_collisions[0].paths.join(' '), /PR#1@a{40}:/);
  assert.equal(report.scan.results[0].matches[0].path, 'cases/001-old.md');
  assert.ok(report.scan.case_id_collisions[0].paths.includes('cases/001-old.md'));
  assert.equal(JSON.stringify(report).includes(root), false);
});

for (const mode of ['incomplete', 'truncated', 'moved', 'tree-truncated', 'symlink']) {
  test(`fails closed on ${mode} PR snapshot`, t => {
    const result = fixture(t, mode).run('1');
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
  });
}

test('fails when an earlier PR moves while a later PR is fetched', t => {
  const result = fixture(t, 'batch-moved').run('1', '2');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /changed during batch/);
  assert.equal(result.stdout, '');
});
