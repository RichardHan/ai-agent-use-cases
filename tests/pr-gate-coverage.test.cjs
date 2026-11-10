'use strict';
// A green pull-request check only proves what actually ran. Four drifts make a
// workflow look like a gate while it cannot run for the change under review:
//
//  1. A test file runs in some workflow, but no pull request that edits that file
//     starts any workflow running it — so the suite is protected only by accident
//     of who else happens to run it, and editing it is unverified.
//  2. A browser suite asserts the built site or the corpus, but no pull request
//     touching `assets/`, `index.html`, `cases/`, `evidence/` or `sources/pending.md`
//     starts a workflow that runs it.
//  3. A step swallows a failing unit run (`node --test … || node -e '…'`) and the
//     job still goes green.
//  4. Editing `.github/workflows/*.yml` starts no workflow at all, so the tests
//     that audit every workflow (`published-check.test.cjs`) never run for the edit
//     that would break them.
//
// Only workflows a pull request can start count as coverage: a dispatch-only job is
// not a gate. The four checks are stated over the set of pull-request workflows
// because running the same suite in two places does give a PR two chances to run it.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflows = path.join(__dirname, '..', '.github', 'workflows');
const files = fs.readdirSync(workflows).filter(file => file.endsWith('.yml')).sort();
const read = file => fs.readFileSync(path.join(workflows, file), 'utf8');

// What a browser suite can assert about the built site.
const CORPUS = ['assets/app.js', 'index.html', 'cases/001-travel-checkout.md', 'evidence/008-morning-brief-validation.md', 'sources/pending.md'];

function pullRequestPaths(source) {
  const key = source.match(/^ {2}pull_request:[^\n]*$/m);
  if (!key) return null;
  const body = [];
  for (const line of source.slice(key.index + key[0].length).split('\n').slice(1)) {
    if (/^ {2}\S/.test(line)) break;
    body.push(line);
  }
  const text = body.join('\n');
  const inline = text.match(/^\s*paths:\s*\[([\s\S]*?)\]/m);
  if (inline) return inline[1].split(',').map(value => value.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  // Block list: every `- item` after `paths:`, ignoring comment lines (a filter
  // entry may be explained in place) and anything deeper than the list itself.
  const start = text.search(/^\s*paths:\s*$/m);
  if (start < 0) return [];
  return text.slice(start).split('\n').slice(1)
    .map(line => line.match(/^[ \t]*-[ \t]*(.+?)\s*$/))
    .filter(Boolean)
    .map(match => match[1].replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, ''))
    .filter(value => value && !value.startsWith('#'));
}

function covers(patterns, file) {
  return (patterns || []).some(pattern => {
    const source = pattern.replace(/^['"]|['"]$/g, '');
    const expression = '^' + source
      .split('**')
      .map(part => part.split('*').map(chunk => chunk.replace(/[.+^${}()|[\]\\]/g, '\\$&')).join('[^/]*'))
      .join('.*') + '$';
    return new RegExp(expression).test(file);
  });
}

const pr = files
  .map(file => {
    const source = read(file);
    const runs = [...new Set([...source.matchAll(/node\s+[^\n|&]*(tests\/[\w.-]+\.cjs)/g)].map(match => match[1]))];
    const drivesSite = /playwright|scripts\/preview\.py|http\.server|SITE_URL|--with-deps/.test(source) || runs.some(name => /-browser\.cjs$/.test(name));
    return { file, source, runs, paths: pullRequestPaths(source), drivesSite };
  })
  .filter(entry => entry.paths !== null);

test('the pull-request workflows were actually parsed', () => {
  assert.ok(pr.length >= 10, `expected the pull-request workflows to be found, saw ${pr.length}`);
  assert.ok(pr.some(entry => entry.file === 'website-qa.yml'), 'website-qa.yml must keep a pull_request trigger');
  assert.ok(pr.some(entry => entry.file === 'corpus-bundle-qa.yml'), 'corpus-bundle-qa.yml must keep a pull_request trigger');
});

test('editing a suite starts a pull request workflow that runs it', () => {
  const runners = new Map();
  for (const entry of pr) {
    for (const run of entry.runs) {
      if (!covers(entry.paths, run)) continue;
      if (!runners.has(run)) runners.set(run, []);
      runners.get(run).push(entry.file);
    }
  }
  const unowned = [...new Set(pr.flatMap(entry => entry.runs))].filter(run => !runners.has(run)).sort();
  assert.deepEqual(unowned, [], 'editing one of these suites would start no workflow that runs it');
  // corpus-bundle-qa.yml is the only pull-request runner of these suites; listing
  // them is what keeps the reading-history/selection contracts under review.
  for (const run of ['tests/corpus-bundle-browser.cjs', 'tests/reading-selection-browser.cjs', 'tests/reading-history-browser.cjs', 'tests/recovery-progress-browser.cjs']) {
    assert.ok(runners.has(run), `${run} must stay reachable from a pull request`);
  }
});

test('editing the site or the corpus starts a browser workflow that asserts it', () => {
  const gaps = [];
  for (const entry of pr) {
    if (!entry.drivesSite) continue;
    const missing = CORPUS.filter(file => !covers(entry.paths, file));
    if (missing.length) gaps.push(`${entry.file} → missing ${missing.join(', ')}`);
  }
  assert.deepEqual(gaps, [], 'a browser suite that asserts the site must run when the site or corpus changes');
});

test('no workflow turns a failing unit run into a green step', () => {
  const offenders = [];
  for (const file of files) {
    for (const line of read(file).split('\n')) {
      if (!/node\s+--test/.test(line) || !/\|\|/.test(line)) continue;
      // `|| { cat …; exit 1; }` re-raises the failure; a fallback that can end the
      // step successfully (`|| node - <<'JS' … JS`, `|| true`) does not.
      if (!/\bexit\b/.test(line)) offenders.push(`${file}: ${line.trim().slice(0, 90)}`);
    }
  }
  assert.deepEqual(offenders, [], 'a failing `node --test` must fail the step, not be excused by a fallback command');
});

test('a workflow edit runs the job that audits every workflow', () => {
  const website = pr.find(entry => entry.file === 'website-qa.yml');
  assert.ok(covers(website.paths, '.github/workflows/related-qa.yml'), 'editing a workflow must run the job that audits all workflows');
  const audit = fs.readFileSync(path.join(__dirname, 'published-check.test.cjs'), 'utf8');
  assert.match(audit, /readdirSync\(workflows\)/, 'published-check.test.cjs is the audit that has to run for workflow edits');
});
