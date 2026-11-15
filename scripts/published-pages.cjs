'use strict';
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {execFile} = require('node:child_process');
const path = require('node:path');
const {pickRun} = require('./publication-status.cjs');
const {pages} = require('./check-page-language.cjs');
const MAX_ARCHIVE = 64 * 1024 * 1024;

function decodePages(archive, revision, signal) {
 return new Promise((resolve, reject) => {
  const child = execFile('python3', [path.join(__dirname, 'pages-artifact.py'), revision, ...pages],
   {signal, timeout: 10000, maxBuffer: 64 * 1024}, (error, stdout) => {
    if (error) return reject(Error('Cannot read Pages artifact archive or source revision'));
    try { resolve(new Map(Object.entries(JSON.parse(stdout)))); }
    catch { reject(Error('Invalid Pages artifact page hashes')); }
   });
  child.stdin.on('error', () => {}); // Early archive rejection may close stdin.
  child.stdin.end(archive);
 });
}

async function readPublishedPages(revision, {
 repository = process.env.GITHUB_REPOSITORY,
 token = process.env.GITHUB_TOKEN,
 fetchImpl = fetch,
 signal
} = {}) {
 assert(/^[0-9a-f]{40}$/.test(revision), 'Pages artifact requires a full commit SHA');
 assert(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || '') && token, 'Pages artifact requires repository and GITHUB_TOKEN');
 // Share the publication round's deadline; standalone callers also remain bounded.
 signal = signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000);
 const api = 'https://api.github.com/repos/' + repository;
 const headers = {accept: 'application/vnd.github+json', authorization: 'Bearer ' + token, 'x-github-api-version': '2022-11-28'};
 const request = async (url, options = {}) => {
  try { return await fetchImpl(url, {signal, cache: 'no-store', redirect: 'error', ...options}); }
  catch { throw Error('Pages artifact request failed'); }
 };
 const json = async suffix => {
  const response = await request(api + suffix, {headers});
  if (!response.ok) { await response.body?.cancel(); throw Error('Pages artifact API HTTP ' + response.status); }
  try { return await response.json(); } catch { throw Error('Unreadable Pages artifact metadata'); }
 };
 const runs = await json('/actions/runs?head_sha=' + revision + '&per_page=100');
 // Names alone are forgeable by another repository workflow. Only GitHub's
 // built-in Pages workflow on this repository's main branch supplies these bytes.
 const trusted = (runs.workflow_runs || []).filter(run =>
  run.path === 'dynamic/pages/pages-build-deployment' && run.event === 'dynamic' &&
  run.head_branch === 'main' && run.repository?.full_name === repository && run.head_repository?.full_name === repository);
 const run = pickRun(trusted, revision);
 assert(run?.status === 'completed' && run.conclusion === 'success', 'No successful trusted Pages build for ' + revision);
 assert(Number.isSafeInteger(run.id), 'Invalid Pages run ID');
 const listing = await json('/actions/runs/' + run.id + '/artifacts?per_page=100');
 const artifacts = (listing.total_count <= 100 ? listing.artifacts : []).filter(item => item.name === 'github-pages');
 assert.equal(artifacts.length, 1, 'Expected one trusted github-pages artifact');
 const artifact = artifacts[0];
 assert(!artifact.expired, 'Pages artifact expired for ' + revision);
 assert(Number.isSafeInteger(artifact.id) && artifact.size_in_bytes > 0 && artifact.size_in_bytes <= MAX_ARCHIVE, 'Invalid Pages artifact size or ID');
 assert.equal(artifact.workflow_run?.id, run.id, 'Pages artifact run mismatch');
 assert.equal(artifact.workflow_run?.head_sha, revision, 'Pages artifact revision mismatch');
 assert.match(artifact.digest || '', /^sha256:[0-9a-f]{64}$/, 'Pages artifact has no SHA-256 digest');
 const redirect = await request(api + '/actions/artifacts/' + artifact.id + '/zip', {headers, redirect: 'manual'});
 await redirect.body?.cancel();
 assert.equal(redirect.status, 302, 'Pages artifact download did not redirect');
 const location = new URL(redirect.headers.get('location'));
 assert(location.protocol === 'https:' && !location.username && !location.password, 'Invalid Pages artifact download URL');
 // The signed object URL gets NO GitHub Authorization header. Never log it.
 const response = await request(location);
 if (!response.ok) { await response.body?.cancel(); throw Error('Pages artifact download HTTP ' + response.status); }
 const chunks = [];
 let size = 0;
 for await (const chunk of response.body) {
  size += chunk.length;
  assert(size <= MAX_ARCHIVE, 'Pages artifact download exceeds size limit');
  chunks.push(chunk);
 }
 const archive = Buffer.concat(chunks, size);
 assert.equal('sha256:' + createHash('sha256').update(archive).digest('hex'), artifact.digest, 'Pages artifact digest mismatch');
 const hashes = await decodePages(archive, revision, signal);
 console.log('PUBLISHED_PAGES_ARTIFACT ' + revision + ' run=' + run.id + ' artifact=' + artifact.id);
 return hashes;
}

module.exports = {readPublishedPages};
