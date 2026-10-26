const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Source guide job budgets cover observed browser-install and Pages-publish delays', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/source-guide-qa.yml'), 'utf8');
  const preview = workflow.split(/^  preview:\s*$/m)[1]?.split(/^  published:\s*$/m)[0];
  const published = workflow.split(/^  published:\s*$/m)[1];
  assert.ok(preview && published, 'Source guide must define preview and published jobs');

  const previewTimeout = preview.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(previewTimeout && Number(previewTimeout[1]) >= 35, 'preview must cover the observed 20-minute browser-tool stall plus the 13m22s successful browser run');

  const attempts = published.match(/for\(let attempt=0;attempt<(\d+);attempt\+\+\)/);
  const interval = published.match(/setTimeout\(resolve,(\d+)\)/);
  const publishedTimeout = published.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(attempts && interval, 'published job must have a bounded retry interval');
  assert.ok(Number(attempts[1]) * Number(interval[1]) >= 20 * 60 * 1000, 'asset polling must cover the observed 15m34s Pages publication plus margin');
  assert.ok(publishedTimeout && Number(publishedTimeout[1]) >= 30, 'published job must cover browser setup plus the 20-minute poll');
});
