'use strict';
// The build check must fail closed: a rendered case page with only plain-text
// sources, no way back to the index, or an unexplained evidence token cannot
// pass. The theme layout is copied into `_layouts`, so these fixtures also keep
// the navigation contract from drifting away from the rendered pages.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {checkFallbackReading, externalSourceLinks, caseNavigation, legendEntries} = require('../scripts/check-fallback-reading.cjs');

const INDEX = `<!doctype html><html lang="zh-Hant"><body>
<h2>怎麼讀這頁</h2><p>代碼說的是「誰提出主張」，不是「誰驗證」。</p>
<p>author-demo 作者報告／示範 official 官方自報 designed 設計／未實跑 unverified 尚待查證 author-self-report 作者報告／示範 pending-verification 尚待查證</p>
<a href="/ai-agent-use-cases/index.html">案例探索首頁</a>
</body></html>`;

const CASE_NAV = `<aside class="case-fallback-nav" data-fallback-case-nav aria-label="案例導覽與證據代碼說明">
<nav><a href="/ai-agent-use-cases/INDEX.html">← 完整案例索引</a>
<a href="/ai-agent-use-cases/">搜尋首頁</a></nav>
<p><strong>誰提出主張，不等於誰驗證。</strong></p>
<p>本頁證據代碼：
<span class="case-fallback-code"><code>author-demo</code> <strong>作者報告／示範</strong></span>
<span class="case-fallback-code"><code>official</code> <strong>官方自報</strong></span>
<span class="case-fallback-code"><code>designed</code> <strong>設計／未實跑</strong></span>
<span class="case-fallback-code"><code>unverified</code> <strong>尚待查證</strong></span>
</p></aside>`;

function fixture(caseHtml, indexHtml = INDEX) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fallback-reading-'));
  fs.mkdirSync(path.join(root, 'cases'));
  fs.writeFileSync(path.join(root, 'INDEX.html'), indexHtml);
  fs.writeFileSync(path.join(root, 'cases', '001-demo.html'), caseHtml);
  return root;
}

test('a rendered case with a clickable source passes', () => {
  const root = fixture(CASE_NAV + '<p><a href="https://example.test/source">source</a></p>');
  const result = checkFallbackReading(root);
  assert.deepEqual(result.failures, []);
  assert.equal(result.checked, 1);
});

test('a rendered case with only plain-text sources fails by page name', () => {
  const root = fixture(CASE_NAV + '<p>原文：https://example.test/source</p>');
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /cases\/001-demo\.html: no clickable source link/);
});

test('the site header link does not count as a source', () => {
  assert.deepEqual(externalSourceLinks('<a href="https://richardhan.github.io/ai-agent-use-cases/">home</a>'), []);
  assert.deepEqual(externalSourceLinks('<a href="https://richardhan.github.io/ai-agent-use-cases">home</a>'), []);
  assert.deepEqual(externalSourceLinks('<a href="https://example.test/">x</a>'), ['https://example.test/']);
});

test('an index without the evidence legend fails', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>', '<h2>索引</h2>');
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /reading guide/);
  assert.match(result.failures.join('\n'), /author-demo/);
});

test('a case without the fallback navigation fails', () => {
  const root = fixture('<p><a href="https://example.test/source">source</a></p>');
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /missing the case fallback navigation/);
});

test('a case without a way back to the index or search home fails', () => {
  const noIndex = CASE_NAV.replace(/<a href="[^"]*INDEX\.html">[^<]*<\/a>/, '');
  const noHome = CASE_NAV.replace(/<a href="[^"]*\/">搜尋首頁<\/a>/, '');
  const indexFailure = checkFallbackReading(fixture(noIndex + '<a href="https://example.test/x">x</a>'));
  assert.match(indexFailure.failures.join('\n'), /does not link to INDEX\.html/);
  const homeFailure = checkFallbackReading(fixture(noHome + '<a href="https://example.test/x">x</a>'));
  assert.match(homeFailure.failures.join('\n'), /does not link to the searchable home page/);
});

test('a case that uses an evidence token without explaining it fails', () => {
  const nav = CASE_NAV.replace(/<span class="case-fallback-code"><code>author-demo<\/code> <strong>作者報告／示範<\/strong><\/span>/, '');
  const root = fixture(nav + '<ul><li>來源證據：<code>author-demo</code></li></ul><a href="https://example.test/x">x</a>');
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /body uses author-demo but the legend does not pair it visibly with 作者報告／示範/);
});

test('caseNavigation isolates the legend from the case body', () => {
  const html = CASE_NAV + '<p>body mentions official</p>';
  const nav = caseNavigation(html);
  assert.ok(nav);
  assert.doesNotMatch(nav.inner, /body mentions official/);
});

test('a catalog entry without a rendered page fails instead of shrinking the check', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.writeFileSync(path.join(root, 'catalog.json'), JSON.stringify({files: ['cases/001-demo.md', 'cases/002-missing.md']}));
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /cases\/002-missing\.html: corpus entry has no rendered page/);
});

test('a hidden or mispaired legend entry does not decode the token', () => {
  const body = '<p><code>author-demo</code></p><a href="https://example.test/x">x</a>';
  const hidden = CASE_NAV.replace('<span class="case-fallback-code"><code>author-demo</code>', '<span class="case-fallback-code" hidden><code>author-demo</code>');
  const hiddenResult = checkFallbackReading(fixture(hidden + body));
  assert.match(hiddenResult.failures.join('\n'), /does not pair it visibly with 作者報告／示範/);

  const mispaired = CASE_NAV.replace('<span class="case-fallback-code"><code>author-demo</code> <strong>作者報告／示範</strong></span>', '<span class="case-fallback-code"><code>author-demo</code> <strong>官方自報</strong></span>');
  const mispairedResult = checkFallbackReading(fixture(mispaired + body));
  assert.match(mispairedResult.failures.join('\n'), /does not pair it visibly with 作者報告／示範/);

  const srOnly = CASE_NAV.replace('class="case-fallback-code"', 'class="case-fallback-code sr-only"');
  const srOnlyResult = checkFallbackReading(fixture(srOnly + body));
  assert.match(srOnlyResult.failures.join('\n'), /does not pair it visibly with 作者報告／示範/);

  const hiddenLabel = CASE_NAV.replace('<strong>作者報告／示範</strong>', '<strong style="display:none">作者報告／示範</strong>');
  const hiddenLabelResult = checkFallbackReading(fixture(hiddenLabel + body));
  assert.match(hiddenLabelResult.failures.join('\n'), /does not pair it visibly with 作者報告／示範/);
});

test('legendEntries keeps only visible code-label pairs', () => {
  const entries = legendEntries('<span class="case-fallback-code" hidden><code>author-demo</code> <strong>作者報告／示範</strong></span><span class="case-fallback-code"><code>designed</code> <strong>設計／未實跑</strong></span>');
  assert.equal(entries.get('author-demo'), undefined);
  assert.equal(entries.get('designed'), '設計／未實跑');
});
