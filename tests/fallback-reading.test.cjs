'use strict';
// The build check must fail closed: a rendered case page with only plain-text
// sources, or an index without the evidence legend, cannot pass.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {checkFallbackReading, externalSourceLinks} = require('../scripts/check-fallback-reading.cjs');

const INDEX = `<!doctype html><html lang="zh-Hant"><body>
<h2>怎麼讀這頁</h2><p>代碼說的是「誰提出主張」，不是「誰驗證」。</p>
<p>author-demo 作者報告／示範 official 官方自報 designed 設計／未實跑 unverified 尚待查證</p>
<a href="/ai-agent-use-cases/index.html">案例探索首頁</a>
</body></html>`;

function fixture(caseHtml, indexHtml = INDEX) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fallback-reading-'));
  fs.mkdirSync(path.join(root, 'cases'));
  fs.writeFileSync(path.join(root, 'INDEX.html'), indexHtml);
  fs.writeFileSync(path.join(root, 'cases', '001-demo.html'), caseHtml);
  return root;
}

test('a rendered case with a clickable source passes', () => {
  const root = fixture('<p><a href="https://example.test/source">source</a></p>');
  const result = checkFallbackReading(root);
  assert.deepEqual(result.failures, []);
  assert.equal(result.checked, 1);
});

test('a rendered case with only plain-text sources fails by page name', () => {
  const root = fixture('<p>原文：https://example.test/source</p>');
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /cases\/001-demo\.html: no clickable source link/);
});

test('the site header link does not count as a source', () => {
  assert.deepEqual(externalSourceLinks('<a href="https://richardhan.github.io/ai-agent-use-cases/">home</a>'), []);
  assert.deepEqual(externalSourceLinks('<a href="https://richardhan.github.io/ai-agent-use-cases">home</a>'), []);
  assert.deepEqual(externalSourceLinks('<a href="https://example.test/">x</a>'), ['https://example.test/']);
});

test('an index without the evidence legend fails', () => {
  const root = fixture('<a href="https://example.test/x">x</a>', '<h2>索引</h2>');
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /reading guide/);
  assert.match(result.failures.join('\n'), /author-demo/);
});

test('a catalog entry without a rendered page fails instead of shrinking the check', () => {
  const root = fixture('<a href="https://example.test/x">x</a>');
  fs.writeFileSync(path.join(root, 'catalog.json'), JSON.stringify({files: ['cases/001-demo.md', 'cases/002-missing.md']}));
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /cases\/002-missing\.html: corpus entry has no rendered page/);
});
