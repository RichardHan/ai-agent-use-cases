'use strict';
// A green pull-request check only proves what actually ran. Four drifts make a
// workflow look like a gate while it cannot run for the change under review:
//
//  1. A suite runs in some workflow, but no pull request that edits that file
//     starts a workflow which executes it — so editing the suite is unverified.
//  2. A browser suite asserts the built site or the corpus, but no pull request
//     touching `assets/`, `index.html`, `cases/`, `evidence/` or `sources/pending.md`
//     starts a workflow that runs it.
//  3. A step swallows a failing unit run (`node --test … || node -e '…'`) and the
//     job still goes green.
//  4. Editing `.github/workflows/*.yml` starts no workflow at all, so the tests
//     that audit every workflow (`published-check.test.cjs`) never run for the edit
//     that would break them.
//
// Only what a pull request can actually reach counts: a dispatch-only workflow, or
// a step pinned to a branch (`if: github.ref == 'refs/heads/verify/…'`), is not a
// gate even when its job runs on a pull request. The checks are stated over the
// set of pull-request workflows because running a suite in two places does give a
// pull request two chances to run it.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const workflows = path.join(root, '.github', 'workflows');
const files = fs.readdirSync(workflows).filter(file => file.endsWith('.yml')).sort();
const read = file => fs.readFileSync(path.join(workflows, file), 'utf8');

// Everything a browser suite can assert about the built site, as the files that
// exist right now. Sampling one case would let `cases/001-*` pass for `cases/**`.
const CORPUS = [
  ...['cases', 'evidence'].flatMap(dir => fs.readdirSync(path.join(root, dir))
    .filter(name => name.endsWith('.md'))
    .map(name => dir + '/' + name)),
  'index.html',
  'sources/pending.md',
  ...fs.readdirSync(path.join(root, 'assets')).map(name => 'assets/' + name)
];

