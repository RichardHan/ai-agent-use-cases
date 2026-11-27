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
  vm.runInContext(source + '\nthis.api={parseFile,filterEntries,tokenize,coreGoalView,targetUserView};', context);
  vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);
  return context.api;
}

const corpusFiles = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .concat('sources/pending.md');
const api = loadDiscovery();
const entries = corpusFiles.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));

// Claims are read per rendered paragraph, not per source line: Markdown soft
// breaks are not part of the sentence a visitor reads.
const paragraphs = readme.split(/\n\s*\n/);
const paragraphWith = (...needles) => paragraphs.find(block => needles.every(needle => block.includes(needle)));
const paragraphsWith = (...needles) => paragraphs.filter(block => needles.every(needle => block.includes(needle)));

const numberIn = pattern => {
  const match = readme.match(pattern);
  assert.ok(match, `README must still state this setting: ${pattern}`);
  return Number(match[1]);
};

test('the results batch size in the README is the one the app renders', () => {
  const stated = numberIn(/結果每次先顯示\s*(\d+)\s*(?:筆|則|個)/);
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
  // These are the shapes that drifted: a hit count against a library total, a
  // recovery example with a fixed count, and the stats-card arithmetic. The live
  // sentence already fills in the reader's own numbers, so prose only has to
  // describe the parts (N/A/B/C) and the direction. Equivalent phrasings are
  // covered too: a quoted term followed by a count is the same snapshot however
  // the sentence is built.
  const volatile = [
    [/\d+\s*筆中的\s*\d+\s*筆/, '命中筆數對比全庫總數'],
    [/\d+\s*筆裡[，,]\s*\d+\s*筆/, '結果行的拆分句'],
    [/搜尋\s*\d+\s*筆/, '恢復建議的固定筆數'],
    [/\d+\s*筆文字命中/, '單詞恢復的固定筆數'],
    [/\d+\s*個條目中有\s*\d+\s*個/, '宣告數對比條目總數'],
    [/只加得到\s*\d+\s*＋/, '統計卡的加總算式'],
    [/「[^」]{1,24}」[^。；\n]{0,12}有\s*\d+\s*筆/, '任務詞或工具的固定筆數'],
    [/命中\s*\d+\s*筆/, '命中筆數'],
    [/[0-9]+\s*\/\s*[0-9]+\s*筆/, '結果筆數對比全庫']
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

test('the README describes both target-user display paths without a changing majority claim', () => {
  const claims = paragraphsWith('目標使用者', '宣告');
  assert.equal(claims.length, 1, 'README must keep one target-user explanation');
  const [claim] = claims;
  assert.match(claim, /有宣告[^。]*直接顯示原文/);
  assert.match(claim, /沒宣告[^。]*情境常見讀者[^。]*本庫[^。]*卡片/);
  assert.doesNotMatch(claim, /多數|大部分|大半|過半|半數/,
    'Describe the two display paths independently of their share of the corpus');

  const declared = entries.filter(entry => entry.kind === 'case' && entry.targetUser);
  const missing = entries.filter(entry => entry.kind === 'case' && !entry.targetUser);
  assert.ok(declared.length > 0, 'The corpus must exercise the declared path');
  assert.ok(missing.length > 0, 'The corpus must exercise the scenario path');
  for (const entry of declared) {
    const view = api.targetUserView(entry);
    assert.equal(view.source, 'declared', entry.id);
    assert.equal(view.heading, '適合對象', entry.id);
    assert.equal(view.text, entry.targetUser, entry.id);
  }
  for (const entry of missing) {
    const view = api.targetUserView(entry);
    assert.equal(view?.source, 'scenario', entry.id);
    assert.equal(view.heading, '情境常見讀者', entry.id);
    assert.match(view.note, /本庫.*情境/, entry.id);
  }
});

test('all three core-goal states are still present, as the README describes', () => {
  const index = paragraphs.findIndex(block => block.includes('核心目標') && block.includes('解決痛點'));
  assert.notEqual(index, -1, 'README must keep the 核心目標 description');
  // The three states may be split across adjacent paragraphs (a Markdown blank
  // line is not a semantic boundary), but not scattered through the document.
  const region = paragraphs.slice(index, index + 3).join('\n\n');
  for (const wording of [/宣告/, /問題…」章節/, /沒有宣告/]) {
    assert.match(region, wording,
      'The 核心目標 description must still name every state: ' + wording);
  }
  const states = { declared: 0, section: 0, missing: 0 };
  for (const entry of entries) states[api.coreGoalView(entry).source] += 1;
  for (const state of ['declared', 'section', 'missing']) {
    assert.ok(states[state] > 0,
      `README says all three 核心目標 states exist; "${state}" is now empty (${JSON.stringify(states)}).`);
  }
});

test('the README claim that 權限 is on nearly every case still holds', () => {
  // Every paragraph that makes the 權限 claim is checked: a second, overstated
  // sentence elsewhere must not hide behind one qualified paragraph.
  const claims = paragraphsWith('搜「權限」');
  assert.ok(claims.length, 'README must keep the 權限 example');
  // The corpus is not 100%: the wording may say 幾乎/絕大多數/九成以上, but a
  // promise of 全部 would be false and must fail here.
  for (const claim of claims) {
    assert.doesNotMatch(claim, /(?<!幾乎)(?:全部|所有)案例|(?<!幾乎)每(?:一)?個案例/,
      'The 權限 search does not match every entry; do not promise 全部.');
    assert.doesNotMatch(claim, /這類標題(?:出現)?(?:在)?(?<!幾乎)(?:全部|所有|每(?:一)?個)案例/,
      'Not every case page has a 權限 heading; do not promise 全部.');
  }
  assert.ok(claims.some(claim => /(?:幾乎|絕大多數|九成以上|大部分|多數)/.test(claim)),
    'The 權限 paragraph must keep its measured qualifier');

  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(name => name.endsWith('.md'));
  const withHeading = caseFiles.filter(file => fs.readFileSync(path.join(root, 'cases', file), 'utf8')
    .split('\n').some(line => /^#{1,4}\s/.test(line) && line.includes('權限'))).length;
  assert.ok(withHeading / caseFiles.length >= 0.9,
    `README says nearly every case has a 權限 heading; only ${withHeading}/${caseFiles.length} do.`);

  const hits = api.filterEntries(entries, api.tokenize('權限'), {}).length;
  assert.ok(hits / entries.length >= 0.9,
    `README says 權限 matches nearly every entry; only ${hits}/${entries.length} do.`);
});

test('the README notice threshold is the share in the app', () => {
  const stated = readme.match(/達到\s*([一二三四五六七八九十]+)分之([一二三四五六七八九十]+)\s*時出現/);
  assert.ok(stated, 'README must keep stating when the split notice appears');
  const digits = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  const share = digits[stated[2]] / digits[stated[1]];
  const implemented = Function('return ' + appSource.match(/const BODY_ONLY_NOTICE_SHARE\s*=\s*([^;]+);/)[1])();
  assert.ok(Math.abs(share - implemented) < 1e-9,
    `README says the notice appears at ${stated[0]}; app.js uses ${implemented}.`);
});

test('the README says topic categories are page phrases, and most still appear once', () => {
  const claim = paragraphWith('主題分類', '不是共用主題清單', '多數分類只出現在一筆條目');
  assert.ok(claim, 'README must say a topic category is the page\'s own phrase, not a shared list');
  assert.doesNotMatch(claim, /\d+\s*個分類/, 'README must not pin how many category phrases the current corpus has');
  const counts = new Map();
  for (const item of entries) {
    if (!item.category) continue;
    counts.set(item.category, (counts.get(item.category) || 0) + 1);
  }
  let singleton = 0;
  for (const n of counts.values()) if (n === 1) singleton += 1;
  assert.ok(counts.size > 0 && singleton / counts.size > 0.5,
    `README says most category phrases appear once; ${singleton}/${counts.size} do.`);
});
