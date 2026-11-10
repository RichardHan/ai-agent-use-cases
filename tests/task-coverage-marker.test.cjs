'use strict';
// The hero directory offers tasks before anything is typed. A task no case
// describes in its own title/purpose/pain must not look as covered as one the
// library answers directly, and the marker must use the same predicate the
// results screen uses, or the link and the screen would contradict each other.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
class Node { constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.textContent = ''; } append(...children) { this.children.push(...children); } setAttribute(name, value) { this[name] = value; } }
const context = vm.createContext({ URL, Discovery: require('../assets/discovery.js'), document: { createElement: tag => new Node(tag), createTextNode: text => ({ textContent: text }) } });
vm.runInContext(source + '\nthis.api={parseFile,filterEntries,tokenize,taskCoverage,annotateTaskCoverage};', context);
const api = context.api;
vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);
const files = ['cases', 'evidence'].flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(x => x.endsWith('.md')).map(x => dir + '/' + x)).concat('sources/pending.md');
const entries = files.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const heroDirectory = html.match(/<div class="hero-task-directory">[\s\S]*?<\/div>/)?.[0] || '';
const taskLinks = [
  ...[...heroDirectory.matchAll(/<a class="problem-tag" href="\?q=([^"#]+)#explore">([^<]+)<\/a>/g)].map(m => ({ query: decodeURIComponent(m[1]), label: m[2] })),
  ...[...heroDirectory.matchAll(/<a data-task-entry href="\?q=([^"#]+)#explore">([^<]+)<\/a>/g)].map(m => ({ query: decodeURIComponent(m[1]), label: m[2] }))
];

test('a task no case describes reports zero claims, not zero results', () => {
  const coverage = api.taskCoverage(entries, '發票辨識');
  assert.equal(coverage.claimed, 0, 'no case declares 發票辨識 in title/purpose/pain');
  assert.ok(coverage.total > 0, 'the link still leads somewhere: body mentions exist');
  assert.equal(coverage.total, api.filterEntries(entries, api.tokenize('發票辨識'), {}).length);
});

test('a covered task reports claims and never asks for a total', () => {
  const coverage = api.taskCoverage(entries, '發票');
  assert.ok(coverage.claimed > 0, 'some case declares 發票 in title/purpose/pain');
  assert.equal(coverage.total, null, 'covered tasks keep the plain link, no marker payload');
});

test('the marker repeats the results-screen predicate instead of a second definition', () => {
  for (const { query } of taskLinks) {
    const terms = api.tokenize(query);
    const coverage = api.taskCoverage(entries, query);
    assert.ok(coverage, `${query} tokenises to at least one term`);
    const claimedByScope = api.filterEntries(entries, terms, { scope: 'overview' }).length;
    assert.equal(coverage.claimed, claimedByScope, `${query}: overview scope is the single source of truth`);
  }
});

test('every task link still lands on results, so the marker never hides a dead end', () => {
  for (const { query, label } of taskLinks) {
    assert.ok(api.filterEntries(entries, api.tokenize(query), {}).length > 0, `${label} (${query}) must keep at least one result`);
  }
});

test('both directory states exist in the current corpus', () => {
  const marked = taskLinks.filter(({ query }) => api.taskCoverage(entries, query).claimed === 0);
  assert.ok(marked.length > 0, 'the corpus currently has tasks no case describes');
  assert.ok(marked.length < taskLinks.length, 'and tasks it does describe');
  for (const { query, label } of marked) {
    assert.ok(api.taskCoverage(entries, query).total > 0, `${label} must still show related-word hits`);
  }
});

test('an empty query has no coverage to report', () => {
  assert.equal(api.taskCoverage(entries, ''), null);
  assert.equal(api.taskCoverage(entries, '   '), null);
});
