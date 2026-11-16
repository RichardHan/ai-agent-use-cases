'use strict';
// A workflow step that decides at runtime whether its test file exists can be
// turned off by renaming that one file, and GitHub still reports the job green.
// The observed case was `website-qa.yml`'s `Verify the updated site in Chromium`
// step: its `if: hashFiles('tests/discovery-browser.cjs') != ''` guard skipped
// ~33 browser journeys whenever that file was renamed or deleted, and nothing in
// `tests/` mentioned the guard. Ten such guards existed across six workflows,
// several keyed on a unit test while the step actually ran browser suites.
//
// Two properties keep the gate honest:
//   1. No workflow may decide at runtime whether to run a step based on file
//      existence. A missing test file must fail the run, not shrink it.
//   2. Every `tests/…` and `scripts/…` file a workflow invokes must exist in the
//      checkout, so a rename is caught by the unit suite before CI skips it.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const workflows = fs.readdirSync(path.join(root, '.github', 'workflows'))
  .filter(file => file.endsWith('.yml')).sort();
const read = file => fs.readFileSync(path.join(root, '.github', 'workflows', file), 'utf8');

test('no workflow skips a step when a test file is missing', () => {
  const offenders = [];
  for (const file of workflows) {
    read(file).split('\n').forEach((line, index) => {
      if (/hashFiles\(/.test(line)) offenders.push(`${file}:${index + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [],
    'file-existence guards turn "the test file moved" into a green job with no coverage: ' +
    offenders.join(' | '));
});

test('every test and script a workflow runs exists in the checkout', () => {
  const missing = [];
  for (const file of workflows) {
    const source = read(file);
    // A step may write a throwaway copy from git history (`git show <sha>:tests/x.cjs
    // > tests/x-before.cjs`); that path is not in the checkout on purpose.
    const generated = new Set(
      [...source.matchAll(/>\s*((?:tests|scripts)\/[\w.-]+\.(?:cjs|mjs|js|py))/g)].map(match => match[1]));
    const lines = source.split('\n')
      // A commented-out command is documentation, not a step that runs.
      .filter(line => !/^\s*#/.test(line));
    for (const line of lines) {
      for (const match of line.matchAll(/(?:^|[\s"'=(])((?:tests|scripts)\/[\w.-]+\.(?:cjs|mjs|js|py))/g)) {
        const target = match[1];
        if (generated.has(target)) continue;
        if (!fs.existsSync(path.join(root, target))) missing.push(`${file}: ${target}`);
      }
    }
  }
  assert.deepEqual(missing, [], 'workflow invokes files that do not exist: ' + missing.join(', '));
});

test('the Chromium browser journeys cannot be skipped and still cover discovery', () => {
  const workflow = read('website-qa.yml');
  const step = workflow.split('\n      - name: ').find(block => block.startsWith('Verify the updated site in Chromium'));
  assert.ok(step, 'the Chromium browser step must stay named "Verify the updated site in Chromium"');
  assert.doesNotMatch(step.split('\n').slice(1, 2).join(''), /^\s+if:/,
    'the browser step must run unconditionally: a skipped step is a green job');
  assert.match(step, /node tests\/discovery-browser\.cjs/,
    'the browser step must still run the discovery journeys');
});
