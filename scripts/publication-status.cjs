'use strict';
// Why this exists: `Wait for published assets and content` can only see the live
// site, so a deployment that already failed looks exactly like a deployment that
// has not finished. On 2026-11-10 the Pages deploy for `99734627` failed at
// 01:19:29 while the release gate kept polling, and the next push cancelled the
// gate at 01:42:07 (run 42733562130). The commit therefore ended as "cancelled",
// not "the deployment failed". Asking GitHub about the Pages run for this exact
// SHA turns that hour of guessing into one API read.
const PAGES_WORKFLOW = /^pages build and deployment$/;
const API_TIMEOUT_MS = 15000;
const FAILED = new Set(['failure', 'timed_out', 'startup_failure']);

const activity = run => String(run.updated_at || run.run_started_at || run.created_at || '');
function pickRun(runs, sha) {
  // Only runs for this commit can speak for this commit. A rerun keeps its
  // original `created_at` and gets a new `updated_at`, so sorting by creation
  // would keep reading the attempt that failed first; the newest activity decides.
  return (runs || [])
    .filter(run => run && run.head_sha === sha && PAGES_WORKFLOW.test(String(run.name || '')))
    .sort((a, b) => activity(b).localeCompare(activity(a)) || Number(b.run_attempt || 1) - Number(a.run_attempt || 1))[0] || null;
}

// 'failed'    - the deploy for this SHA ran and did not publish; the gate cannot pass.
// 'succeeded' - the deploy for this SHA finished; the live site must show it.
// 'pending'   - no run for this SHA yet, or it is still running.
// 'unknown'   - the API could not be asked; never treat this as success or failure.
function classify(run) {
  if (!run) return { state: 'pending' };
  if (run.status !== 'completed') return { state: 'pending', runUrl: run.html_url || '' };
  if (FAILED.has(run.conclusion)) return { state: 'failed', conclusion: run.conclusion, runUrl: run.html_url || '' };
  if (run.conclusion === 'success') return { state: 'succeeded', conclusion: run.conclusion, runUrl: run.html_url || '' };
  // cancelled / skipped / neutral: this run published nothing, so it proves nothing.
  return { state: 'pending', conclusion: run.conclusion, runUrl: run.html_url || '' };
}

async function publicationStatus({
  sha,
  repository = process.env.GITHUB_REPOSITORY,
  token = process.env.GITHUB_TOKEN,
  fetchImpl = fetch,
  apiBase = process.env.GITHUB_API_URL || 'https://api.github.com',
  tokenInput = 'GITHUB_TOKEN'
} = {}) {
  if (!sha || !repository || !token) return { state: 'unknown', reason: 'no ' + (token ? 'repository' : tokenInput) + ' available' };
  // The caller has a 60-minute window; one request that never settles must not be
  // able to outlive it, so each call carries its own timeout.
  const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(API_TIMEOUT_MS) : undefined;
  const url = new URL('/repos/' + repository + '/actions/runs', apiBase);
  url.searchParams.set('head_sha', sha);
  // The Pages workflow reports itself as event "dynamic", so the event filter
  // cannot be used to find it; the run name is what identifies it.
  url.searchParams.set('per_page', '30');
  let response;
  try {
    response = await fetchImpl(url, {
      signal,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: 'Bearer ' + token,
        'x-github-api-version': '2022-11-28'
      }
    });
  } catch (error) {
    // The error text can name the URL or carry response fragments; log the code.
    return { state: 'unknown', reason: 'request failed' + (error && error.code ? ' (' + error.code + ')' : '') };
  }
  if (!response.ok) return { state: 'unknown', reason: 'HTTP ' + response.status };
  let body;
  try {
    body = await response.json();
  } catch {
    // A JSON parser error quotes the body it could not read. Never log that.
    return { state: 'unknown', reason: 'unreadable response' };
  }
  return classify(pickRun(body && body.workflow_runs, sha));
}

module.exports = { publicationStatus, classify, pickRun };
