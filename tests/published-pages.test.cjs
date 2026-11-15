'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {readPublishedPages} = require('../scripts/published-pages.cjs');
const {pages} = require('../scripts/check-page-language.cjs');
const sha = 'a'.repeat(40), repository = 'owner/project';
const html = '<html lang="zh-Hant"><body>Full page</body></html>';
// Exercise the real ZIP/TAR decoder, without extracting anything to disk.
function zip({revision = sha, omit = '', duplicate = '', link = ''} = {}) {
 return execFileSync('python3', ['-c', `
import io,json,sys,tarfile,zipfile
revision,pages,html,omit,duplicate,link=json.loads(sys.argv[1])
tar=io.BytesIO()
with tarfile.open(fileobj=tar,mode='w') as archive:
 for name in ['catalog.json']+pages+([duplicate] if duplicate else []):
  if name==omit: continue
  data=(json.dumps({'sourceRevision':revision}) if name=='catalog.json' else html).encode()
  entry=tarfile.TarInfo('./'+name)
  if name==link:
   entry.type=tarfile.SYMTYPE;entry.linkname='/etc/passwd'
   archive.addfile(entry)
  else:
   entry.size=len(data);archive.addfile(entry,io.BytesIO(data))
result=io.BytesIO()
with zipfile.ZipFile(result,'w',zipfile.ZIP_DEFLATED) as archive:
 archive.writestr('artifact.tar',tar.getvalue())
sys.stdout.buffer.write(result.getvalue())
`, JSON.stringify([revision, pages, html, omit, duplicate, link])]);
}
function fixture(archive = zip()) {
 const run = {id: 123, name: 'pages build and deployment', path: 'dynamic/pages/pages-build-deployment', event: 'dynamic', head_sha: sha, head_branch: 'main', repository: {full_name: repository}, head_repository: {full_name: repository}, status: 'completed', conclusion: 'success'};
 const artifact = {id: 456, name: 'github-pages', expired: false, size_in_bytes: archive.length, digest: 'sha256:' + createHash('sha256').update(archive).digest('hex'), workflow_run: {id: run.id, head_sha: sha}};
 const calls = [];
 const options = {repository, token: 'private-test-token', fetchImpl: async (url, options) => {
  const address = String(url);
  calls.push({address, options});
  if (address.includes('/actions/runs?')) return Response.json({workflow_runs: [run]});
  if (address.includes('/artifacts?')) return Response.json({total_count: 1, artifacts: [artifact]});
  if (address.endsWith('/zip')) return new Response(null, {status: 302, headers: {location: 'https://objects.test/signed-secret'}});
  assert.equal(address, 'https://objects.test/signed-secret');
  assert.equal(options.headers, undefined, 'never forward the GitHub token to object storage');
  return new Response(archive);
 }};
 return {run, artifact, options, calls};
}

test('trusted same-revision Pages archive provides hashes of complete generated pages', async () => {
 const {options, calls} = fixture();
 const hashes = await readPublishedPages(sha, options);
 assert.deepEqual(hashes, new Map(pages.map(page => [page, createHash('sha256').update(html).digest('hex')])));
 assert.equal(calls.length, 4);
 assert(calls.every(call => call.options.signal instanceof AbortSignal));
});

test('wrong workflow, branch, repository, revision or unfinished run cannot supply trusted bytes', async () => {
 for (const mutation of [
  run => { run.path = '.github/workflows/impersonator.yml'; },
  run => { run.event = 'pull_request'; },
  run => { run.head_branch = 'feature'; },
  run => { run.head_repository.full_name = 'fork/project'; },
  run => { run.repository.full_name = 'other/project'; },
  run => { run.head_sha = 'b'.repeat(40); },
  run => { run.conclusion = 'failure'; },
  run => { run.status = 'in_progress'; }
 ]) {
  const {run, options, calls} = fixture(); mutation(run);
  await assert.rejects(readPublishedPages(sha, options), /No successful trusted Pages build/);
  assert.equal(calls.length, 1, 'untrusted run is rejected before download');
 }
});

test('expired, missing digest or mismatched artifact provenance is rejected before download', async () => {
 for (const mutation of [
  artifact => { artifact.expired = true; },
  artifact => { artifact.workflow_run.id++; },
  artifact => { artifact.workflow_run.head_sha = 'b'.repeat(40); },
  artifact => { delete artifact.digest; },
  artifact => { artifact.size_in_bytes = 65 * 1024 * 1024; }
 ]) {
  const {artifact, options, calls} = fixture(); mutation(artifact);
  await assert.rejects(readPublishedPages(sha, options), /Pages artifact/);
  assert.equal(calls.length, 2);
 }
});

test('download corruption is rejected using the API artifact digest', async () => {
 const {artifact, options} = fixture(); artifact.digest = 'sha256:' + '0'.repeat(64);
 await assert.rejects(readPublishedPages(sha, options), /digest mismatch/);
});

test('archive missing, duplicate, linked pages or wrong embedded revision never prove publication', async () => {
 for (const settings of [{omit: 'INDEX.html'}, {duplicate: 'INDEX.html'}, {link: 'INDEX.html'}, {revision: 'b'.repeat(40)}]) {
  await assert.rejects(readPublishedPages(sha, fixture(zip(settings)).options), /Cannot read Pages artifact/);
 }
 await assert.rejects(readPublishedPages(sha, fixture(Buffer.from('not a zip')).options), /Cannot read Pages artifact/);
});

test('API and download errors do not expose tokens, signed URLs or response contents', async () => {
 for (const fetchImpl of [async () => { throw Error('private-test-token signed-secret'); }, async () => new Response('private-test-token', {status: 403})]) {
  await assert.rejects(readPublishedPages(sha, {repository, token: 'private-test-token', fetchImpl}), error => {
   assert.doesNotMatch(error.message, /private-test-token|signed-secret/);
   assert.match(error.message, /Pages artifact/);
   return true;
  });
 }
});
