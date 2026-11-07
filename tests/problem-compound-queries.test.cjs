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
test('roster and shift query 排班 isolates from workflow automation noise and ranks genuine shifts cases', () => {
  const shiftTokens = Array.from(api.tokenize('排班'));
  assert.deepEqual(shiftTokens, ['排班'], '排班 must tokenize as a dedicated term');
  const shiftMatches = api.filterEntries(entries, shiftTokens, {});
  assert.ok(shiftMatches.length >= 1 && shiftMatches.length <= 10, `排班 must return between 1 and 10 cases, got ${shiftMatches.length}`);
  const shiftRanked = api.rankEntries(shiftMatches, shiftTokens, '排班');
  assert.ok(shiftRanked.some(r => r.id === 'UC-338'), '排班 must recall driver shift case UC-338');
  assert.ok(shiftRanked.some(r => r.id === 'UC-155'), '排班 must recall job change shift case UC-155');
  assert.ok(shiftRanked.some(r => r.id === 'UC-317'), '排班 must recall night shift bot case UC-317');
  // Workflow automation cases like Facebook poster (UC-006) must NOT match 排班
  assert.ok(!shiftMatches.some(r => r.id === 'UC-006'), '排班 must not match generic Facebook workflow case UC-006');
});

test('natural conversational queries for resume, interview, social copywriting, procurement, and database recall targeted cases', () => {
  const queries = [
    { raw: '如何準備面試', expectedTokens: ['面試', '準備'], min: 5, targetCase: 'UC-035' },
    { raw: '我想寫社群文案', expectedTokens: ['社群', '文案'], min: 5, targetCase: 'UC-268' },
    { raw: '我要審核採購合約', expectedTokens: ['採購', '合約', '審核'], min: 5, targetCase: 'UC-154' },
    { raw: '我想報銷出差費用', expectedTokens: ['出差', '報銷'], min: 4, targetCase: 'UC-263' },
    { raw: '資料庫查詢', expectedTokens: ['資料庫', '查詢'], min: 5, targetCase: 'UC-128' },
    { raw: '履歷健檢', expectedTokens: ['履歷', '修改'], min: 5, targetCase: 'UC-035' }
  ];

  for (const item of queries) {
    const tokens = Array.from(api.tokenize(item.raw));
    assert.deepEqual(tokens, item.expectedTokens, `Tokens for "${item.raw}" must match`);
    const matched = api.filterEntries(entries, tokens, {});
    assert.ok(matched.length >= item.min, `Query "${item.raw}" must return >= ${item.min} cases, got ${matched.length}`);
    const ranked = api.rankEntries(matched, tokens, item.raw);
    assert.ok(ranked.some(r => r.id === item.targetCase), `Query "${item.raw}" must recall ${item.targetCase}`);
  }
});
test('Reviewer regression: prefix verbs must not strip leading chars of full keywords (請問發票報帳, 如何寫作, 如何審核)', () => {
  const invoiceTokens = Array.from(api.tokenize('請問發票報帳'));
  assert.deepEqual(invoiceTokens, ['發票', '報帳'], '請問發票報帳 must preserve 發票 and not truncate to 票');
  const invoiceMatches = api.filterEntries(entries, invoiceTokens, {});
  assert.ok(invoiceMatches.length >= 10, `請問發票報帳 must match >= 10 invoice cases, got ${invoiceMatches.length}`);

  const writingTokens = Array.from(api.tokenize('如何寫作'));
  assert.deepEqual(writingTokens, ['寫作'], '如何寫作 must preserve 寫作 and not truncate to 作');

  const auditTokens = Array.from(api.tokenize('如何審核'));
  assert.deepEqual(auditTokens, ['審核'], '如何審核 must preserve 審核 and not become empty');
  const auditMatches = api.filterEntries(entries, auditTokens, {});
  assert.ok(auditMatches.length >= 10, `如何審核 must match review cases, got ${auditMatches.length}`);
});

test('hero problem tags and empty state suggestions expose 社群文案 and 員工排班', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = html.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav.includes('href="?q=社群文案#explore"'), 'hero-problem-tags must include 社群文案');
  assert.ok(nav.includes('href="?q=排班#explore"'), 'hero-problem-tags must include 員工排班');

  const appSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(appSource, /term:'社群文案'/, 'app.js problemTags must include 社群文案');
  assert.match(appSource, /term:'排班'/, 'app.js problemTags must include 排班');
});

