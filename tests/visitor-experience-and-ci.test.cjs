'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '../assets/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8');
const searchSubmitCjs = fs.readFileSync(path.join(__dirname, 'search-submit-browser.cjs'), 'utf8');
const loadRecoveryCjs = fs.readFileSync(path.join(__dirname, 'load-recovery-live.cjs'), 'utf8');
const relevanceWorkflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/relevance-qa.yml'), 'utf8');
const submitWorkflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/search-submit-qa.yml'), 'utf8');

test('empty search state provides problem-oriented recovery chips in app.js', () => {
  assert.match(appJs, /empty-problem-suggestions/, 'app.js should render empty-problem-suggestions container');
  assert.match(appJs, /data-problem-tag/, 'problem suggestions must set data-problem-tag');
  assert.match(appJs, /日報/, 'problem suggestions should include 日報');
  assert.match(appJs, /發票/, 'problem suggestions should include 發票');
  assert.match(appJs, /PR/, 'problem suggestions should include PR');
});

test('assets/style.css defines responsive touch-accessible rules for empty problem suggestions', () => {
  assert.match(css, /\.empty-problem-suggestions\s*\{/, 'style.css must define .empty-problem-suggestions');
  assert.match(css, /\.recovery-problem-tag\s*\{[^}]*min-height:\s*44px/, '.recovery-problem-tag must have at least 44px touch target');
  assert.match(css, /\.recovery-problem-tag:focus-visible\s*\{/, '.recovery-problem-tag must have focus-visible styling');
});

test('tests/search-submit-browser.cjs handles WebKit button tab limitation gracefully', () => {
  assert.match(searchSubmitCjs, /webkit/, 'search-submit-browser.cjs should check for webkit engine');
  assert.ok(
    searchSubmitCjs.includes("name==='webkit'") || searchSubmitCjs.includes("engine==='webkit'"),
    'search-submit-browser.cjs must guard WebKit button Tab focus'
  );
});

test('tests/load-recovery-live.cjs validates all critical assets during deployment check', () => {
  assert.match(loadRecoveryCjs, /assets\/style\.css/, 'deployment readiness check must verify assets/style.css');
  assert.match(loadRecoveryCjs, /assets\/app\.js/, 'deployment readiness check must verify assets/app.js');
  assert.match(loadRecoveryCjs, /index\.html/, 'deployment readiness check must verify index.html');
});

test('GitHub Actions workflows provide sufficient polling window for Pages deployment', () => {
  // relevance-qa should allow at least 140 attempts (over 4.5 minutes)
  const relevanceMatch = relevanceWorkflow.match(/attempt\s*<\s*(\d+)/);
  assert.ok(relevanceMatch, 'relevance-qa.yml must contain attempt loop');
  assert.ok(parseInt(relevanceMatch[1], 10) >= 140, 'relevance-qa.yml should poll at least 140 attempts');

  // search-submit-qa should allow at least 120 attempts (over 5 minutes)
  const submitMatch = submitWorkflow.match(/range\((\d+)\)/);
  assert.ok(submitMatch, 'search-submit-qa.yml must contain attempt range');
  assert.ok(parseInt(submitMatch[1], 10) >= 120, 'search-submit-qa.yml should poll at least 120 attempts');
});
