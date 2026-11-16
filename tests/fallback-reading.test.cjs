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
const {checkFallbackReading, externalSourceLinks, caseNavigation, legendEntries, sourceLedgerManifest} = require('../scripts/check-fallback-reading.cjs');

const INDEX = `<!doctype html><html lang="zh-Hant"><body>
<h1>完整案例索引</h1>
<h2>怎麼讀這頁</h2><p>代碼說的是「誰提出主張」，不是「誰驗證」。</p>
<p>author-demo 作者報告／示範 official 官方自報 designed 設計／未實跑 unverified 尚待查證 author-self-report 作者報告／示範 pending-verification 尚待查證</p>
<a href="/ai-agent-use-cases/index.html">案例探索首頁</a>
</body></html>`;

const CASE_NAV = `<aside class="case-fallback-nav" data-fallback-case-nav aria-label="閱讀導覽與證據代碼說明">
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
  fs.writeFileSync(path.join(root, 'cases', '001-demo.html'), `<h1>UC-001</h1>${caseHtml}`);
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

test('evidence and pending entries need the same way back as a case', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.mkdirSync(path.join(root, 'evidence'));
  fs.mkdirSync(path.join(root, 'sources'));
  const page = '<h1>UC-013</h1><a href="https://example.test/x">x</a>';
  fs.writeFileSync(path.join(root, 'evidence', '013-demo.html'), page);
  fs.writeFileSync(path.join(root, 'sources', 'pending.html'), '<h1>待查來源</h1><a href="https://example.test/x">x</a>');
  const missing = checkFallbackReading(root);
  assert.match(missing.failures.join('\n'), /evidence\/013-demo\.html: missing the case fallback navigation/);
  assert.match(missing.failures.join('\n'), /sources\/pending\.html: missing the case fallback navigation/);

  fs.writeFileSync(path.join(root, 'evidence', '013-demo.html'), CASE_NAV + page);
  fs.writeFileSync(path.join(root, 'sources', 'pending.html'), CASE_NAV + '<h1>待查來源</h1><a href="https://example.test/x">x</a>');
  assert.deepEqual(checkFallbackReading(root).failures, []);
});

test('a repeated site-title heading is rejected on every rendered page', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.writeFileSync(path.join(root, 'cases', '001-demo.html'), '<h1>AI 用法實驗室</h1><h1>UC-001</h1>' + CASE_NAV + '<a href="https://example.test/x">x</a>');
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /cases\/001-demo\.html: expected exactly one h1, found 2/);
});

test('INDEX must also expose exactly one h1', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>', INDEX.replace('<h1>完整案例索引</h1>', '<h1>AI 用法實驗室</h1><h1>完整案例索引</h1>'));
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /INDEX\.html: expected exactly one h1, found 2/);
});

// The statistics card links the counting audit and case pages link the batch that
// reviewed them. Both are published `sources/*.html` pages, so a reader lands on
// them from inside the site, not only from GitHub.
const SOURCE_NAV = `<aside class="case-fallback-nav" data-fallback-case-nav aria-label="來源紀錄的閱讀導覽">
<nav><a href="/ai-agent-use-cases/INDEX.html">← 完整案例索引</a>
<a href="/ai-agent-use-cases/">搜尋首頁</a></nav>
<p><strong>本頁是來源與計數紀錄，不是案例成果。</strong>成果主張與驗證狀態以對應案例頁為準；尚未列成案例的線索，以本頁與待查清單的紀錄為準。本庫未獨立重現。</p></aside>`;

test('a published source ledger without the way back fails by page name', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.mkdirSync(path.join(root, 'sources'));
  fs.writeFileSync(path.join(root, 'sources', 'qualification-audit.html'), '<h1>案例計數稽核</h1><a href="https://example.test/x">x</a>');
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /sources\/qualification-audit\.html: missing the source-page fallback navigation/);
  assert.doesNotMatch(result.failures.join('\n'), /qualification-audit\.html: no clickable source link/);
});

test('a source ledger that reads like a case result is rejected', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.mkdirSync(path.join(root, 'sources'));
  // The case legend would tell a reader this ledger is a case with a claimant.
  fs.writeFileSync(path.join(root, 'sources', 'research-batch.html'), '<h1>批次</h1>' + CASE_NAV + '<a href="https://example.test/x">x</a>');
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /research-batch\.html: source navigation must say the ledger is not the case's result/);
});

test('a research batch that found nothing still needs the way back, not a source link', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.mkdirSync(path.join(root, 'sources'));
  fs.writeFileSync(path.join(root, 'sources', 'research-empty.html'), '<h1>本批 0 條</h1>' + SOURCE_NAV);
  assert.deepEqual(checkFallbackReading(root).failures, []);
});

test('the source index and the pending ledger are both checked', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.mkdirSync(path.join(root, 'sources'));
  fs.writeFileSync(path.join(root, 'sources', 'index.html'), '<h1>來源與待查清單</h1>' + SOURCE_NAV);
  fs.writeFileSync(path.join(root, 'sources', 'pending.html'), '<h1>待查來源</h1>' + CASE_NAV + '<a href="https://example.test/x">x</a>');
  const result = checkFallbackReading(root);
  assert.deepEqual(result.failures, []);
  assert.equal(result.checked, 3);
});

test('a source ledger must not leave a no-new-case batch with nowhere to go', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.mkdirSync(path.join(root, 'sources'));
  // Saying "read the case page" is wrong advice for a batch that added no case.
  const onlyCase = SOURCE_NAV.replace('尚未列成案例的線索，以本頁與待查清單的紀錄為準。', '');
  fs.writeFileSync(path.join(root, 'sources', 'research-empty.html'), '<h1>本批 0 條</h1>' + onlyCase);
  const result = checkFallbackReading(root);
  assert.match(result.failures.join('\n'), /research-empty\.html: source navigation must say the ledger is not the case's result and where an unlisted lead is recorded/);
});

test('a duplicated or hidden navigation does not count as a way back', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.mkdirSync(path.join(root, 'sources'));
  fs.writeFileSync(path.join(root, 'sources', 'twice.html'), '<h1>兩份</h1>' + SOURCE_NAV + SOURCE_NAV);
  fs.writeFileSync(path.join(root, 'sources', 'hidden.html'), '<h1>隱藏</h1>' + SOURCE_NAV.replace('<aside ', '<aside hidden '));
  const result = checkFallbackReading(root);
  const text = result.failures.join('\n');
  assert.match(text, /twice\.html: expected one fallback navigation, found 2/);
  assert.match(text, /hidden\.html: fallback navigation is hidden/);
});

test('every ledger in the checkout must produce a page the build can check', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.mkdirSync(path.join(root, 'sources'));
  fs.writeFileSync(path.join(root, 'sources', 'index.html'), '<h1>來源與待查清單</h1>' + SOURCE_NAV);
  fs.writeFileSync(path.join(root, 'sources', 'batch.html'), '<h1>批次</h1>' + SOURCE_NAV);
  const complete = checkFallbackReading(root, {sourceLedgers: ['sources/README.md', 'sources/batch.md']});
  assert.deepEqual(complete.failures, []);
  const missing = checkFallbackReading(root, {sourceLedgers: ['sources/README.md', 'sources/gone.md']});
  assert.match(missing.failures.join('\n'), /sources\/gone\.md: source ledger has no rendered page \(sources\/gone\.html\)/);
});

test('a link hidden inside the navigation is not a way back', () => {
  const root = fixture(CASE_NAV + '<a href="https://example.test/x">x</a>');
  fs.mkdirSync(path.join(root, 'sources'));
  const hiddenNav = SOURCE_NAV.replace('<nav>', '<nav aria-hidden="true">');
  const hiddenLink = SOURCE_NAV.replace('搜尋首頁</a>', '搜尋首頁</a>').replace('<a href="/ai-agent-use-cases/">', '<a class="sr-only" href="/ai-agent-use-cases/">');
  fs.writeFileSync(path.join(root, 'sources', 'nav-hidden.html'), '<h1>導覽隱藏</h1>' + hiddenNav);
  fs.writeFileSync(path.join(root, 'sources', 'link-hidden.html'), '<h1>連結隱藏</h1>' + hiddenLink);
  const text = checkFallbackReading(root).failures.join('\n');
  assert.match(text, /nav-hidden\.html: fallback navigation is hidden/);
  assert.match(text, /link-hidden\.html: fallback navigation is hidden/);
});

test('a dot- or underscore-prefixed ledger is not expected to have a page', () => {
  const fsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ledgers-'));
  fs.writeFileSync(path.join(fsRoot, 'README.md'), 'x');
  fs.writeFileSync(path.join(fsRoot, 'batch.md'), 'x');
  fs.writeFileSync(path.join(fsRoot, '_draft.md'), 'x');
  fs.writeFileSync(path.join(fsRoot, '.hidden.md'), 'x');
  assert.deepEqual(sourceLedgerManifest(fsRoot).sort(), ['sources/README.md', 'sources/batch.md']);
});
