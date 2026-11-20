'use strict';
// "整理會議紀錄" used to stay three required words. The one case whose purpose
// happened to contain all three (UC-071, an Obsidian memory page that mentions
// "整理會議與草稿") became the only overview hit, so "只看那 1 筆" dropped the
// meeting cases. A verb glued to 會議紀錄 is the task, not a third constraint.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];

class Node {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.textContent = ''; }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this[name] = value; }
}

const context = vm.createContext({
  URL,
  Discovery: require('../assets/discovery.js'),
  document: { createElement: tag => new Node(tag), createTextNode: text => ({ textContent: text }) }
});
vm.runInContext(
  source + '\nthis.api={parseFile,filterEntries,tokenize,rankEntries,searchExpansion,narrowestScopeTerm};',
  context
);
const api = context.api;
const files = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .concat('sources/pending.md');
const entries = files.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));

test('a verb glued to 會議紀錄 is not a third required word', () => {
  for (const query of ['整理會議紀錄', '整理會議記錄', '匯總會議紀要', '會議紀錄整理']) {
    const terms = api.tokenize(query);
    assert.deepEqual([...terms], ['會議', '筆記'], `${query} tokenises to the meeting-notes task, got ${terms.join('|')}`);
    assert.equal(api.searchExpansion(entries, query, terms, {}), null, `${query} already has results, so it is not a sentence rewrite`);
  }
  // A meeting without the notes word still keeps the verb. That is a different query.
  assert.ok(api.tokenize('整理會議').includes('整理'), '整理會議 is not the meeting-notes phrase');
  assert.ok(api.filterEntries(entries, api.tokenize('整理會議'), {}).some(item => item.id === 'UC-277'));
});

test('整理會議紀錄 ranks a meeting title ahead of an incidental memory mention', () => {
  const terms = api.tokenize('整理會議紀錄');
  const matches = api.filterEntries(entries, terms, {});
  const ranked = api.rankEntries(matches, terms);
  const overview = api.filterEntries(entries, terms, { scope: 'overview' });
  assert.ok(matches.some(item => item.id === 'UC-511'), 'the meeting follow-up case stays findable');
  assert.ok(matches.some(item => item.id === 'UC-094'), 'a case whose title is about taking meeting notes stays findable');
  assert.notEqual(ranked[0].id, 'UC-071', 'the first card is not the incidental memory case');
  assert.match(ranked[0].title, /會議/, 'the first card title names the meeting');
  assert.ok(overview.length > 1, 'overview is not a single incidental mention');
  assert.ok(overview.some(item => /會議/.test(item.title)), 'at least one overview hit names the meeting in its title');
  assert.ok(overview.some(item => item.id !== 'UC-071'), 'narrowing does not leave only UC-071');
});

test('the long meeting sentence still recovers 會議, not the grammar word', () => {
  const query = '我想讓 AI 幫我整理會議紀錄';
  const terms = api.tokenize(query);
  const expansion = api.searchExpansion(entries, query, terms, {});
  const searchTerms = expansion ? expansion.terms : terms;
  const rows = searchTerms.map(term => ({
    term,
    scoped: api.filterEntries(entries, [term], { scope: 'overview' }).length
  }));
  const chosen = api.narrowestScopeTerm(rows, searchTerms, 'scoped');
  assert.ok(chosen, 'a recovery word exists');
  assert.equal(chosen.term, '會議');
  assert.notEqual(chosen.term, '讓');
});
