'use strict';
// The release gate could only see the live site, so a deployment that had already
// failed looked exactly like one that had not finished: on 2026-11-10 the Pages
// deploy for `99734627` failed at 01:19:29 and the gate kept polling until the next
// push cancelled it at 01:42:07 (run 42733562130). The commit ended "cancelled",
// which reads as "replaced", not "the deployment failed". These tests hold the two
// halves of the fix: ask GitHub what the deploy for this SHA did, and never let a
// new push erase the verdict for an older merge.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { publicationStatus, classify, pickRun } = require('../scripts/publication-status.cjs');
const { waitForPublishedAssets, PUBLICATION_TIMEOUT_MS } = require('../scripts/published-assets.cjs');
const { waitForPublishedVersion } = require('./published-version.cjs');
const { blobHash } = require('../scripts/published-check.cjs');

const pagesWorkflow = name => name === 'pages build and deployment';

test('an unfinished Pages run is not a verdict, and a rerun supersedes an earlier failure', () => {
  assert.equal(classify(null).state, 'pending');
  assert.equal(classify({ status: 'in_progress', html_url: 'u' }).state, 'pending');
  assert.equal(classify({ status: 'queued' }).state, 'pending');
  assert.equal(classify({ status: 'completed', conclusion: 'success', html_url: 'u' }).state, 'succeeded');
  for (const conclusion of ['failure', 'timed_out', 'startup_failure']) {
    const verdict = classify({ status: 'completed', conclusion, html_url: 'u' });
    assert.equal(verdict.state, 'failed', conclusion);
    assert.equal(verdict.runUrl, 'u');
  }
  // A cancelled or skipped Pages run published nothing, so it proves nothing: the
  // window keeps running rather than turning into a false red.
  assert.equal(classify({ status: 'completed', conclusion: 'cancelled' }).state, 'pending');
  assert.equal(classify({ status: 'completed', conclusion: 'skipped' }).state, 'pending');

  const runs = [
    { head_sha: 'a', name: 'pages build and deployment', created_at: '2026-11-10T01:08:13Z', status: 'completed', conclusion: 'failure' },
    { head_sha: 'a', name: 'pages build and deployment', created_at: '2026-11-10T02:08:13Z', status: 'completed', conclusion: 'success' },
    { head_sha: 'b', name: 'pages build and deployment', created_at: '2026-11-10T03:08:13Z', status: 'completed', conclusion: 'failure' },
    { head_sha: 'a', name: 'Website QA', created_at: '2026-11-10T04:08:13Z', status: 'completed', conclusion: 'failure' }
  ];
  const picked = pickRun(runs, 'a');
  assert.equal(picked.conclusion, 'success', 'a rerun of the same SHA decides');
  assert.equal(classify(pickRun(runs, 'c')).state, 'pending');
  assert.ok(pagesWorkflow(picked.name));
});

test('a rerun is the newest activity, not the newest creation', async () => {
  // A rerun keeps created_at and gets a new updated_at + run_attempt.
  const runs = [
    { head_sha: 'a', name: 'pages build and deployment', created_at: '2026-11-10T01:00:00Z', updated_at: '2026-11-10T03:00:00Z', run_attempt: 2, status: 'completed', conclusion: 'success', html_url: 'run/rerun' },
    { head_sha: 'a', name: 'pages build and deployment', created_at: '2026-11-10T02:00:00Z', updated_at: '2026-11-10T02:10:00Z', run_attempt: 1, status: 'completed', conclusion: 'failure', html_url: 'run/later' }
  ];
  assert.equal(pickRun(runs, 'a').html_url, 'run/rerun');
  assert.equal(classify(pickRun(runs, 'a')).state, 'succeeded');
});

