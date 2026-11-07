'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];

class Node {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.textContent = '';
  }
  append(...children) {
    this.children.push(...children);
  }
  setAttribute(name, value) {
    this[name] = value;
  }
}

const context = vm.createContext({
  URL,
  Discovery: require('../assets/discovery.js'),
  document: {
    createElement: tag => new Node(tag),
    createTextNode: text => ({ textContent: text })
  }
});

vm.runInContext(
  source + '\nthis.api={metadata,parseFile,filterEntries,norm,safeLink,renderMarkdown,tokenize,idVariants,termVariants,matchCase,mapConcurrent,loadCorpus,SYNONYM_MAP,pinSourcePaths,searchVariantIndex,rankEntries,searchContext};',
  context
);
const api = context.api;
vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);

const files = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(x => x.endsWith('.md')).map(x => dir + '/' + x))
  .concat('sources/pending.md');
const entries = files.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));

test('compound problem queries segment cleanly and recall relevant cases', () => {
  const cases = [
    { query: '自動化測試', minMatches: 100, expectedTokens: ['自動化', '測試'] },
    { query: '測試自動化', minMatches: 100, expectedTokens: ['自動化', '測試'] },
    { query: '出差報銷', minMatches: 4, expectedTokens: ['出差', '報銷'] },
    { query: '差旅報銷', minMatches: 4, expectedTokens: ['差旅', '報銷'] },
    { query: '發票報帳', minMatches: 10, expectedTokens: ['發票', '報帳'] },
    { query: '發票核銷', minMatches: 10, expectedTokens: ['發票', '核銷'] },
    { query: '合約審核', minMatches: 10, expectedTokens: ['合約', '審核'] },
    { query: '合約審查', minMatches: 10, expectedTokens: ['合約', '審查'] },
    { query: '日報整理', minMatches: 50, expectedTokens: ['日報', '整理'] },
    { query: '自動客服', minMatches: 80, expectedTokens: ['客服'] },
    { query: '客服機器人', minMatches: 80, expectedTokens: ['客服'] },
    { query: '信箱清理', minMatches: 50, expectedTokens: ['信箱', '清理'] },
    { query: '行程規劃', minMatches: 20, expectedTokens: ['行程', '規劃'] },
    { query: '比價省錢', minMatches: 40, expectedTokens: ['比價', '省錢'] },
    { query: '履歷修改', minMatches: 5, expectedTokens: ['履歷', '修改'] },
    { query: '面試準備', minMatches: 5, expectedTokens: ['面試', '準備'] }
  ];

  for (const c of cases) {
    const tokens = Array.from(api.tokenize(c.query));
    assert.deepEqual(tokens, c.expectedTokens, `Tokens for "${c.query}" must match expected`);
    const matched = api.filterEntries(entries, tokens, {});
    assert.ok(
      matched.length >= c.minMatches,
      `Query "${c.query}" must return >= ${c.minMatches} cases, got ${matched.length}`
    );
  }
});

test('natural conversational queries strip intent prefixes and filler suffixes', () => {
  const conversational = [
    { raw: '我想做自動化測試', expectedTokens: ['自動化', '測試'], minMatches: 100 },
    { raw: '有沒有自動化測試的案例', expectedTokens: ['自動化', '測試'], minMatches: 100 },
    { raw: '請問如何做發票報帳', expectedTokens: ['發票', '報帳'], minMatches: 10 },
    { raw: '想了解出差報銷的做法', expectedTokens: ['出差', '報銷'], minMatches: 4 },
    { raw: '幫我整理日報', expectedTokens: ['整理', '日報'], minMatches: 50 },
    { raw: '想知道合約審核的案例', expectedTokens: ['合約', '審核'], minMatches: 10 }
  ];

  for (const item of conversational) {
    const tokens = Array.from(api.tokenize(item.raw));
    assert.deepEqual(tokens, item.expectedTokens, `Tokens for conversational query "${item.raw}" must match`);
    const matched = api.filterEntries(entries, tokens, {});
    assert.ok(
      matched.length >= item.minMatches,
      `Conversational query "${item.raw}" must return >= ${item.minMatches} cases, got ${matched.length}`
    );
  }
});

