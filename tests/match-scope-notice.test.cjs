'use strict';
// The results screen shows one headline count. This suite pins when that count is
// allowed to stand alone: a body-only tail under two thirds of the set is normal
// full-text behaviour (會議: 13 of 26), a dominating tail is not (安全防護: 196 of
// 220), and an empty purpose set keeps the older single-word exit.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
const context = vm.createContext({ URL, Discovery: require('../assets/discovery.js') });
vm.runInContext(source + '\nthis.api={matchScopeNotice,joinSearchTerms,filterEntries,tokenize,parseFile,rankEntries,BODY_ONLY_NOTICE_SHARE};', context);
const api = context.api;

const entries = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md'))
    .map(name => Array.from(api.parseFile(dir + '/' + name, fs.readFileSync(path.join(root, dir, name), 'utf8')))))
  .flat()
  .concat(Array.from(api.parseFile('sources/pending.md', fs.readFileSync(path.join(root, 'sources/pending.md'), 'utf8'))));

const measure = query => {
  const terms = Array.from(api.tokenize(query));
  const full = api.filterEntries(entries, terms, {});
  const purpose = api.filterEntries(entries, terms, { scope: 'overview' });
  return { terms, full, purpose, notice: api.matchScopeNotice(purpose.length, full.length) };
};

test('the notice only fires when the body-only tail is the majority', () => {
  const { matchScopeNotice } = api;
  assert.equal(api.BODY_ONLY_NOTICE_SHARE, 2 / 3, 'the share is the measured two thirds');
  assert.equal(matchScopeNotice(0, 0), '', 'nothing loaded is not a body-only tail');
  assert.equal(matchScopeNotice(5, 0), '', 'an empty set never claims a tail');
  assert.equal(matchScopeNotice(5, 5), '', 'every match describes itself: stay quiet');
  assert.equal(matchScopeNotice(6, 5), '', 'an impossible count must not print a negative tail');
  assert.equal(matchScopeNotice(0, 5), 'none', 'no purpose match keeps the single-word exit');
  assert.equal(matchScopeNotice(4, 5), '', 'one body-only result in five is not worth a notice');
  assert.equal(matchScopeNotice(2, 4), '', 'half the set is still a usable headline');
  assert.equal(matchScopeNotice(1, 3), 'body', 'two of three body-only results are the majority');
  assert.equal(matchScopeNotice(1, 5), 'body', 'one of five keeps the disclosure');
  assert.equal(matchScopeNotice(0, 1), 'none', 'the whole set is body-only: use the word exit');
});

test('the narrower set is a real subset and the promised count is exact', () => {
  for (const query of ['安全防護', '報表比對', '成本分析', '資料清理', '會議', '播客摘要', '出差報銷', '排班']) {
    const { full, purpose } = measure(query);
    const purposeIds = new Set(purpose.map(item => item.id));
    assert.equal(full.filter(item => purposeIds.has(item.id)).length, purpose.length,
      `"${query}": every title/purpose match must also be a full-text match`);
    assert.ok(purpose.length <= full.length, `"${query}": the narrower set cannot exceed the whole: ${purpose.length} > ${full.length}`);
  }
});

test('queries that answer themselves stay quiet and flood queries say so', () => {
  assert.equal(measure('會議').notice, '', '會議: 13 of 26 keep the headline honest');
  assert.equal(measure('安全防護').notice, 'body', '安全防護: 196 of 220 are body mentions');
  assert.equal(measure('報表比對').notice, 'body', '報表比對: 270 of 279 are body mentions');
  assert.equal(measure('成本分析').notice, 'body', '成本分析: 221 of 223 are body mentions');
  assert.equal(measure('播客摘要').notice, 'none', '播客摘要: no case holds both words in title/purpose');
  assert.equal(measure('出差報銷').notice, 'none', '出差報銷: the library has no such case in title/purpose');
});

test('narrowing writes words that tokenise back to themselves', () => {
  // "庫存 追蹤" is rewritten to ["庫存"] before matching, so a space-joined field
  // would promise a count for two words and then search one.
  assert.deepEqual(Array.from(api.tokenize('庫存 追蹤')), ['庫存'], 'the rewrite merges these two words');
  const joined = api.joinSearchTerms(['庫存', '追蹤']);
  assert.equal(joined, '庫存、追蹤', 'the guarded join keeps both words');
  assert.deepEqual(Array.from(api.tokenize(joined)), ['庫存', '追蹤'], 'and the field tokenises back to them');
  assert.equal(api.joinSearchTerms(['安全防護']), '安全防護', 'a single word is written back unchanged');
  assert.equal(api.joinSearchTerms(['契約', '審查']), '契約、審查', 'a multi-word query joins deterministically');
  for (const terms of [['庫存', '追蹤'], ['整理', '簡報'], ['比價', '機票'], ['會議', '筆記']]) {
    assert.deepEqual(Array.from(api.tokenize(api.joinSearchTerms(terms))), terms, `round trip for ${terms.join('+')}`);
  }
});

test('narrowing keeps the reader’s other conditions', () => {
  const terms = Array.from(api.tokenize('安全防護'));
  const scoped = { kind: 'case' };
  const full = api.filterEntries(entries, terms, scoped);
  const purpose = api.filterEntries(entries, terms, { ...scoped, scope: 'overview' });
  assert.ok(full.length > 0 && purpose.length > 0, 'the fixture condition still has results');
  assert.ok(purpose.length < full.length, 'the fixture condition still has a body-only tail');
  assert.equal(api.matchScopeNotice(purpose.length, full.length), 'body');
  for (const item of purpose) assert.equal(item.kind, 'case', 'the facet applies to the narrower set too');
});