test('natural problem queries for contract review, data extraction, invoice processing, podcast summary, price comparison, customer support, and meeting notes recall targeted cases', () => {
  const problems = [
    { raw: '契約審查', min: 10, expectedTokens: ['契約', '審查'] },
    { raw: '審查契約', min: 10, expectedTokens: ['契約', '審查'] },
    { raw: 'contract review', min: 10, expectedTokens: ['合約', '審核'] },
    { raw: '發票處理', min: 10, expectedTokens: ['發票', '報帳'] },
    { raw: 'invoice processing', min: 10, expectedTokens: ['發票', '報帳'] },
    { raw: '資料擷取', min: 10, expectedTokens: ['文件', '擷取'] },
    { raw: '資料抽取', min: 10, expectedTokens: ['文件', '擷取'] },
    { raw: 'data extraction', min: 10, expectedTokens: ['文件', '擷取'] },
    { raw: '播客摘要', min: 5, expectedTokens: ['播客', '摘要'] },
    { raw: 'podcast summary', min: 5, expectedTokens: ['播客', '摘要'] },
    { raw: '價格比較', min: 20, expectedTokens: ['比價'] },
    { raw: 'price comparison', min: 20, expectedTokens: ['比價'] },
    { raw: '客戶支援', min: 30, expectedTokens: ['客服'] },
    { raw: 'customer support', min: 30, expectedTokens: ['客服'] },
    { raw: '會議筆記', min: 5, expectedTokens: ['會議', '筆記'] },
    { raw: 'meeting notes', min: 5, expectedTokens: ['會議', '筆記'] },
    { raw: 'interview prep', min: 5, expectedTokens: ['面試', '準備'] }
  ];

  for (const p of problems) {
    const tokens = Array.from(api.tokenize(p.raw));
    assert.deepEqual(tokens, p.expectedTokens, `Tokens for "${p.raw}" must match`);
    const matched = api.filterEntries(entries, tokens, {});
    assert.ok(matched.length >= p.min, `Query "${p.raw}" must return >= ${p.min} cases, got ${matched.length}`);
  }
});

test('hero problem tags and empty state suggestions expose 資料擷取, 播客摘要, and 契約審查', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = html.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav.includes('href="?q=資料擷取#explore"'), 'hero-problem-tags must include 資料擷取');
  assert.ok(nav.includes('href="?q=播客摘要#explore"'), 'hero-problem-tags must include 播客摘要');
  assert.ok(nav.includes('href="?q=契約審查#explore"'), 'hero-problem-tags must include 契約審查');

  const appSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(appSource, /term:'資料擷取'/, 'app.js problemTags must include 資料擷取');
  assert.match(appSource, /term:'播客摘要'/, 'app.js problemTags must include 播客摘要');
  assert.match(appSource, /term:'契約審查'/, 'app.js problemTags must include 契約審查');
});

test('Reviewer regression: preserve bill vs invoice distinction and match complete English inflection phrases', () => {
  // Finding 1: 帳單核對 must retain 帳單 and 對帳 without converting to 發票
  const billTokens = Array.from(api.tokenize('帳單核對'));
  assert.deepEqual(billTokens, ['帳單', '對帳'], '帳單核對 must retain 帳單 and 對帳');
  const billMatches = api.filterEntries(entries, billTokens, { scope: 'topic' });
  assert.ok(billMatches.some(e => e.id === 'UC-024'), '帳單核對 in topic scope must match UC-024');

  // Finding 2: contract reviewing must tokenize to 合約 審核 without trailing ing fragment
  const reviewTokens = Array.from(api.tokenize('contract reviewing'));
  assert.deepEqual(reviewTokens, ['合約', '審核'], 'contract reviewing must tokenize cleanly without trailing ing');
  const contractMatches = api.filterEntries(entries, reviewTokens, {});
  assert.ok(contractMatches.some(e => e.id === 'UC-154'), 'contract reviewing must recall contract review case UC-154');
});