test('the API is only trusted when it answers, and never to guess a verdict', async () => {
  const calls = [];
  const respond = body => async (url, options) => {
    calls.push({ url: String(url), options });
    return { ok: true, json: async () => body };
  };
  const repository = 'RichardHan/ai-agent-use-cases', token = 't';
  assert.equal((await publicationStatus({ sha: 'abc', repository: undefined, token })).state, 'unknown');
  assert.equal((await publicationStatus({ sha: 'abc', repository, token: '' })).state, 'unknown');
  assert.equal((await publicationStatus({
    sha: 'abc', repository, token,
    fetchImpl: async () => { throw Error('offline'); }
  })).state, 'unknown');
  assert.equal((await publicationStatus({
    sha: 'abc', repository, token,
    fetchImpl: async () => ({ ok: false, status: 403 })
  })).state, 'unknown');
  const unreadable = await publicationStatus({
    sha: 'abc', repository, token,
    fetchImpl: async () => ({ ok: true, json: async () => { throw Error('Unexpected token < in JSON: "<html>secret-api-response</html>"'); } })
  });
  assert.equal(unreadable.state, 'unknown');
  assert.doesNotMatch(unreadable.reason, /secret|html/i, 'a parser error quotes the body it could not read');
  const offline = await publicationStatus({
    sha: 'abc', repository, token,
    fetchImpl: async () => { throw Object.assign(Error('connect ECONNREFUSED https://api.github.com/repos/secret'), { code: 'ECONNREFUSED' }); }
  });
  assert.equal(offline.reason, 'request failed (ECONNREFUSED)', 'the reason names the code, not the URL');
  const failed = await publicationStatus({
    sha: 'abc', repository, token,
    fetchImpl: respond({ workflow_runs: [{ head_sha: 'abc', name: 'pages build and deployment', status: 'completed', conclusion: 'failure', html_url: 'run/1' }] })
  });
  assert.equal(failed.state, 'failed');
  assert.equal(failed.runUrl, 'run/1');
  const url = new URL(calls.at(-1).url);
  assert.equal(url.pathname, '/repos/RichardHan/ai-agent-use-cases/actions/runs');
  assert.equal(url.searchParams.get('head_sha'), 'abc');
  assert.match(calls.at(-1).options.headers.authorization, /^Bearer /);
});

test('a fatal publication verdict ends the wait instead of spending the window', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'published-fatal-'));
  try {
    const file = path.join(dir, 'asset.js');
    fs.writeFileSync(file, 'current');
    let clock = 0, polls = 0;
    await assert.rejects(waitForPublishedAssets({
      base: 'https://example.test/project/', sha: 'abc', files: [file],
      isCurrent: () => true, now: () => clock, sleep: async ms => { clock += ms; },
      fetchAsset: async () => { polls++; return { ok: true, arrayBuffer: async () => Buffer.from('stale') }; },
      verify: async () => {
        polls++;
        throw Object.assign(Error('The Pages deployment for abc failed (failure)'), { fatal: true });
      }
    }), /The Pages deployment for abc failed/);
    assert.equal(clock, 0, 'a finished deploy is not a slow deploy');
    assert.ok(polls <= 2, 'the first round already knows the answer (asset + verdict): ' + polls);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a retryable error keeps polling and names the code instead of the response body', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'published-retry-'));
  try {
    const file = path.join(dir, 'asset.js');
    fs.writeFileSync(file, 'current');
    let clock = 0;
    await assert.rejects(waitForPublishedAssets({
      base: 'https://example.test/project/', sha: 'abc', files: [file], attempts: 2, interval: 1,
      isCurrent: () => true, now: () => clock, sleep: async ms => { clock += ms; },
      fetchAsset: async () => { throw Object.assign(Error('socket hang up on internal host'), { code: 'ECONNRESET' }); }
    }), error => {
      assert.match(error.message, /asset\.js: request failed \(ECONNRESET\)/);
      assert.doesNotMatch(error.message, /internal host/, 'response details stay out of the log');
      return true;
    });
    assert.equal(clock, 1, 'the failed round still retries within the window');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function builtSite(t) {
  const built = fs.mkdtempSync(path.join(os.tmpdir(), 'published-gate-'));
  t.after(() => fs.rmSync(built, { recursive: true, force: true }));
  const revision = 'local';
  const catalog = { bundleRevision: revision, sourceRevision: 'current', files: ['cases/a.md'] };
  const corpus = { version: 1, revision, sourceRevision: 'current', sources: [{ path: 'cases/a.md', markdown: 'original' }] };
  const page = '<html lang="zh-Hant"><head><meta property="og:locale" content="zh_TW"></head></html>';
  const files = {
    'index.html': page, 'assets/app.js': 'app', 'assets/style.css': 'style', 'assets/reader.js': 'reader',
    'assets/reader.css': 'reader style', 'assets/copy.json': '{}', 'assets/discovery.js': 'discovery',
    'assets/audit.js': 'audit', 'INDEX.html': page, 'cases/001-travel-checkout.html': page,
    'sources/qualification-audit-2026-10-16.html': page,
    'catalog.json': JSON.stringify(catalog), 'corpus.json': JSON.stringify(corpus)
  };
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(built, name)), { recursive: true });
    fs.writeFileSync(path.join(built, name), content);
  }
  const published = { ...files };
  const respond = async url => {
    const name = url.pathname.slice('/project/'.length) || 'index.html';
    assert.ok(Object.hasOwn(published, name), 'unexpected publication URL ' + url);
    return { ok: true, arrayBuffer: async () => Buffer.from(published[name]) };
  };
  return {
    // The live build is judged against the revision it names; a unit fixture says
    // what that revision contains instead of reading git.
    options: { base: 'https://example.test/project/', built, sha: 'current', expectedSourceRevision: 'current', isCurrent: () => true, treeAtRevision: () => new Map([['cases/a.md', blobHash('original')]]) },
    respond,
    publishedFiles: published
  };
}