test('canonical cases rank at top for compound problem queries', () => {
  // 自動客服 should rank canonical inbox/support case UC-014 at top
  const supportTokens = Array.from(api.tokenize('自動客服'));
  const supportMatched = api.filterEntries(entries, supportTokens, {});
  const supportRanked = api.rankEntries(supportMatched, supportTokens);
  assert.equal(supportRanked[0].id, 'UC-014', '自動客服 must rank UC-014 at top 1');

  // 信箱清理 should rank UC-014 at top
  const inboxTokens = Array.from(api.tokenize('信箱清理'));
  const inboxMatched = api.filterEntries(entries, inboxTokens, {});
  const inboxRanked = api.rankEntries(inboxMatched, inboxTokens);
  assert.ok(inboxRanked.slice(0, 5).some(r => r.id === 'UC-014'), '信箱清理 must rank UC-014 in top 5');

  // 出差報銷 should rank UC-284 (行李延誤用品報銷) at top 1
  const expenseTokens = Array.from(api.tokenize('出差報銷'));
  const expenseMatched = api.filterEntries(entries, expenseTokens, {});
  const expenseRanked = api.rankEntries(expenseMatched, expenseTokens);
  assert.equal(expenseRanked[0].id, 'UC-263', '出差報銷 must rank UC-263 at top 1');

  // 合約審核 should rank UC-154 at top 1
  const contractTokens = Array.from(api.tokenize('合約審核'));
  const contractMatched = api.filterEntries(entries, contractTokens, {});
  const contractRanked = api.rankEntries(contractMatched, contractTokens);
  assert.ok(contractRanked.slice(0, 3).some(r => r.id === 'UC-154'), '合約審核 must rank UC-154 in top 3');
});

test('preserves bill terminology and standalone recommendation keywords (Reviewer findings)', () => {
  // Finding 1: 帳單對帳 must preserve 帳單 noun and match UC-024 in topic scope
  const billTokens = Array.from(api.tokenize('帳單對帳'));
  assert.deepEqual(billTokens, ['帳單', '對帳'], '帳單對帳 must retain 帳單 and 對帳 without converting to 發票');
  const billMatches = api.filterEntries(entries, billTokens, { scope: 'topic' });
  assert.ok(billMatches.some(e => e.id === 'UC-024'), '帳單對帳 in topic scope must match UC-024');

  // Finding 2: Standalone 推薦 and youtube 推薦 must not be stripped as prefixes
  const singleRec = Array.from(api.tokenize('推薦'));
  assert.deepEqual(singleRec, ['推薦'], 'Standalone 推薦 must be preserved as token');
  const youtubeRec = Array.from(api.tokenize('youtube 推薦'));
  assert.deepEqual(youtubeRec, ['youtube', '推薦'], 'youtube 推薦 must preserve both tokens');
  assert.ok(api.filterEntries(entries, youtubeRec, {}).length > 0, 'youtube 推薦 must return matching cases');
});

test('hero problem tags expose 出差報銷 and 合約審核 with valid targets and real recall', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = html.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav.includes('href="?q=出差報銷#explore"'), 'hero-problem-tags must include 出差報銷');
  assert.ok(nav.includes('href="?q=合約審核#explore"'), 'hero-problem-tags must include 合約審核');

  const expenseTokens = Array.from(api.tokenize('出差報銷'));
  const expenseHits = api.filterEntries(entries, expenseTokens, {});
  assert.ok(expenseHits.length >= 4, '出差報銷 query must recall at least 4 matching cases');

  const contractTokens = Array.from(api.tokenize('合約審核'));
  const contractHits = api.filterEntries(entries, contractTokens, {});
  assert.ok(contractHits.length >= 10, '合約審核 query must recall at least 10 matching cases');
});
