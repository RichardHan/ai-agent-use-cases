'use strict';
// GitHub Pages rebuilds and redeploys the site on every push to the default
// branch, including commits that only touch `docs/**` or `SITE.md`. Those files
// are excluded from the Pages artifact, but the build still rewrites
// `catalog.json`'s `builtAt`/`bundleRevision`/`sourceRevision`, so the deploy is a
// new build that only Website QA knows how to adjudicate. Its main-push trigger
// therefore must not narrow to content paths: a paths filter leaves docs-only
// deployments without the publication verdict and without the deploy-failure
// check. Observed on main `2b332a29` (2026-11-16): Pages succeeded, no Website QA
// run existed for that SHA.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/website-qa.yml'), 'utf8');

function triggerBlock(name) {
  const lines = workflow.split('\n');
  const start = lines.findIndex(line => line === `  ${name}:`);
  assert.notEqual(start, -1, `${name}: trigger must exist`);
  const block = [];
  for (const line of lines.slice(start + 1)) {
    // The next top-level workflow key ends this trigger block.
    if (/^\S/.test(line)) break;
    block.push(line);
  }
  return block.join('\n');
}

test('Website QA runs for every main push, including docs-only commits', () => {
  const push = triggerBlock('push');
  assert.match(push, /branches: \['main'\]/, 'main pushes must still start the publication gate');
  assert.doesNotMatch(push, /^\s+paths:/m,
    'Pages republishes on every main push; a paths filter leaves docs-only deployments without the only publication verdict');
});

test('the main-push gate still fails when publication cannot be verified', () => {
  assert.match(workflow, /Wait for published assets and content/, 'the push job must still wait for this build to be live');
  assert.match(workflow, /Fail when the published site cannot be verified/, 'an unverified publication must stay a red job');
});
