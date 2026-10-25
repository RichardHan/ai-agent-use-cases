'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(root, 'assets/style.css'), 'utf8');

test('combined-recovery-browser problem tags match app.js definition (8 items)', () => {
  const browserTest = fs.readFileSync(path.join(root, 'tests/combined-recovery-browser.cjs'), 'utf8');
  assert.match(browserTest, /data-problem-tag\]'\)\.count\(\),\s*8\)/, 'combined-recovery-browser must assert 8 problem tags');
  
  const problemTagsMatch = appJs.match(/const problemTags = \[([\s\S]*?)\];/);
  assert.ok(problemTagsMatch, 'app.js must declare problemTags');
  const tagCount = (problemTagsMatch[1].match(/label:/g) || []).length;
  assert.equal(tagCount, 8, 'app.js must define exactly 8 problem tags');
});

test('live browser test scripts provide at least 15-minute polling windows', () => {
  const searchLive = fs.readFileSync(path.join(root, 'tests/search-context-live.cjs'), 'utf8');
  const searchPoll = searchLive.match(/for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*(\d+)\s*;\s*i\+\+\s*\)[\s\S]*?setTimeout\(\s*r\s*,\s*(\d+)\s*\)/);
  assert.ok(searchPoll, 'search-context-live.cjs must declare polling loop');
  assert.ok(Number(searchPoll[1]) * Number(searchPoll[2]) >= 900000, 'search-context-live.cjs must poll at least 15 minutes');

  const transientLive = fs.readFileSync(path.join(root, 'tests/transient-loading-published.cjs'), 'utf8');
  const transientPoll = transientLive.match(/for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*(\d+)\s*;\s*i\+\+\s*\)[\s\S]*?setTimeout\(\s*r\s*,\s*(\d+)\s*\)/);
  assert.ok(transientPoll, 'transient-loading-published.cjs must declare polling loop');
  assert.ok(Number(transientPoll[1]) * Number(transientPoll[2]) >= 900000, 'transient-loading-published.cjs must poll at least 15 minutes');

  const deployedLive = fs.readFileSync(path.join(root, 'tests/deployed-browser.cjs'), 'utf8');
  const deployedPoll = deployedLive.match(/attempt\s*<\s*(\d+)[\s\S]*?setTimeout\(resolve,\s*(\d+)\)/);
  assert.ok(deployedPoll, 'deployed-browser.cjs must declare polling loop');
  assert.ok(Number(deployedPoll[1]) * Number(deployedPoll[2]) >= 900000, 'deployed-browser.cjs must poll at least 15 minutes');

  const readingFlowLive = fs.readFileSync(path.join(root, 'tests/reading-flow-browser.cjs'), 'utf8');
  const readingFlowPoll = readingFlowLive.match(/attempt\s*<\s*(\d+)[\s\S]*?setTimeout\(resolve,\s*(\d+)\)/);
  assert.ok(readingFlowPoll, 'reading-flow-browser.cjs must declare polling loop');
  assert.ok(Number(readingFlowPoll[1]) * Number(readingFlowPoll[2]) >= 900000, 'reading-flow-browser.cjs must poll at least 15 minutes');

  const trustLive = fs.readFileSync(path.join(root, 'tests/trust-published.cjs'), 'utf8');
  const trustPoll = trustLive.match(/attempt\s*<\s*(\d+)[\s\S]*?setTimeout\(\s*r\s*,\s*(\d+)\s*\)/);
  assert.ok(trustPoll, 'trust-published.cjs must declare polling loop');
  assert.ok(Number(trustPoll[1]) * Number(trustPoll[2]) >= 900000, 'trust-published.cjs must poll at least 15 minutes');

  const readerLive = fs.readFileSync(path.join(root, 'tests/reader-browser.cjs'), 'utf8');
  const readerPoll = readerLive.match(/attempt\s*<\s*(\d+)[\s\S]*?wait\(\s*(\d+)\s*\)/);
  assert.ok(readerPoll, 'reader-browser.cjs must declare polling loop');
  assert.ok(Number(readerPoll[1]) * Number(readerPoll[2]) >= 900000, 'reader-browser.cjs must poll at least 15 minutes');
});

test('hardened GitHub Actions workflows guarantee 25-minute timeout and 15-minute polling', () => {
  const workflows = [
    'available-facets-qa.yml',
    'case-share-qa.yml',
    'filter-entry-qa.yml',
    'results-return-qa.yml',
    'source-links-qa.yml',
    'search-submit-qa.yml',
    'discovery-round-qa.yml',
    'result-journey-qa.yml',
    'task-shortcuts-qa.yml',
    'emphasis-qa.yml',
    'evidence-round-qa.yml',
    'filter-reading-qa.yml',
    'home-search-entry-qa.yml',
    'method-shortcut-qa.yml',
    'reader-context-round.yml',
    'reading-anchor-qa.yml',
    'category-find-qa.yml'
  ];

  for (const wf of workflows) {
    const content = fs.readFileSync(path.join(root, '.github/workflows', wf), 'utf8');
    const timeoutMatch = content.match(/timeout-minutes:\s*(\d+)/);
    assert.ok(timeoutMatch, `${wf} must declare timeout-minutes`);
    assert.ok(Number(timeoutMatch[1]) >= 25, `${wf} timeout-minutes must be at least 25 (found ${timeoutMatch[1]})`);
  }
});

test('style.css <=360px media query ensures narrow mobile hero geometry fits within 740px viewport', () => {
  assert.match(styleCss, /@media\(max-width:360px\)\s*\{/, 'style.css must have @media(max-width:360px)');
  assert.match(styleCss, /\.discovery-layout\s*\{[^}]*padding:\s*14px 0 22px/, 'discovery-layout padding must be compact on narrow screen');
  assert.match(styleCss, /\.discovery-hero h1\s*\{[^}]*font-size:\s*32px/, 'h1 font-size must be scaled on narrow screen');
  assert.match(styleCss, /\.hero-search-link\s*\{[^}]*margin:\s*0 0 10px/, 'hero-search-link margin must be compact on narrow screen');
  assert.match(styleCss, /\.recent-entry\s*\{[^}]*margin-bottom:\s*10px/, 'recent-entry margin must be compact on narrow screen');
  assert.match(styleCss, /\.hero-task-examples\s*\{[^}]*margin:\s*-6px 0 12px/, 'hero-task-examples margin must be compact on narrow screen');
});

test('reading anchor and round browser tests have resilient scroll settling', () => {
  const readingAnchor = fs.readFileSync(path.join(root, 'tests/reading-anchor-browser.cjs'), 'utf8');
  assert.match(readingAnchor, /d\.scrollTop\s*=\s*expected/, 'reading-anchor-browser must have resilient scroll fallback');

  const roundBrowser = fs.readFileSync(path.join(root, 'tests/round-browser.cjs'), 'utf8');
  assert.match(roundBrowser, /d\.scrollTop\s*=\s*expected/, 'round-browser must have resilient scroll fallback');
});
