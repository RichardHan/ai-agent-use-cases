'use strict';
// A workflow step that decides at runtime whether its test file exists can be
// turned off by renaming that one file, and GitHub still reports the job green.
// The observed case was `website-qa.yml`'s `Verify the updated site in Chromium`
// step: its `if: hashFiles('tests/discovery-browser.cjs') != ''` guard skipped
// ~33 browser journeys whenever that file was renamed or deleted, and nothing in
// `tests/` mentioned the guard. Ten such guards existed across seven workflows,
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
      // A comment may explain why the guard is forbidden; it cannot skip a step.
      if (/^\s*#/.test(line)) return;
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

// One workflow step, from its `- name:` list item to the next step or job key.
// Step keys sit at eight spaces and `run:` content is deeper, so an `if:` anywhere
// at eight spaces skips the step even when it appears after `env:`. YAML comments
// may sit at any indentation and never end the step, so only a new list item at six
// spaces or a key at four spaces or less is a boundary.
function stepBlock(source, name) {
  const lines = source.split('\n');
  const start = lines.findIndex(line => line === `      - name: ${name}`);
  assert.notEqual(start, -1, `the step must stay named "${name}"`);
  const block = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    if (!/^\s*#/.test(line) && (/^ {0,6}- /.test(line) || /^ {0,4}\S/.test(line))) break;
    block.push(line);
  }
  return block;
}

function runnableRun(block) {
  const code = block.filter(line => !/^\s*#/.test(line));
  const start = code.findIndex(line => /^ {8}run: \|\s*$/.test(line));
  assert.notEqual(start, -1, 'the step must still have a block `run:` command');
  const lines = [];
  for (const line of code.slice(start + 1)) {
    if (line.trim() !== '' && !/^ {9,}\S/.test(line)) break;
    lines.push(line);
  }
  return lines.join('\n');
}

test('the Chromium browser journeys cannot be skipped and still cover discovery', () => {
  const block = stepBlock(read('website-qa.yml'), 'Verify the updated site in Chromium');
  const stepKeys = block
    .filter(line => /^ {8}\S/.test(line))
    .map(line => line.trim());
  assert.ok(!stepKeys.some(key => key.startsWith('if:')),
    'the browser step must run unconditionally; an `if:` anywhere in the step is a green skip: ' +
    stepKeys.join(' '));
  assert.match(runnableRun(block), /(?:^|\s)node tests\/discovery-browser\.cjs/,
    'the browser step must still run the discovery journeys (a commented-out command does not count)');
});
