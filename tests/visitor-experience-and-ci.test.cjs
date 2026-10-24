'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '../assets/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8');
const searchSubmitCjs = fs.readFileSync(path.join(__dirname, 'search-submit-browser.cjs'), 'utf8');
const loadRecoveryCjs = fs.readFileSync(path.join(__dirname, 'load-recovery-live.cjs'), 'utf8');
const cardRefinementWorkflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/card-refinement-qa.yml'), 'utf8');
const combinedRecoveryWorkflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/combined-recovery-qa.yml'), 'utf8');
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

test('card-refinement published verification covers observed Pages deployment latency', () => {
  const pollMatch = cardRefinementWorkflow.match(/for\s*\(let i=0;i<(\d+);i\+\+\)/);
  assert.ok(pollMatch, 'card-refinement-qa.yml must contain a bounded published-asset poll');
  assert.ok(Number(pollMatch[1]) >= 450, 'poll must allow at least 15 minutes for Pages assets');

  const timeoutMatch = cardRefinementWorkflow.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(timeoutMatch, 'card-refinement-qa.yml must bound its job duration');
  assert.ok(Number(timeoutMatch[1]) >= 25, 'job timeout must cover setup plus the published-asset poll');
});


test('combined recovery published verification covers observed Pages deployment latency', () => {
  const pollMatch = combinedRecoveryWorkflow.match(/for\s*\(let i=0;i<(\d+);i\+\+\)/);
  assert.ok(pollMatch, 'combined-recovery-qa.yml must contain a bounded published-asset poll');
  assert.ok(Number(pollMatch[1]) >= 300, 'poll must allow at least 15 minutes for Pages assets');

  const timeoutMatch = combinedRecoveryWorkflow.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(timeoutMatch, 'combined-recovery-qa.yml must bound its job duration');
  assert.ok(Number(timeoutMatch[1]) >= 25, 'job timeout must cover setup plus the published-asset poll');
});
test('GitHub Actions workflows provide sufficient polling window for Pages deployment', () => {
  const relevanceMatch = relevanceWorkflow.match(/attempt\s*<\s*(\d+)/);
  assert.ok(relevanceMatch, 'relevance-qa.yml must contain attempt loop');
  assert.ok(parseInt(relevanceMatch[1], 10) >= 140, 'relevance-qa.yml should poll at least 140 attempts');

  const submitMatch = submitWorkflow.match(/range\((\d+)\)/);
  assert.ok(submitMatch, 'search-submit-qa.yml must contain attempt range');
  assert.ok(parseInt(submitMatch[1], 10) >= 120, 'search-submit-qa.yml should poll at least 120 attempts');
});

test('published-version.cjs covers observed Pages deployment latency (>= 300 attempts / 15 minutes)', () => {
  const publishedVersionCjs = fs.readFileSync(path.join(__dirname, 'published-version.cjs'), 'utf8');
  const pollMatch = publishedVersionCjs.match(/attempt\s*<\s*(\d+)/);
  assert.ok(pollMatch, 'published-version.cjs must contain bounded attempt loop');
  assert.ok(Number(pollMatch[1]) >= 300, 'published-version.cjs should poll at least 300 attempts');
});

test('facet-counts-qa.yml bounds job duration to cover published-version poll (>= 25 minutes)', () => {
  const facetWorkflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/facet-counts-qa.yml'), 'utf8');
  const timeoutMatch = facetWorkflow.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(timeoutMatch, 'facet-counts-qa.yml must bound its job duration');
  assert.ok(Number(timeoutMatch[1]) >= 25, 'job timeout must cover setup plus published-version poll');
});

test('search-hint provides plain-language AND mental model and accessible error announcement', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.match(indexHtml, /id="search-hint"/, 'index.html must define #search-hint');
  assert.match(indexHtml, /支援多詞同時符合（AND）/, 'search-hint must explain multi-term AND behavior');
  assert.match(indexHtml, /aria-describedby="[^"]*search-hint/, '#query must reference search-hint via aria-describedby');
  assert.match(indexHtml, /<div id="error" class="empty" role="alert" aria-live="assertive"/, '#error must have role="alert" and aria-live="assertive"');
  assert.match(css, /\.search-hint\s*\{/, 'style.css must define .search-hint styling');
  assert.match(css, /\.active-filter:focus-visible\s*\{/, 'style.css must define focus-visible for .active-filter');
});
