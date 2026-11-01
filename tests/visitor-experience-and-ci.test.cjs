'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
test('GitHub Actions avoid floating Ubuntu runner images', () => {
  const workflowDir = path.join(__dirname, '../.github/workflows');
  const workflows = fs.readdirSync(workflowDir).filter(file => /\.(?:yml|yaml)$/.test(file));
  const floating = workflows.filter(file => /runs-on:\s*['"]?ubuntu-latest\b/.test(fs.readFileSync(path.join(workflowDir, file), 'utf8')));
  assert.deepEqual(floating, [], `workflows must pin a supported Ubuntu runner instead of ubuntu-latest: ${floating.join(', ')}`);
});

const css = fs.readFileSync(path.join(__dirname, '../assets/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8');
const searchSubmitCjs = fs.readFileSync(path.join(__dirname, 'search-submit-browser.cjs'), 'utf8');
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




test('combined recovery published verification reuses the shared bounded gate', () => {
  assert.match(combinedRecoveryWorkflow, /waitForPublishedAssets/);
  const timeout = Number(combinedRecoveryWorkflow.match(/timeout-minutes:\s*(\d+)/)[1]);
  const {PUBLICATION_TIMEOUT_MS}=require('../scripts/published-assets.cjs');
  assert.ok(timeout*60000>=PUBLICATION_TIMEOUT_MS+20*60000, 'job must cover publication waiting plus preview and live journeys');
});


test('GitHub Actions workflows provide sufficient polling window for Pages deployment', () => {
  assert.match(relevanceWorkflow, /waitForPublishedAssets/, 'relevance must reuse the shared deadline');

  const submitMatch = submitWorkflow.match(/range\((\d+)\)/);
  assert.ok(submitMatch, 'search-submit-qa.yml must contain attempt range');
  assert.ok(parseInt(submitMatch[1], 10) >= 120, 'search-submit-qa.yml should poll at least 120 attempts');
});


test('related reading waits for all live assets in one bounded publication round', () => {
  const source = fs.readFileSync(path.join(__dirname, 'related-browser.cjs'), 'utf8');
  assert.match(source, /await waitForPublishedAssets/);
  assert.match(source, /files:\['assets\/app\.js','assets\/reader\.css'\]/);
});

test('related-qa.yml reserves setup and browser time beyond the shared publication deadline', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/related-qa.yml'), 'utf8');
  const timeoutMatch = workflow.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(timeoutMatch, 'related-qa.yml must bound its job duration');
  const {PUBLICATION_TIMEOUT_MS}=require('../scripts/published-assets.cjs');
  assert.ok(Number(timeoutMatch[1])*60000>=PUBLICATION_TIMEOUT_MS+20*60000, 'related reading timeout must cover setup plus its published-asset poll');
});

test('facet-counts-qa.yml reserves 25 minutes beyond the shared published-version deadline', () => {
  const facetWorkflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/facet-counts-qa.yml'), 'utf8');
  const timeoutMatch = facetWorkflow.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(timeoutMatch, 'facet-counts-qa.yml must bound its job duration');
  const {PUBLICATION_TIMEOUT_MS}=require('../scripts/published-assets.cjs');
  assert.ok(Number(timeoutMatch[1])*60000>=PUBLICATION_TIMEOUT_MS+25*60000, 'job timeout must cover setup plus published-version poll');
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

test('multi-engine browser workflows provide resilient timeout budget (>= 25 minutes)', () => {
  const outlineWorkflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/outline-find-qa.yml'), 'utf8');
  const missingWorkflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/missing-case-qa.yml'), 'utf8');
  const returnWorkflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/return-visibility-qa.yml'), 'utf8');

  const outlineTimeout = outlineWorkflow.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(outlineTimeout, 'outline-find-qa.yml must specify timeout-minutes');
  assert.ok(Number(outlineTimeout[1]) >= 25, 'outline-find-qa.yml must allow at least 25 minutes for 3 browser engines');

  const missingTimeout = missingWorkflow.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(missingTimeout, 'missing-case-qa.yml must specify timeout-minutes');
  const {PUBLICATION_TIMEOUT_MS}=require('../scripts/published-assets.cjs');
  assert.ok(Number(missingTimeout[1])*60000>=PUBLICATION_TIMEOUT_MS+20*60000, 'missing-case-qa.yml must preserve setup and browser time beyond publication waiting');

  const returnMatches = [...returnWorkflow.matchAll(/timeout-minutes:\s*(\d+)/g)];
  assert.ok(returnMatches.length >= 2, 'return-visibility-qa.yml must specify timeout-minutes for both jobs');
  for (const match of returnMatches) {
    assert.ok(Number(match[1]) >= 25, 'return-visibility-qa.yml jobs must allow at least 25 minutes');
  }
});

test('card renders scenario badge in card-top for immediate problem-orientation', () => {
  const updatedAppJs = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8');
  const updatedCss = fs.readFileSync(path.join(__dirname, '../assets/style.css'), 'utf8');
  assert.match(updatedAppJs, /card-scenario/, 'app.js must render .card-scenario');
  assert.match(updatedAppJs, /scenarioBadge\.dataset\.scenario/, 'card-scenario must set dataset.scenario');
  assert.match(updatedCss, /\.card-scenario\s*\{/, 'style.css must style .card-scenario');
  assert.match(updatedCss, /\.card-scenario\[data-scenario="生活"\]/, 'style.css must define scenario-specific badge styles');
});