test('natural problem queries for competitor research, code debugging, document translation, resume writing, email reply, web scraping, and mock interview recall targeted cases', () => {
  const problems = [
    { raw: '競品分析', min: 5, expectedTokens: ['競品', '分析'], topId: 'UC-039' },
    { raw: '代碼除錯', min: 100, expectedTokens: ['代碼', '除錯'] },
    { raw: '文件翻譯', min: 50, expectedTokens: ['文件', '翻譯'] },
    { raw: '翻譯文件', min: 50, expectedTokens: ['文件', '翻譯'] },
    { raw: '寫週報', min: 10, expectedTokens: ['週報', '整理'] },
    { raw: '寫日報', min: 50, expectedTokens: ['日報', '整理'] },
    { raw: '寫履歷', min: 5, expectedTokens: ['履歷', '修改'], topId: 'UC-035' },
    { raw: '寫文案', min: 20, expectedTokens: ['文案'] },
    { raw: '郵件回覆', min: 50, expectedTokens: ['郵件', '回覆'] },
    { raw: '網頁抓取', min: 25, expectedTokens: ['爬蟲', '抓取'] },
    { raw: '資料抓取', min: 25, expectedTokens: ['爬蟲', '抓取'] },
    { raw: '模擬面試', min: 5, expectedTokens: ['面試', '準備'], topId: 'UC-035' },
    { raw: '面試演練', min: 5, expectedTokens: ['面試', '準備'], topId: 'UC-035' },
    { raw: '語音逐字稿', min: 50, expectedTokens: ['逐字稿'] }
  ];

  for (const p of problems) {
    const tokens = Array.from(api.tokenize(p.raw));
    assert.deepEqual(tokens, p.expectedTokens, `Tokens for "${p.raw}" must match expected`);
    const matched = api.filterEntries(entries, tokens, {});
    assert.ok(matched.length >= p.min, `Query "${p.raw}" must return >= ${p.min} cases, got ${matched.length}`);
    if (p.topId) {
      const ranked = api.rankEntries(matched, tokens);
      assert.equal(ranked[0]?.id, p.topId, `Query "${p.raw}" top case must be ${p.topId}, got ${ranked[0]?.id}`);
    }
  }
});

test('hero problem tags and empty state suggestions expose 競品分析, 代碼除錯, 文件翻譯, 網頁抓取, and 寫履歷', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = html.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav.includes('href="?q=競品分析#explore"'), 'hero-problem-tags must include 競品分析');
  assert.ok(nav.includes('href="?q=代碼除錯#explore"'), 'hero-problem-tags must include 代碼除錯');
  assert.ok(nav.includes('href="?q=文件翻譯#explore"'), 'hero-problem-tags must include 文件翻譯');
  assert.ok(nav.includes('href="?q=網頁抓取#explore"'), 'hero-problem-tags must include 網頁抓取');
  assert.ok(nav.includes('href="?q=寫履歷#explore"'), 'hero-problem-tags must include 寫履歷');

  const appSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(appSource, /term:'競品分析'/, 'app.js problemTags must include 競品分析');
  assert.match(appSource, /term:'代碼除錯'/, 'app.js problemTags must include 代碼除錯');
  assert.match(appSource, /term:'文件翻譯'/, 'app.js problemTags must include 文件翻譯');
  assert.match(appSource, /term:'網頁抓取'/, 'app.js problemTags must include 網頁抓取');
  assert.match(appSource, /term:'寫履歷'/, 'app.js problemTags must include 寫履歷');
});