test('a failed deployment fails the gate at once and names the run', async t => {
  const site = builtSite(t);
  // The live site is still the previous build: nothing newer carries this push.
  site.publishedFiles['catalog.json'] = JSON.stringify({ ...JSON.parse(site.publishedFiles['catalog.json']), sourceRevision: 'older' });
  site.publishedFiles['corpus.json'] = JSON.stringify({ ...JSON.parse(site.publishedFiles['corpus.json']), sourceRevision: 'older' });
  let clock = 0, deploymentCalls = 0;
  await assert.rejects(waitForPublishedVersion({
    ...site.options, fetchAsset: site.respond, now: () => clock, sleep: async ms => { clock += ms; },
    isDescendant: () => { throw Error('Published revision older does not contain this push current'); },
    deployment: async () => { deploymentCalls++; return { state: 'failed', conclusion: 'failure', runUrl: 'https://github.com/o/r/actions/runs/42733561142' }; }
  }), error => {
    assert.match(error.message, /Pages deployment for current failed \(failure\)/);
    assert.match(error.message, /42733561142/);
    return true;
  });
  assert.equal(clock, 0, 'the hour of polling never starts');
  assert.equal(deploymentCalls, 1);
});

test('a failed deployment only turns red when the live build provably lacks the push', async t => {
  const failedDeploy = async () => ({ state: 'failed', conclusion: 'failure', runUrl: 'run/9' });
  // 1. The live site already serves this very revision (an earlier/rerun deploy
  //    published it): verification decides, not the failed run.
  const sameRevision = builtSite(t);
  const same = await waitForPublishedVersion({
    ...sameRevision.options, fetchAsset: sameRevision.respond, sleep: async () => {},
    changeList: { known: true, entries: [] }, deployment: failedDeploy
  });
  assert.equal(same.status, 'matched');

  // 2. The live build is older: it provably cannot contain this push.
  const older = builtSite(t);
  for (const name of ['catalog.json', 'corpus.json']) {
    older.publishedFiles[name] = JSON.stringify({ ...JSON.parse(older.publishedFiles[name]), sourceRevision: 'older' });
  }
  let clock = 0;
  await assert.rejects(waitForPublishedVersion({
    ...older.options, fetchAsset: older.respond, now: () => clock, sleep: async ms => { clock += ms; },
    changeList: { known: true, entries: [] }, deployment: failedDeploy,
    isDescendant: () => { throw Error('Published revision older does not contain this push current'); }
  }), /Pages deployment for current failed/);
  assert.equal(clock, 0);

  // 3. The comparison itself breaks (git/network): that proves nothing, so the
  //    window stays open instead of inventing a red release.
  const broken = builtSite(t);
  for (const name of ['catalog.json', 'corpus.json']) {
    broken.publishedFiles[name] = JSON.stringify({ ...JSON.parse(broken.publishedFiles[name]), sourceRevision: 'older' });
  }
  let brokenClock = 0;
  await assert.rejects(waitForPublishedVersion({
    ...broken.options, fetchAsset: broken.respond, now: () => brokenClock, sleep: async ms => { brokenClock += ms; },
    changeList: { known: true, entries: [] }, deployment: failedDeploy,
    isDescendant: () => { throw Error('Cannot fetch the published revision older: ETIMEDOUT'); }
  }), /Published assets do not match checkout/);
  assert.equal(brokenClock, PUBLICATION_TIMEOUT_MS, 'an undecidable comparison keeps the full window');

  // 4. A newer build that carries the push still verifies as superseded.
  const newer = builtSite(t);
  for (const name of ['catalog.json', 'corpus.json']) {
    newer.publishedFiles[name] = JSON.stringify({ ...JSON.parse(newer.publishedFiles[name]), sourceRevision: 'newer' });
  }
  const superseded = await waitForPublishedVersion({
    ...newer.options, fetchAsset: newer.respond, sleep: async () => {},
    changeList: { known: true, entries: [] }, deployment: failedDeploy, isDescendant: () => true
  });
  assert.equal(superseded.status, 'matched');
  assert.equal(superseded.mode, 'superseded');
  assert.equal(superseded.supersededBy, 'newer');
});

