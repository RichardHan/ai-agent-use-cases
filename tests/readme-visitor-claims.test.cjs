'use strict';
// The front page (README.md) explains what the search actually does, and it used
// to do that with literal counts ("搜「權限」會命中 529 筆中的 521 筆", "單搜
// 「機票」有 11 筆"). Every batch of new cases moved those numbers, and nothing
// checked them, so the page kept describing a corpus that no longer existed —
// while the same sentences are rendered live from the corpus. Two rules keep it
// honest without making every content commit edit prose:
//   1. numbers that are settings (batch size, mobile task list, related-tag
//      share, the 1,000-case target) must equal the code that implements them;
//   2. claims that depend on the corpus must be phrased as properties that the
//      corpus still has ("多數條目沒有宣告", "幾乎每個案例"), and are checked
//      here against the corpus itself. A literal corpus total is refused.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/style.css'), 'utf8');

// Runs the same discovery code the browser runs, so these counts cannot drift
// from what a visitor sees. No DOM: only parseFile/filterEntries are used.
function loadDiscovery() {
  const source = appSource.split('/* Browser event bindings. */')[0];
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: {
      createElement: () => ({
        className: '', textContent: '', children: [], dataset: {},
        append() {}, setAttribute() {}, addEventListener() {},
        replaceChildren() {}, querySelector() { return null; }
      }),
      createTextNode: text => ({ textContent: String(text) })
    }
  });
  vm.runInContext(source + '\nthis.api={parseFile,filterEntries,tokenize,coreGoalView};', context);
  vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);
  return context.api;
}

const corpusFiles = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .concat('sources/pending.md');
const api = loadDiscovery();
const entries = corpusFiles.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));

const numberIn = pattern => {
  const match = readme.match(pattern);
  assert.ok(match, `README must still state this setting: ${pattern}`);
  return Number(match[1]);
};

test('the results batch size in the README is the one the app renders', () => {
  const stated = numberIn(/結果每次先顯示\s*(\d+)\s*筆/);
  const implemented = Number(appSource.match(/const RESULT_BATCH_SIZE=(\d+);/)[1]);
  assert.equal(stated, implemented,
    `README promises ${stated} results per batch; app.js renders ${implemented}.`);
});

test('the mobile task-list size and its CSS cut-off match the README', () => {
  const stated = numberIn(/顯示前\s*(\d+)\s*項/);
  const scripted = Number(appSource.match(/const visibleCount=(\d+);/)[1]);
  // The CSS hides everything after the cut-off without naming the number, so the
  // two must agree: n+10 is the first hidden link after nine visible ones.
  const cssCut = Number(css.match(/\.hero-problem-tags\[data-collapsed="true"\]>a:nth-of-type\(n\+(\d+)\)/)[1]);
  assert.equal(stated, scripted, `README promises ${stated} tasks; app.js shows ${scripted}.`);
  assert.equal(cssCut, stated + 1, `README promises ${stated} tasks; CSS hides from item ${cssCut}.`);
});

test('the related-reading tag share in the README is the threshold in the app', () => {
  const stated = numberIn(/全庫\s*(\d+)%\s*以下/);
  const implemented = Number(appSource.match(/const RELATED_SPECIFIC_TAG_SHARE\s*=\s*([0-9.]+);/)[1]) * 100;
  assert.equal(stated, implemented, `README says ${stated}%; app.js uses ${implemented}%.`);
});

test('the README never pins a corpus total that new cases would move', () => {
  // These are the exact shapes that drifted: a hit count against a library total,
  // a recovery example with a fixed count, and the stats-card arithmetic. The live
  // sentence already fills in the reader's own numbers, so prose only has to
  // describe the parts (N/A/B/C) and the direction.
  const volatile = [
    [/\d+\s*筆中的\s*\d+\s*筆/, '命中筆數對比全庫總數'],
    [/\d+\s*筆裡[，,]\s*\d+\s*筆/, '結果行的拆分句'],
    [/搜尋\s*\d+\s*筆/, '恢復建議的固定筆數'],
    [/\d+\s*筆文字命中/, '單詞恢復的固定筆數'],
    [/\d+\s*個條目中有\s*\d+\s*個/, '宣告數對比條目總數'],
    [/只加得到\s*\d+\s*＋/, '統計卡的加總算式'],
    [/單搜「[^」]*」有\s*\d+\s*筆/, '單一任務詞的固定筆數']
  ];
  const offenders = [];
  for (const [pattern, label] of volatile) {
    const match = readme.match(pattern);
    if (match) offenders.push(`${label}：${match[0]}`);
  }
  assert.deepEqual(offenders, [],
    'README must describe the mechanism (N/A/B/C, 多數, 幾乎) instead of a corpus count '
    + 'that the next batch of cases invalidates:\n' + offenders.join('\n'));
});

test('the README claim that most entries declare no target user still holds', () => {
  assert.match(readme, /目前多數條目沒有宣告/,
    'If the corpus now declares 目標使用者 on most entries, README must say so.');
  const declared = entries.filter(entry => entry.targetUser).length;
  assert.ok(declared * 2 < entries.length,
    `README says most entries declare no 目標使用者, but ${declared}/${entries.length} do.`);
});

test('all three core-goal states are still present, as the README describes', () => {
  assert.match(readme, /三種狀態都存在/, 'README must keep describing the three states');
  const states = { declared: 0, section: 0, missing: 0 };
  for (const entry of entries) states[api.coreGoalView(entry).source] += 1;
  for (const state of ['declared', 'section', 'missing']) {
    assert.ok(states[state] > 0,
      `README says all three 核心目標 states exist; "${state}" is now empty (${JSON.stringify(states)}).`);
  }
});

test('the README claim that 權限 is on nearly every case still holds', () => {
  assert.match(readme, /這類標題幾乎每個案例都有/,
    'A heading-share claim changed; re-measure before promising "幾乎每個案例".');
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(name => name.endsWith('.md'));
  const withHeading = caseFiles.filter(file => fs.readFileSync(path.join(root, 'cases', file), 'utf8')
    .split('\n').some(line => /^#{1,4}\s/.test(line) && line.includes('權限'))).length;
  assert.ok(withHeading / caseFiles.length >= 0.9,
    `README says nearly every case has a 權限 heading; only ${withHeading}/${caseFiles.length} do.`);

  assert.match(readme, /搜「權限」會命中幾乎全部案例/,
    'The 權限 search-share claim changed; re-measure it.');
  const hits = api.filterEntries(entries, api.tokenize('權限'), {}).length;
  assert.ok(hits / entries.length >= 0.9,
    `README says 權限 matches nearly every entry; only ${hits}/${entries.length} do.`);
});
