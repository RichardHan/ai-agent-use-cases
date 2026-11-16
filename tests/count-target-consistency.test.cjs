'use strict';
// The collection's stated target moved from 500 to 1,000 qualified workflows.
// Historical research logs keep their 500-era snapshots, but a current case page
// or the current INDEX table must not tell a visitor that a supplement was
// excluded from a retired target: that reads as a second, contradictory count.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const casesDir = path.join(root, 'cases');

// Match the library's own counting language, not every incidental "500" (prices,
// follower counts, model limits). Historical sections are tested separately.
const RETIRED_TARGET = /(?:不另計|不另計入|不計|不增加|未加|不加|另加|增加|計入|列入)\s*(?:入)?\s*500(?!\s*(?:元|円|日圓|美元|歐元|克朗|英鎊|人|名|位|件|次|字|px|MB|GB))(?:\s*(?:案)?(?:目標|計數|案例計數))?|500\s*(?:案目標|目標計數|案例計數|計數)|500\s*案例計數候選/;

function currentCaseFiles() {
  return fs.readdirSync(casesDir).filter(file => file.endsWith('.md')).sort();
}

test('current case pages do not exclude supplements from a retired 500-case target', () => {
  const offenders = [];
  for (const file of currentCaseFiles()) {
    const lines = fs.readFileSync(path.join(casesDir, file), 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (RETIRED_TARGET.test(line)) offenders.push(`${file}:${index + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [],
    'Current case pages must use the 1,000-workflow target or a number-free count wording:\n' + offenders.join('\n'));
});

test('the current INDEX table does not mix the retired 500-case target into present-day status', () => {
  const content = fs.readFileSync(path.join(root, 'INDEX.md'), 'utf8');
  const researchLog = content.indexOf('<a id="research-log"></a>');
  assert.notEqual(researchLog, -1, 'INDEX.md must keep its research-log anchor');
  const current = content.slice(0, researchLog);
  const historical = content.slice(researchLog);

  const offenders = current.split('\n')
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => RETIRED_TARGET.test(line))
    .map(({ line, index }) => `INDEX.md:${index + 1}: ${line.trim()}`);
  assert.deepEqual(offenders, [],
    'The current INDEX table must not quote the retired 500-case target:\n' + offenders.join('\n'));
  assert.match(current, /1,000 個不同實作工作流程為目標/, 'The current INDEX must still state the 1,000-workflow target');

  // The archive is intentionally allowed to keep its historical snapshots; do not
  // turn this guard into a rewrite of the research record.
  assert.match(historical, /500/, 'Historical research snapshots should remain available for audit');
});

test('UC-250 states its merged status against the current target instead of the retired one', () => {
  const page = fs.readFileSync(path.join(casesDir, '250-mail-migration-data-routing-cutover.md'), 'utf8');
  const evidenceLine = page.split('\n').find(line => /^-\s*證據狀態\s*[：:]/.test(line));
  assert.ok(evidenceLine, 'UC-250 must keep a declared evidence-status line');
  assert.match(evidenceLine, /已併入\s*UC-156/, 'UC-250 must name the case it was merged into');
  assert.match(evidenceLine, /不另計入\s*1,000\s*案目標/, 'UC-250 must say it is excluded from the current target');
  assert.doesNotMatch(evidenceLine, /500/, 'UC-250 must not cite the retired 500-case target');
  assert.match(evidenceLine, /保留供搜尋與閱讀/, 'UC-250 must remain readable as a supplement');
});

function loadApi() {
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
  class Node {
    constructor(tag) { this.tagName = tag; this.children = []; this.textContent = ''; }
    append(...children) { this.children.push(...children); }
    setAttribute() {}
  }
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: { createElement: tag => new Node(tag), createTextNode: text => ({ textContent: text }) }
  });
  vm.runInContext(source + '\nthis.api={parseFile,catalogCounts,mergedSupplementNote};', context);
  return context.api;
}

test('the stats note names every merged supplement and never presents it as a separate target case', () => {
  const api = loadApi();
  assert.equal(api.mergedSupplementNote([]), '', 'no merged supplement means no note');

  const one = api.mergedSupplementNote([{ kind: 'case', id: 'UC-250', mergedInto: ['UC-156'] }]);
  assert.match(one, /其中 1 頁（UC-250）/, 'the note names the supplement page');
  assert.match(one, /不另計入 1,000 案目標/, 'the note ties the exclusion to the current target');
  assert.match(one, /保留供搜尋與閱讀|仍可搜尋與閱讀/, 'the note keeps the page readable');

  const many = Array.from({ length: 7 }, (_, index) => ({ kind: 'case', id: `UC-90${index}`, mergedInto: ['UC-156'] }));
  const manyNote = api.mergedSupplementNote(many);
  assert.match(manyNote, /其中 7 頁（UC-900、UC-901、UC-902、UC-903、UC-904 等）/, 'long lists stay bounded and honest');

  const items = currentCaseFiles().flatMap(file => Array.from(api.parseFile('cases/' + file, fs.readFileSync(path.join(casesDir, file), 'utf8'))));
  const merged = items.filter(item => item.kind === 'case' && (item.mergedInto || []).length);
  assert.deepEqual(merged.map(item => item.id), ['UC-250'], 'only UC-250 is a merged case page today');
  assert.deepEqual([...merged[0].mergedInto], ['UC-156'], 'the disclosure points at the real main case');

  const counts = api.catalogCounts(items);
  assert.equal(counts.case, items.filter(item => item.kind === 'case').length, 'the case counter still matches the catalog');
  assert.equal(counts.caseMerged, merged.length, 'the merged-page counter matches the catalog');
  assert.match(api.mergedSupplementNote(items), /其中 1 頁（UC-250）/, 'the real catalog produces the disclosure');
});