test('Reviewer regressions: complete keyword boundaries and conversational suffix preservation', () => {
  // Finding 1: code debugging must tokenize cleanly without leaving ging
  const debugTokens = Array.from(api.tokenize('code debugging'));
  assert.deepEqual(debugTokens, ['代碼', '除錯'], 'code debugging must tokenize to 代碼 除錯 without trailing ging');
  const debugMatches = api.filterEntries(entries, debugTokens, {});
  assert.ok(debugMatches.some(e => e.id === 'UC-068'), 'code debugging must match UC-068');

  // Finding 2: 翻譯document must match full word document without leaving ument
  const transTokens = Array.from(api.tokenize('翻譯document'));
  assert.deepEqual(transTokens, ['文件', '翻譯'], '翻譯document must tokenize to 文件 翻譯 without trailing ument');
  const docTransTokens = Array.from(api.tokenize('document 翻譯'));
  assert.deepEqual(docTransTokens, ['文件', '翻譯'], 'document 翻譯 must tokenize to 文件 翻譯');

  // Finding 3: 做法 suffix must not be partially consumed as 做 leaving 法
  const resumeMethodTokens = Array.from(api.tokenize('履歷做法'));
  assert.deepEqual(resumeMethodTokens, ['履歷'], '履歷做法 must tokenize to 履歷 without leaving 法');
  const resumeMatches = api.filterEntries(entries, resumeMethodTokens, { scope: 'topic' });
  assert.ok(resumeMatches.some(e => e.id === 'UC-035'), '履歷做法 must match UC-035');

  const weeklyMethodTokens = Array.from(api.tokenize('週報做法'));
  assert.deepEqual(weeklyMethodTokens, ['週報'], '週報做法 must tokenize to 週報 without leaving 法');
});

test('natural problem queries with conversational quantifiers and modifiers recall targeted cases', () => {
  const testCases = [
    { query: '做一份競品簡報', min: 1, expectedId: 'UC-039' },
    { query: '兩份競品簡報', min: 1, expectedId: 'UC-039' },
    { query: '兩份競品分析', min: 5, expectedId: 'UC-039' },
    { query: '一次性爬蟲', min: 25, expectedId: 'UC-086' },
    { query: '整理一份會議記錄', min: 9, expectedId: 'UC-071' },
    { query: '會議總結', min: 9, expectedId: 'UC-071' },
    { query: '兩週一次日報', min: 50, expectedId: 'UC-049' },
    { query: '整理每週日報', min: 50, expectedId: 'UC-049' },
    { query: '審閱合約', min: 15, expectedId: 'UC-007' },
    { query: '自動寄送郵件', min: 50, expectedId: 'UC-014' },
    { query: '發票辨識', min: 15, expectedId: 'UC-024' },
    { query: '代碼重構', min: 2, expectedId: 'UC-484' }
  ];

  for (const tc of testCases) {
    const tokens = Array.from(api.tokenize(tc.query));
    const matched = api.filterEntries(entries, tokens, {});
    assert.ok(
      matched.length >= tc.min,
      `Query "${tc.query}" (tokens: [${tokens.join(', ')}]) must return at least ${tc.min} cases, got ${matched.length}`
    );
    assert.ok(
      matched.some(e => e.id === tc.expectedId),
      `Query "${tc.query}" must recall expected case ${tc.expectedId}`
    );
  }
});

test('Reviewer regressions: standalone modifiers and invoice scanning queries must be preserved', () => {
  // Finding 1: Standalone 一次性 and 一次性 密碼 must not be stripped
  const singleTokens = Array.from(api.tokenize('一次性'));
  assert.deepEqual(singleTokens, ['一次性'], 'Standalone 一次性 must be preserved as token');
  const singleMatches = api.filterEntries(entries, singleTokens, {});
  assert.equal(singleMatches.length, 31, 'Standalone 一次性 must match 31 cases');

  const otpTokens = Array.from(api.tokenize('一次性 密碼'));
  assert.deepEqual(otpTokens, ['一次性', '密碼'], '一次性 密碼 must preserve both tokens');
  const otpMatches = api.filterEntries(entries, otpTokens, {});
  assert.equal(otpMatches.length, 17, '一次性 密碼 must match 17 cases');

  // Finding 2: Invoice scanning/OCR must retain scanning cases (e.g. UC-270)
  const scanTokens = Array.from(api.tokenize('發票 掃描'));
  assert.deepEqual(scanTokens, ['發票', '掃描'], '發票 掃描 must not be coerced to 報帳');
  const scanMatches = api.filterEntries(entries, scanTokens, {});
  assert.ok(scanMatches.some(e => e.id === 'UC-270'), '發票 掃描 must retain UC-270');

  const ocrTokens = Array.from(api.tokenize('發票 OCR'));
  assert.deepEqual(ocrTokens, ['發票', 'ocr'], '發票 OCR must not be coerced to 報帳');
  const ocrMatches = api.filterEntries(entries, ocrTokens, {});
  assert.ok(ocrMatches.length >= 8, '發票 OCR must match at least 8 cases');
});