// A step is unreachable from a pull request when its `if:` pins a branch ref or
// a non-pull-request event: `github.ref == 'refs/heads/verify/…'` is never true
// for `refs/pull/N/merge`, and a `push`-only step cannot run on a pull request.
function stepReachable(step) {
  return !/^ {8}if:.*(?:github\.ref\s*==|github\.event_name\s*==\s*['"](?:workflow_dispatch|push)['"])/m.test(step);
}

function commandsIn(source) {
  const runs = new Set();
  const blocks = source.split(/^ {6}- /m);
  for (const block of blocks) {
    if (!stepReachable(block)) continue;
    for (const match of block.matchAll(/node\s+[^\n|&]*(tests\/[\w.-]+\.cjs)/g)) runs.add(match[1]);
  }
  return [...runs].sort();
}

// Returns the pull-request path filters, or null when a pull request cannot start
// the workflow. `['**']` means "every pull request runs this": a trigger without a
// `paths` filter covers everything, so it must not be read as covering nothing.
function pullRequestPaths(source) {
  // `on: pull_request` and `on: [push, pull_request]` must be on the `on:` line;
  // using `\s*` here would swallow the newline and read every filtered
  // `on:` / `  pull_request:` block as unfiltered.
  if (/^on:[ \t]*(?:pull_request\b|\[[^\]]*\bpull_request\b)/m.test(source)) return ['**'];
  // A `- pull_request` list item carries no `paths`, so it runs on every PR.
  if (/^ {2}- pull_request\b/m.test(source)) return ['**'];
  const key = source.match(/^ {2}pull_request\b[^\n]*$/m);
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
  if (start < 0) return ['**'];
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
    const paths = pullRequestPaths(source);
    return {
      file,
      source,
      runs: commandsIn(source),
      paths: paths === null ? null : (paths.length ? paths : ['**']),
      drivesSite: /playwright|scripts\/preview\.py|http\.server|SITE_URL|--with-deps/.test(source) || commandsIn(source).some(name => /-browser\.cjs$/.test(name))
    };
  })
  .filter(entry => entry.paths !== null);

test('the pull-request workflows were actually parsed', () => {
  assert.ok(pr.length >= 10, `expected the pull-request workflows to be found, saw ${pr.length}`);
  assert.ok(pr.some(entry => entry.file === 'website-qa.yml'), 'website-qa.yml must keep a pull_request trigger');
  assert.ok(pr.some(entry => entry.file === 'corpus-bundle-qa.yml'), 'corpus-bundle-qa.yml must keep a pull_request trigger');
  // The corpus sample has to be the whole corpus, not one convenient file.
  assert.ok(CORPUS.length > 500, `expected the corpus sample to cover the library, saw ${CORPUS.length} files`);
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
  assert.deepEqual(unowned, [], 'editing one of these suites would start no pull request workflow that runs it');
  // corpus-bundle-qa.yml is the only pull-request runner of these suites, and its
  // steps are the only place the reading contracts execute against the real
  // Jekyll output. Listing them is what keeps them under review.
  for (const run of [
    'tests/corpus-bundle-browser.cjs',
    'tests/reading-selection-browser.cjs',
    'tests/reading-history-browser.cjs',
    'tests/recovery-progress-browser.cjs',
    'tests/arrival-geometry-diagnostic.cjs'
  ]) {
    assert.ok(runners.has(run), `${run} must stay reachable from a pull request`);
  }
});

test('editing the site or any part of the corpus starts a browser workflow that asserts it', () => {
  const gaps = [];
  for (const entry of pr) {
    if (!entry.drivesSite) continue;
    const missing = CORPUS.filter(file => !covers(entry.paths, file));
    if (missing.length) gaps.push(`${entry.file} → ${missing.length} uncovered, first ${missing.slice(0, 3).join(', ')}`);
  }
  assert.deepEqual(gaps, [], 'a browser suite that asserts the site must run when the site or corpus changes');
});

function stripQuotes(text) {
  return text.replace(/'[^']*'|"[^"]*"/g, '""');
}

test('no workflow turns a failing unit run into a green step', () => {
  const offenders = [];
  for (const file of files) {
    const source = read(file);
    for (const block of source.split(/^ {6}- /m).slice(1)) {
      const hasPipefail = /^ {8}shell:\s*bash\b/m.test(block) || /\bset\s+-o\s+pipefail\b/.test(block);
      const joined = block
        .split('\n')
        .map(line => line.replace(/(^|\s)#.*$/, ''))
        .join('\n')
        .replace(/\\\n[ \t]*/g, ' ');
      for (const line of joined.split('\n')) {
        if (!/node\s+--test/.test(line)) continue;
        const unquoted = stripQuotes(line);
        if (/\|\|/.test(unquoted)) {
          // Comments cannot rescue a swallowed failure: `|| { :; } # exit 1` still
          // succeeds. Require a real non-zero exit in the fallback itself.
          if (/\bexit\s+(?:0\b|[A-Za-z_]\w*\s*$)/.test(line) || !/\bexit\s+(?:\$|[1-9])/.test(line)) {
            offenders.push(`${file}: ${line.trim().slice(0, 100)}`);
          }
        }
        // Without `shell: bash` (or explicit `set -o pipefail`), GitHub Actions runs
        // `bash -e` without pipefail, so `node --test … | tee …` takes `tee`'s exit 0.
        if (/(?<!\|)\|(?!\|)/.test(unquoted) && !hasPipefail) {
          offenders.push(`${file} (missing pipefail): ${line.trim().slice(0, 100)}`);
        }
      }
    }
  }
  assert.deepEqual(offenders, [], 'a failing `node --test` must fail the step, not be excused by a fallback command or masked by a pipe');
});

// Jobs start at two spaces under `jobs:`; a job-level `if:` at four spaces can
// gate the whole job to a non-pull-request event even when the step has none.
function jobBlocks(source) {
  const lines = source.split('\n');
  const start = lines.findIndex(line => /^jobs:\s*$/.test(line));
  if (start < 0) return [];
  const jobs = [];
  let current = null;
  for (const line of lines.slice(start + 1)) {
    const job = line.match(/^ {2}([\w-]+):\s*$/);
    if (job) {
      if (current) jobs.push(current);
      current = { name: job[1], lines: [] };
    } else if (current) {
      if (/^\S/.test(line) && line.trim()) break;
      current.lines.push(line);
    }
  }
  if (current) jobs.push(current);
  return jobs;
}

function jobHasCondition(job) {
  // The single runner must be unconditional: any job-level `if:` can skip the
  // pull request (push gate, `!= 'pull_request'`, false constant), so none is
  // accepted rather than trying to evaluate expressions statically.
  return job.lines.some(line => /^ {4}if:/.test(line));
}

// Read the shell commands a step actually executes: drop YAML and shell
// comments, join backslash continuations, and fold `run: >` lines the way YAML
// does, so a commented-out suite is not counted and a wrapped duplicate is not
// missed. Literal (`run: |`) keeps its newlines.
function executableRun(step) {
  const lines = step.split('\n');
  const commands = [];
  let style = null;
  let block = [];
  const flush = () => {
    if (!block.length) return;
    commands.push(block.join(style === '>' ? ' ' : '\n'));
    block = [];
  };
  for (const line of lines) {
    const header = line.match(/^ {8}run:\s*([|>])[-+0-9]*\s*$/);
    if (header) { flush(); style = header[1]; continue; }
    if (/^ {8}run:\s*\S/.test(line)) {
      flush();
      style = null;
      const command = line.replace(/^ {8}run:\s*/, '').replace(/\s+#.*$/, '');
      if (!command.startsWith('#')) commands.push(command);
      continue;
    }
    if (/^ {6}- /.test(line)) { flush(); style = null; continue; }
    if (style === null) continue;
    const text = line.trim();
    if (!text || text.startsWith('#')) continue;
    block.push(text.replace(/\s+#.*$/, ''));
  }
  flush();
  return commands.join('\n').replace(/\\\n/g, ' ');
}

// Only a command that selects every `*.test.cjs` counts as the whole suite. A
// `find` with an exclusion is a subset and must not be mistaken for the gate.
function fullSuiteCommand(text) {
  return executableRun(text).split('\n').some(line => {
    if (!/node\s+--test\b/.test(line)) return false;
    // `node --test` with no path uses Node's default test discovery.
    if (/node\s+--test\s*$/.test(line)) return true;
    if (/tests\/\*\.test\.cjs(?![.\w])/.test(line)) return true;
    if (!/\$\(find tests\b/.test(line)) return false;
    const find = line.slice(line.indexOf('$('));
    return !/!(?!=)|-not\b/.test(find);
  });
}

// The suite must run on every pull request: neither the job nor the step may
// carry any `if:` condition, because each of them can skip pull requests.
function runsFullUnitSuite(source) {
  return jobBlocks(source).some(job =>
    !jobHasCondition(job) &&
    job.lines.join('\n').split(/^ {6}- /m).slice(1)
      .some(step => !/^ {8}if:/m.test(step) && fullSuiteCommand(step)));
}

// Sound glob inclusion for the filter forms Actions accepts: one pattern can
// cover another when they are equal, when it is `**`, or when it is a directory
// `prefix/**` and the other pattern lives under `prefix/`. This refuses to
// certify coverage that would depend on enumerating a finite set of samples.
function patternCovers(qaPattern, otherPattern) {
  const qa = qaPattern.replace(/^['"]|['"]$/g, '');
  const other = otherPattern.replace(/^['"]|['"]$/g, '');
  if (qa === '**' || qa === other) return true;
  if (!qa.endsWith('/**')) return false;
  const prefix = qa.slice(0, -2);
  // The boundary is the directory separator: `tests/x/**` must not be read as
  // covering `tests/xy/…`.
  return other.startsWith(prefix.endsWith('/') ? prefix : prefix + '/');
}

test('only Website QA runs the whole unit suite from a pull request', () => {
  // Sixteen pull-request workflows used to start `node --test tests/*.test.cjs`
  // on the same push. One failing assertion became sixteen red checks, and the
  // same 859 tests ran sixteen times; the feature workflows now keep only their
  // own browser journeys. The full suite still runs for every pull request,
  // exactly once, in the workflow with the widest path filter.
  const runners = pr.filter(entry => runsFullUnitSuite(entry.source)).map(entry => entry.file);
  assert.deepEqual(runners, ['website-qa.yml'],
    'the full unit suite must have exactly one pull-request runner; add coverage to Website QA instead of another copy');
});

test('the single unit-suite runner starts for every path the other pull-request workflows cover', () => {
  const website = pr.find(entry => entry.file === 'website-qa.yml');
  const gaps = [];
  for (const entry of pr) {
    if (entry.file === website.file) continue;
    for (const pattern of entry.paths) {
      if (!website.paths.some(candidate => patternCovers(candidate, pattern))) {
        gaps.push(`${entry.file} → ${pattern}`);
      }
    }
  }
  assert.deepEqual(gaps, [],
    'a workflow that no longer runs the unit suite must not trigger on a path Website QA ignores');
});

test('the unit-suite guard ignores runners that a pull request cannot reach', () => {
  // Each shape below still contains `node --test tests/*.test.cjs`, but none of
  // them runs the suite on a pull request. A guard that only greps for the
  // command would count them and pass with no suite executed.
  const workflow = ({ jobIf = '', stepIf = '', command = 'node --test tests/*.test.cjs' } = {}) => [
    'name: Fixture', 'on:', '  pull_request:', 'jobs:', '  browser:',
    ...(jobIf ? [`    if: ${jobIf}`] : []),
    '    runs-on: ubuntu-24.04', '    steps:', '      - name: Unit',
    ...(stepIf ? [`        if: ${stepIf}`] : []),
    '        run: |', `          ${command}`, ''
  ].join('\n');

  assert.equal(runsFullUnitSuite(workflow()), true, 'the plain form must count as the runner');
  assert.equal(runsFullUnitSuite(workflow({ jobIf: "github.event_name == 'push'" })), false, 'a push-gated job cannot run on a pull request');
  assert.equal(runsFullUnitSuite(workflow({ jobIf: "${{ github.event_name != 'pull_request' }}" })), false, 'an inverted pull-request gate skips every pull request');
  assert.equal(runsFullUnitSuite(workflow({ jobIf: 'false' })), false, 'a false job condition never runs');
  assert.equal(runsFullUnitSuite(workflow({ stepIf: "${{ github.ref == 'refs/heads/main' }}" })), false, 'a main-only step cannot run on a pull request');
  assert.equal(runsFullUnitSuite(workflow({ stepIf: '${{ false }}' })), false, 'a false step condition never runs');
  assert.equal(runsFullUnitSuite(workflow({ command: '# node --test tests/*.test.cjs' })), false, 'a commented-out suite executes nothing');
  assert.equal(runsFullUnitSuite(workflow({ command: 'node --test modules' })), false, 'only the suite glob counts');
  assert.equal(runsFullUnitSuite(workflow({ command: "node --test $(find tests -name '*.test.cjs' ! -name 'relevance.test.cjs')" })), false, 'a find with an exclusion selects a subset');
  assert.equal(runsFullUnitSuite(workflow({ command: "node --test $(find tests -name '*.test.cjs')" })), true, 'a find without exclusions selects the suite');
  assert.equal(runsFullUnitSuite(workflow({ command: 'node --test \\\n            tests/*.test.cjs' })), true, 'a wrapped command still runs the suite');
  assert.equal(runsFullUnitSuite(workflow({ command: 'node --test' })), true, 'bare node --test uses default discovery');

  // A folded `run: >` block executes its lines as one command.
  const folded = [
    'name: Fixture', 'on:', '  pull_request:', 'jobs:', '  browser:',
    '    runs-on: ubuntu-24.04', '    steps:', '      - name: Unit',
    '        run: >', '          node --test --test-reporter=tap', '          tests/*.test.cjs', ''
  ].join('\n');
  assert.equal(runsFullUnitSuite(folded), true, 'a folded run block is one command');
  const literal = folded.replace('run: >', 'run: |');
  assert.equal(runsFullUnitSuite(literal), false, 'a literal two-line block does not form the suite command');
});

test('trigger coverage is decided by glob inclusion, not by sampled paths', () => {
  assert.equal(patternCovers('**', 'tests/*/test.cjs'), true);
  assert.equal(patternCovers('tests/**', 'tests/*/test.cjs'), true, 'a directory glob covers every pattern below it');
  assert.equal(patternCovers('tests/**', 'tests/any/deep/test.cjs'), true);
  assert.equal(patternCovers('tests/**', 'index.html'), false);
  assert.equal(patternCovers('tests/x/**', 'tests/x/test.cjs'), true);
  assert.equal(patternCovers('tests/x/**', 'tests/xy/test.cjs'), false, 'a sibling directory with the same prefix is not covered');
  assert.equal(patternCovers('tests/x/**', 'tests/*/test.cjs'), false, 'two enumerated directories cannot be proven to cover one wildcard');
  assert.equal(patternCovers('index.html', 'index.html'), true);
  assert.equal(patternCovers('index.html', 'index.htm'), false);
});

test('a workflow edit runs the job that audits every workflow', () => {
  const website = pr.find(entry => entry.file === 'website-qa.yml');
  assert.ok(covers(website.paths, '.github/workflows/related-qa.yml'), 'editing a workflow must run the job that audits all workflows');
  assert.ok(covers(website.paths, '.github/workflows/task-labels-qa.yml'), 'a workflow without any pull_request trigger is the case that was invisible');
  const audit = fs.readFileSync(path.join(__dirname, 'published-check.test.cjs'), 'utf8');
  assert.match(audit, /readdirSync\(workflows\)/, 'published-check.test.cjs is the audit that has to run for workflow edits');
});
