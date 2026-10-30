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
const loadRecoveryCjs = fs.readFileSync(path.join(__dirname, 'load-recovery-live.cjs'), 'utf8');
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

test('published checks allow the observed 11m38s Pages deployment to finish', () => {
  const gates = [
    {
      label: 'partial load',
      workflow: '../.github/workflows/load-recovery-qa.yml',
      source: 'load-recovery-live.cjs',
      attempts: /deadline=Date\.now\(\)\+(\d+)/,
      interval: /setTimeout\(resolve,\s*(\d+)\)/,
      expectedMs: 900000
    },
    {
      label: 'corpus',
      workflow: '../.github/workflows/corpus-qa.yml',
      source: 'corpus-browser.cjs',
      attempts: /attempt<(\d+)/,
      interval: /setTimeout\(resolve,\s*(\d+)\)/,
      expectedMs: 900000
    },
    {
      label: 'return visibility',
      workflow: '../.github/workflows/return-visibility-qa.yml',
      source: 'return-visibility-browser.cjs',
      attempts: /attempt<(\d+)/,
      interval: /setTimeout\(resolve,\s*(\d+)\)/,
      expectedMs: 900000,
      terminalAttempt: /attempt===(\d+)\)throw/
    }
  ];
  for (const gate of gates) {
    const source = fs.readFileSync(path.join(__dirname, gate.source), 'utf8');
    const attemptsMatch = source.match(gate.attempts);
    const intervalMatch = source.match(gate.interval);
    assert.ok(attemptsMatch, `${gate.label} published check must have a bounded deadline`);
    assert.ok(intervalMatch, `${gate.label} published check must have a retry interval`);
    const budgetMs = gate.label === 'partial load'
      ? Number(attemptsMatch[1])
      : (Number(attemptsMatch[1]) - 1) * Number(intervalMatch[1]);
    assert.ok(budgetMs >= gate.expectedMs, `${gate.label} published check must cover 15 minutes`);
    if (gate.terminalAttempt) {
      const terminalMatch = source.match(gate.terminalAttempt);
      assert.ok(terminalMatch, `${gate.label} must fail after its final poll`);
      assert.equal(Number(terminalMatch[1]), Number(attemptsMatch[1]) - 1, `${gate.label} timeout must not skip the final poll`);
    }
    const workflow = fs.readFileSync(path.join(__dirname, gate.workflow), 'utf8');
    const publishedJob = ['corpus', 'return visibility'].includes(gate.label)
      ? workflow.split(/^  published:\s*$/m)[1]
      : workflow;
    assert.ok(publishedJob, `${gate.label} workflow must define the published job`);
    const timeoutMatch = publishedJob.match(/timeout-minutes:\s*(\d+)/);
    assert.ok(timeoutMatch && Number(timeoutMatch[1]) >= 25, `${gate.label} job must cover setup and deployment wait`);
  }
});



test('combined recovery published verification reuses the shared bounded gate', () => {
  assert.match(combinedRecoveryWorkflow, /waitForPublishedAssets/);
  const timeout = Number(combinedRecoveryWorkflow.match(/timeout-minutes:\s*(\d+)/)[1]);
  assert.ok(timeout >= 55, 'job must cover publication waiting plus preview and live journeys');
});


test('GitHub Actions workflows provide sufficient polling window for Pages deployment', () => {
  assert.match(relevanceWorkflow, /waitForPublishedAssets/, 'relevance must reuse the shared deadline');

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

test('related reading waits for all live assets in one bounded publication round', () => {
  const source = fs.readFileSync(path.join(__dirname, 'related-browser.cjs'), 'utf8');
  assert.match(source, /await waitForPublishedAssets/);
  assert.match(source, /files:\['assets\/app\.js','assets\/reader\.css'\]/);
});

test('related-qa.yml allows at least 25 minutes for setup and published verification', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/related-qa.yml'), 'utf8');
  const timeoutMatch = workflow.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(timeoutMatch, 'related-qa.yml must bound its job duration');
  assert.ok(Number(timeoutMatch[1]) >= 25, 'related reading timeout must cover setup plus its published-asset poll');
});

test('facet-counts-qa.yml bounds job duration to cover published-version poll (>= 25 minutes)', () => {
  const facetWorkflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/facet-counts-qa.yml'), 'utf8');
  const timeoutMatch = facetWorkflow.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(timeoutMatch, 'facet-counts-qa.yml must bound its job duration');
  assert.ok(Number(timeoutMatch[1]) >= 25, 'job timeout must cover setup plus published-version poll');
});

test('source-guide published verification covers observed Pages deployment latency', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/source-guide-qa.yml'), 'utf8');
  const published = workflow.split(/^  published:\s*$/m)[1];
  assert.ok(published, 'source-guide-qa.yml must define its published job');
  const pollMatch = published.match(/for\(let attempt=0;attempt<(\d+);attempt\+\+\)/);
  const intervalMatch = published.match(/setTimeout\(resolve,(\d+)\)/);
  const timeoutMatch = published.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(pollMatch, 'published source-guide job must contain a bounded asset poll');
  assert.ok(intervalMatch, 'published source-guide job must define its polling interval');
  assert.ok(Number(pollMatch[1]) * Number(intervalMatch[1]) >= 15 * 60 * 1000, 'asset poll must cover the measured 11m38s deployment with margin');
  assert.ok(timeoutMatch && Number(timeoutMatch[1]) >= 25, 'job timeout must cover the asset poll');
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
  assert.ok(Number(missingTimeout[1]) >= 25, 'missing-case-qa.yml must allow at least 25 minutes');

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
