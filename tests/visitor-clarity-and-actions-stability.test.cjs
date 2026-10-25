'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
const workflowsDir = path.join(root, '.github/workflows');

test('promoted travel query finds the travel-comparison case and query echo keeps emoji intact', () => {
  const vm = require('node:vm');
  const source = appJs.split('/* Browser event bindings. */')[0];
  const context = vm.createContext({URL, Discovery: require('../assets/discovery.js')});
  vm.runInContext(source + '\nthis.api={abbreviatedQuery,parseFile,filterEntries,tokenize};', context);
  const example = indexHtml.match(/id="query"[^>]*placeholder="([^"]+)"/)?.[1];
  assert.ok(example?.includes('旅遊'), 'the example must be visible to new visitors');
  const corpus = fs.readFileSync(path.join(root, 'cases/001-travel-checkout.md'), 'utf8');
  const entries = Array.from(context.api.parseFile('cases/001-travel-checkout.md', corpus));
  assert.ok(context.api.filterEntries(entries, context.api.tokenize('旅遊'), {}).some(item => item.id === 'UC-001'));
  assert.equal(context.api.abbreviatedQuery('a'.repeat(39) + '🧾' + 'z'), 'a'.repeat(39) + '🧾…');
  assert.equal(context.api.abbreviatedQuery('a'.repeat(40) + '🧾'), 'a'.repeat(40) + '…');
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
