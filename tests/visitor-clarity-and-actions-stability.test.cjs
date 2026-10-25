'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
const workflowsDir = path.join(root, '.github/workflows');

test('search input placeholder and hint prioritize problem-oriented discovery for first-time visitors', () => {
  assert.match(
    indexHtml,
    /placeholder="搜尋你想解決的問題，例如：發票、代碼審查、旅遊比價、每日報表…"/,
    'query placeholder should guide visitors to search by problem rather than tool jargon'
  );
  assert.match(
    indexHtml,
    /id="search-hint"[^>]*>從想解決的問題出發，支援多詞同時符合（AND）；亦可搜尋工具、作法與限制。/,
    'search hint should emphasize problem-first intent while explaining AND behavior'
  );
  assert.match(
    indexHtml,
    /合格案例數（依標準核對真實證據）與網站條目數分開計算，避免把條目數當成真實案例。/,
    'stats section must clearly distinguish qualified verified cases from total catalog entries'
  );
});

test('empty search state echoes query safely, wraps long tokens, and guides visitors to verified problem use-cases', () => {
  assert.match(
    appJs,
    /displayQ\s*\?\s*`目前沒有符合「\$\{displayQ\}」的案例`\s*:\s*'目前沒有符合的案例'/,
    'empty state heading must echo user query safely while maintaining contract with load recovery assertions'
  );
  assert.match(
    appJs,
    /目前沒有符合「\$\{displayQ\}」的案例，你可以從常見問題與真實案例開始：/,
    'problem suggestion intro must connect with the searched query'
  );
  const css = fs.readFileSync(path.join(root, 'assets/style.css'), 'utf8');
  assert.match(css, /#empty h3\{[^}]*overflow-wrap:\s*anywhere/, '#empty h3 must wrap long text tokens');
  assert.match(css, /\.empty-problem-intro\{[^}]*overflow-wrap:\s*anywhere/, '.empty-problem-intro must wrap long text tokens');
});

test('critical GitHub Actions workflows feature in-loop superseded checks and pre-throw freshness verification', () => {
  const hardenedWorkflows = [
    'category-find-qa.yml',
    'case-share-qa.yml',
    'results-return-qa.yml',
    'print-reading-qa.yml',
    'missing-case-qa.yml',
    'method-shortcut-qa.yml',
    'task-shortcuts-qa.yml',
    'available-facets-qa.yml',
    'filter-entry-qa.yml',
    'source-links-qa.yml',
    'source-guide-qa.yml',
    'discovery-round-qa.yml'
  ];

  for (const file of hardenedWorkflows) {
    const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
    // Check for in-loop check
    assert.ok(
      content.includes('!isCurrentMainCommit(process.env.GITHUB_SHA)') &&
      (content.includes('i%15===0') || content.includes('attempt%15===0') || content.includes('for(let i=0;i<181;i++)')),
      `${file} must perform in-loop isCurrentMainCommit check`
    );
    // Check for pre-throw check before error
    assert.match(
      content,
      /if\(!isCurrentMainCommit\(process\.env\.GITHUB_SHA\)\)[\s\S]*?throw Error/,
      `${file} must verify freshness before throwing timeout/mismatch error`
    );
  }
});