test('a pending deployment keeps the full window, and a succeeded one never replaces the byte check', async t => {
  const pending = builtSite(t);
  pending.publishedFiles['corpus.json'] = JSON.stringify({ ...JSON.parse(pending.publishedFiles['corpus.json']), revision: 'still-deploying' });
  let clock = 0, calls = 0;
  await assert.rejects(waitForPublishedVersion({
    ...pending.options, fetchAsset: pending.respond, now: () => clock, sleep: async ms => { clock += ms; },
    deployment: async () => { calls++; return { state: 'pending' }; }
  }), /Published assets do not match checkout/);
  assert.equal(clock, PUBLICATION_TIMEOUT_MS, 'a slow deployment still gets the whole window');
  assert.ok(calls > 1 && calls <= PUBLICATION_TIMEOUT_MS / (5000 * 12) + 1, 'the API is asked once a minute, not on every poll: ' + calls);

  const succeeded = builtSite(t);
  succeeded.publishedFiles['corpus.json'] = JSON.stringify({ ...JSON.parse(succeeded.publishedFiles['corpus.json']), revision: 'stale' });
  let staleClock = 0;
  await assert.rejects(waitForPublishedVersion({
    ...succeeded.options, fetchAsset: succeeded.respond, now: () => staleClock, sleep: async ms => { staleClock += ms; },
    deployment: async () => ({ state: 'succeeded', conclusion: 'success', runUrl: 'run/1' })
  }), /Published assets do not match checkout/, 'a successful deploy still has to show these bytes');
});

test('a transient ancestry failure is retried, not cached for the whole window', async t => {
  const site = builtSite(t);
  for (const name of ['catalog.json', 'corpus.json']) {
    site.publishedFiles[name] = JSON.stringify({ ...JSON.parse(site.publishedFiles[name]), sourceRevision: 'newer' });
  }
  let calls = 0, clock = 0;
  const result = await waitForPublishedVersion({
    ...site.options, fetchAsset: site.respond, now: () => clock, sleep: async ms => { clock += ms; },
    changeList: { known: true, entries: [] },
    deployment: async () => ({ state: 'succeeded', conclusion: 'success' }),
    isDescendant: () => {
      calls++;
      // The first comparison fails on the network, the second one answers.
      if (calls === 1) throw Error('Cannot fetch the published revision newer: ETIMEDOUT');
      return true;
    }
  });
  assert.equal(result.status, 'matched', 'the gate recovers once the network answers');
  assert.equal(result.mode, 'superseded');
  assert.ok(calls >= 2, 'the failed comparison must be retried, calls=' + calls);
  assert.ok(clock > 0 && clock < PUBLICATION_TIMEOUT_MS, 'it recovers long before the window closes');
});

test('a branch build never asks GitHub about a Pages run it cannot have', async t => {
  const site = builtSite(t);
  let called = 0;
  const result = await waitForPublishedVersion({
    ...site.options, sha: 'unpublished-branch', expectedSourceRevision: null,
    fetchAsset: site.respond, isDescendant: () => true,
    deployment: async () => { called++; return { state: 'failed', conclusion: 'failure' }; }
  });
  assert.equal(result.status, 'matched');
  assert.equal(called, 0);
});

test('main keeps its release verdict: only a pull request may cancel its own run', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/website-qa.yml'), 'utf8');
  const cancel = workflow.match(/cancel-in-progress:\s*(.+)/)[1].trim();
  assert.equal(cancel, "${{ github.event_name == 'pull_request' }}");
  assert.match(workflow, /permissions:\s*\n(?:\s*#[^\n]*\n)*\s*contents: read\s*\n(?:\s*#[^\n]*\n)*\s*actions: read/);
  assert.match(workflow, /GITHUB_TOKEN: \$\{\{ github\.token \}\}/);
});
