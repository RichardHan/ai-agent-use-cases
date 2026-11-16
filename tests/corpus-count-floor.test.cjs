'use strict';
// Adding one case that mentions 一次性 turned the unit suite red: two assertions
// pinned the live corpus at 31 and 17. The hero directory has the same shape.
// Four tests required exactly 53 links, or 56 once the three example links were
// added, so growing the directory failed CI even though the contract is "do not
// shrink it". Floors keep today's recall. This file is not scanned: the
// injection below has to contain the forbidden form.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const testsDir = __dirname;
const self = path.basename(__filename);

function snapshotPins(filename, source) {
  const offenders = [];
  source.split('\n').forEach((line, index) => {
    if (/^\s*\/\//.test(line)) return;
    if (/assert\.equal\(\s*(?:singleMatches|otpMatches)\.length\s*,\s*\d+\b/.test(line)) {
      offenders.push(`${filename}:${index + 1}: corpus recall pinned: ${line.trim()}`);
    }
    if (/assert\.equal\(\s*(?:links\.length|healthy\.tasks|total)\s*,\s*(?:53|56)\b/.test(line)) {
      offenders.push(`${filename}:${index + 1}: task directory pinned: ${line.trim()}`);
    }
  });
  return offenders;
}

function readTest(name) {
  return fs.readFileSync(path.join(testsDir, name), 'utf8');
}

test('live corpus hit counts and the hero directory are floors, not snapshots', () => {
  const offenders = [];
  for (const file of fs.readdirSync(testsDir).filter(name => name.endsWith('.cjs') && name !== self)) {
    offenders.push(...snapshotPins(file, readTest(file)));
  }
  assert.deepEqual(offenders, [],
    'exact equality turns the next case or task link into a red suite:\n' + offenders.join('\n'));
});

test('recall floors stay at or above the counts observed before this round', () => {
  const queries = readTest('problem-compound-queries.test.cjs');
  const single = queries.match(/singleMatches\.length\s*>=\s*(\d+)/);
  const otp = queries.match(/otpMatches\.length\s*>=\s*(\d+)/);
  assert.ok(single && Number(single[1]) >= 31, '一次性 floor must stay at least 31');
  assert.ok(otp && Number(otp[1]) >= 17, '一次性 密碼 floor must stay at least 17');
  for (const [file, pattern] of [
    ['mobile-problem-tags.test.cjs', /links\.length\s*>=\s*(\d+)/],
    ['mobile-problem-tags-browser.cjs', /total\s*>=\s*(\d+)/],
    ['hero-load-failure-browser.cjs', /healthy\.tasks\s*>=\s*(\d+)/],
    ['task-coverage-marker-browser.cjs', /directory\s*>=\s*(\d+)/]
  ]) {
    const match = readTest(file).match(pattern);
    assert.ok(match && Number(match[1]) >= 53, `${file} must keep a directory floor of at least 53`);
  }
});

test('changing a floor back to exact equality is reported', () => {
  const queries = readTest('problem-compound-queries.test.cjs')
    .replace('assert.ok(singleMatches.length >= 31', 'assert.equal(singleMatches.length, 31')
    .replace('assert.ok(otpMatches.length >= 17', 'assert.equal(otpMatches.length, 17');
  assert.equal(snapshotPins('problem-compound-queries.test.cjs', queries).length, 2);

  const hero = readTest('mobile-problem-tags.test.cjs')
    .replace('assert.ok(links.length >= 53', 'assert.equal(links.length, 53');
  assert.equal(snapshotPins('mobile-problem-tags.test.cjs', hero).length, 1);

  const browser = readTest('mobile-problem-tags-browser.cjs')
    .replace('assert.ok(total >= 53', 'assert.equal(total, 53');
  assert.equal(snapshotPins('mobile-problem-tags-browser.cjs', browser).length, 1);

  const healthy = readTest('hero-load-failure-browser.cjs')
    .replace('assert.ok(healthy.tasks >= 53', 'assert.equal(healthy.tasks, 53');
  assert.equal(snapshotPins('hero-load-failure-browser.cjs', healthy).length, 1);

  const coverage = 'assert.equal(links.length, 56, "three task entries plus the 53-task directory");';
  assert.equal(snapshotPins('task-coverage-marker-browser.cjs', coverage).length, 1);

  const floor = 'assert.ok(singleMatches.length >= 31);\nassert.ok(links.length >= 53);';
  assert.deepEqual(snapshotPins('fixture.cjs', floor), []);
});
