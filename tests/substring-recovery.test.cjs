'use strict';
// A visitor asks in their own words ("想學英文") and the strict match is empty,
// because filterEntries() ANDs every token and "想" is not in the corpus. The
// library does answer the same question under its own word ("學英文", 32 cases).
// Only the empty state may read the visitor's characters back to them, so raw
// substrings must not leak into suggestions as fragments ("件匣", "人記").
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
const context = vm.createContext({});
vm.runInContext(source + '\nthis.api={substringRecoveryOptions,filterEntries,tokenize};', context);
const { substringRecoveryOptions, filterEntries, tokenize } = context.api;
const filters = { scenario: '', kind: '', difficulty: '', tool: '', category: '', proof: '', scope: '' };
const item = (search, tags = []) => ({ search, tags, scenario: '學習', kind: 'case', tools: [], category: '語言', proof: '作者報告／示範' });

// Three cases about learning English, three unrelated ones.
const corpus = [
  item('英語 學習 口說 練習', ['語言學習']),
  item('英語 學習 單字', ['語言學習']),
  item('英語 學習 對話', ['語言學習']),
  item('旅遊 住宿 比價'),
  item('發票 報帳'),
  item('會議 記錄'),
];

test('a sentence the strict match cannot answer offers the run the library does index', () => {
  assert.equal(filterEntries(corpus, tokenize('想學英文'), filters).length, 0);
  const options = JSON.parse(JSON.stringify(substringRecoveryOptions(corpus, '想學英文', filters)));
  assert.deepEqual(options, [{ query: '學英文', count: 3 }]);
});

test('the offered run is a literal substring of what the visitor typed, with a measured count', () => {
  const query = '沒時間學英文';
  const options = substringRecoveryOptions(corpus, query, filters);
  assert(options.length > 0, 'a usable run is offered');
  for (const option of options) {
    assert(query.includes(option.query), 'the label quotes the visitor: ' + option.query);
    assert(option.count > 0, 'the count is never zero');
    assert.equal(option.count, filterEntries(corpus, tokenize(option.query), filters).length, 'the count is what the click would show');
  }
});

test('fragments bounded by grammatical particles are never offered', () => {
  // "但沒" and "沒時" both return cases here; neither is a word the visitor typed
  // on purpose, so the label would be nonsense.
  const particles = /[的了嗎呢吧啊但而就都也又還很太不沒有是在和與或及把被讓給對從到想要會能可我你他她它們這那個些什怎樣為一]/;
  for (const query of ['沒時間學英文', '想學英文但沒時間', '想知道有沒有']) {
    for (const option of substringRecoveryOptions(corpus, query, filters)) {
      assert(!particles.test(option.query[0]), 'starts on a particle: ' + option.query);
      assert(!particles.test(option.query[option.query.length - 1]), 'ends on a particle: ' + option.query);
    }
  }
});

test('one or two accidental hits are not offered as a next step', () => {
  const thin = [...corpus, item('英語 學習 罕見詞')];
  const options = JSON.parse(JSON.stringify(substringRecoveryOptions(thin, '想學冷門英文', filters)));
  for (const option of options) {
    assert(option.count >= 3, 'too few matches to call it a next step: ' + JSON.stringify(option));
  }
});

test('a run covering a tenth of the library is not offered as a narrowing', () => {
  const wide = [];
  for (let index = 0; index < 40; index++) wide.push(item('英語 學習 練習'));
  for (let index = 0; index < 10; index++) wide.push(item('旅遊'));
  const options = JSON.parse(JSON.stringify(substringRecoveryOptions(wide, '想學英文', filters)));
  for (const option of options) {
    assert(option.count * 10 <= wide.length, 'the run is not a narrowing: ' + JSON.stringify(option));
  }
});

test('the whole question is never echoed back, and shorter runs defer to the chosen one', () => {
  // The exact query returns nothing here, so it is not offered as its own recovery;
  // the shorter run inside it is the next step.
  assert.deepEqual(JSON.parse(JSON.stringify(substringRecoveryOptions(corpus, '學英文', filters))),
    [{ query: '英文', count: 3 }]);
  // "英文" and "學英文" match the same three cases; only the longer, more
  // specific run is worth a button.
  const offered = JSON.parse(JSON.stringify(substringRecoveryOptions(corpus, '我想學英文', filters)));
  assert.deepEqual(offered, [{ query: '學英文', count: 3 }]);
});

test('nothing word-like in the question means no suggestion, not a guess', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(substringRecoveryOptions(corpus, '有沒有', filters))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(substringRecoveryOptions(corpus, '', filters))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(substringRecoveryOptions([], '想學英文', filters))), []);
});

test('a run is never quoted across a space the visitor typed', () => {
  // "學英 文" has no contiguous "學英文", even though the unspaced question does.
  assert.deepEqual(JSON.parse(JSON.stringify(substringRecoveryOptions(corpus, '想學英文', filters))),
    [{ query: '學英文', count: 3 }]);
  assert.deepEqual(JSON.parse(JSON.stringify(substringRecoveryOptions(corpus, '學英 文', filters))), [],
    'the same characters split by a space are not quoted as one run');
});

test('suggestions respect the limit and are ordered narrowest first', () => {
  const wide = [];
  for (let index = 0; index < 5; index++) wide.push(item('英語 學習 口說'));
  for (let index = 0; index < 7; index++) wide.push(item('旅遊 住宿 比價'));
  for (let index = 0; index < 88; index++) wide.push(item('會議 記錄'));
  const options = JSON.parse(JSON.stringify(substringRecoveryOptions(wide, '想學英文也想去旅遊住宿', filters, 2)));
  assert.deepEqual(options.map(option => option.query), ['學英文', '旅遊'],
    'each recognised run is offered once, narrowest first');
  assert.deepEqual(options.map(option => option.count), [5, 7], 'the counts are the real ones');
  for (let index = 1; index < options.length; index++) {
    assert(options[index - 1].count <= options[index].count, 'narrower runs come first');
  }
  assert.deepEqual(JSON.parse(JSON.stringify(substringRecoveryOptions(wide, '想學英文也想去旅遊住宿', filters, 1))).map(option => option.query),
    ['學英文'], 'the limit is honoured');
});
