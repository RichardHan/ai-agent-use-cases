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

test('natural problem queries for surveys, literature review, airfare comparison, and expense reimbursement recall targeted cases', () => {
  const testCases = [
    { query: '問卷調查', min: 10, expectedId: 'UC-253' },
    { query: '設計一份問卷', min: 10, expectedId: 'UC-401' },
    { query: '問卷分析', min: 10, expectedId: 'UC-253' },
    { query: '文獻回顧', min: 2, expectedId: 'UC-012' },
    { query: '文獻整理', min: 2, expectedId: 'UC-012' },
    { query: '機票比價', min: 2, expectedId: 'UC-001' },
    { query: '航班比價', min: 2, expectedId: 'UC-001' },
    { query: '機票價格', min: 2, expectedId: 'UC-001' },
    { query: '費用報銷', min: 3, expectedId: 'UC-103' },
    { query: '我想報銷費用', min: 3, expectedId: 'UC-103' },
    { query: '差旅費用', min: 3, expectedId: 'UC-103' }
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

test('hero problem tags and empty state suggestions expose 問卷調查, 文獻回顧, and 機票比價', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = html.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav.includes('href="?q=問卷調查#explore"'), 'hero-problem-tags must include 問卷調查');
  assert.ok(nav.includes('href="?q=文獻回顧#explore"'), 'hero-problem-tags must include 文獻回顧');
  assert.ok(nav.includes('href="?q=機票比價#explore"'), 'hero-problem-tags must include 機票比價');

  const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(appJs, /term:\s*['"]問卷調查['"]/, 'app.js empty state problem tags must include 問卷調查');
  assert.match(appJs, /term:\s*['"]文獻回顧['"]/, 'app.js empty state problem tags must include 文獻回顧');
  assert.match(appJs, /term:\s*['"]機票比價['"]/, 'app.js empty state problem tags must include 機票比價');
});

test('Reviewer regressions: complete airfare phrases and travel vs non-travel reimbursement separation', () => {
  // Finding 1: generic reimbursement must preserve 費用 報銷 and recall UC-225
  const expenseTokens = Array.from(api.tokenize('費用報銷'));
  assert.deepEqual(expenseTokens, ['費用', '報銷'], '費用報銷 must normalize to [費用, 報銷] without false travel constraint');
  const expenseHits = api.filterEntries(entries, expenseTokens, {});
  assert.ok(expenseHits.some(e => e.id === 'UC-225'), '費用報銷 must recall generic expense case UC-225');

  const travelExpenseTokens = Array.from(api.tokenize('差旅費用'));
  assert.deepEqual(travelExpenseTokens, ['差旅', '報銷'], '差旅費用 must normalize to [差旅, 報銷]');
  const travelExpenseHits = api.filterEntries(entries, travelExpenseTokens, {});
  assert.ok(travelExpenseHits.some(e => e.id === 'UC-103'), '差旅費用 must recall travel expense case UC-103');

  // Finding 2: airfare compound queries must consume complete compound without trailing words
  const queryLookup = Array.from(api.tokenize('機票比價查詢'));
  assert.deepEqual(queryLookup, ['機票', '比價'], '機票比價查詢 must tokenize to [機票, 比價]');

  const querySite = Array.from(api.tokenize('機票比價網'));
  assert.deepEqual(querySite, ['機票', '比價'], '機票比價網 must tokenize to [機票, 比價]');

  const queryCompare = Array.from(api.tokenize('機票價格比較'));
  assert.deepEqual(queryCompare, ['機票', '比價'], '機票價格比較 must tokenize to [機票, 比價]');

  // ADS-B flight radar tracking must not be broken by airfare queries
  const flightRadar = Array.from(api.tokenize('航班追蹤'));
  assert.deepEqual(flightRadar, ['航班追蹤'], '航班追蹤 must tokenize to [航班追蹤]');
  const flightHits = api.filterEntries(entries, flightRadar, {});
  assert.ok(flightHits.some(e => e.id === 'UC-334'), '航班追蹤 must recall flight radar case UC-334');
});

test('natural problem queries for data cleaning, log analysis, compliance, and slide presentations recall targeted cases', () => {
  const testCases = [
    { query: '資料清理', expectedTokens: ['資料', '整理'], expectedId: 'UC-036', topId: 'UC-036' },
    { query: '清理資料', expectedTokens: ['資料', '整理'], expectedId: 'UC-036' },
    { query: '資料清洗', expectedTokens: ['資料', '整理'], expectedId: 'UC-036' },
    { query: '我想清理資料', expectedTokens: ['資料', '整理'], expectedId: 'UC-036' },
    { query: '日誌分析', expectedTokens: ['日誌'], expectedId: 'UC-096', topId: 'UC-096' },
    { query: '分析日誌', expectedTokens: ['日誌'], expectedId: 'UC-096', topId: 'UC-096' },
    { query: '伺服器日誌', expectedTokens: ['日誌'], expectedId: 'UC-096', topId: 'UC-096' },
    { query: '我想分析伺服器日誌', expectedTokens: ['日誌'], expectedId: 'UC-096', topId: 'UC-096' },
    { query: '法規遵循', expectedTokens: ['法規', '審查'], expectedId: 'UC-102', topId: 'UC-102' },
    { query: '合規審查', expectedTokens: ['法規', '審查'], expectedId: 'UC-102', topId: 'UC-102' },
    { query: '法規查核', expectedTokens: ['法規', '審查'], expectedId: 'UC-102', topId: 'UC-102' },
    { query: '合規檢查', expectedTokens: ['法規', '審查'], expectedId: 'UC-102', topId: 'UC-102' },
    { query: '做簡報', expectedTokens: ['簡報'], expectedId: 'UC-019' },
    { query: '製作簡報', expectedTokens: ['簡報'], expectedId: 'UC-019' },
    { query: '做投影片', expectedTokens: ['簡報'], expectedId: 'UC-019' },
    { query: '投影片製作', expectedTokens: ['簡報'], expectedId: 'UC-019' }
  ];

  for (const tc of testCases) {
    const tokens = Array.from(api.tokenize(tc.query));
    assert.deepEqual(tokens, tc.expectedTokens, `Query "${tc.query}" must tokenize to ${JSON.stringify(tc.expectedTokens)}`);
    const matched = api.filterEntries(entries, tokens, {});
    assert.ok(
      matched.some(e => e.id === tc.expectedId),
      `Query "${tc.query}" must recall expected case ${tc.expectedId}`
    );
    if (tc.topId) {
      const ranked = api.rankEntries(matched, tokens);
      assert.equal(
        ranked[0]?.id,
        tc.topId,
        `Query "${tc.query}" top case must be ${tc.topId}, got ${ranked[0]?.id}`
      );
    }
  }
});

test('hero problem tags and empty state suggestions expose 資料清理, 日誌分析, and 法規遵循', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = html.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav.includes('href="?q=資料清理#explore"'), 'hero-problem-tags must include 資料清理');
  assert.ok(nav.includes('href="?q=日誌分析#explore"'), 'hero-problem-tags must include 日誌分析');
  assert.ok(nav.includes('href="?q=法規遵循#explore"'), 'hero-problem-tags must include 法規遵循');

  const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(appJs, /term:\s*['"]資料清理['"]/, 'app.js empty state problem tags must include 資料清理');
  assert.match(appJs, /term:\s*['"]日誌分析['"]/, 'app.js empty state problem tags must include 日誌分析');
  assert.match(appJs, /term:\s*['"]法規遵循['"]/, 'app.js empty state problem tags must include 法規遵循');
});

test('Reviewer regressions: consume full compound phrases including 日誌記錄, 整理乾淨, and 合規性 without trailing fragments', () => {
  // Finding 1: 分析 日誌記錄 must tokenize to [日誌] and recall UC-096
  const logRecordTokens = Array.from(api.tokenize('分析日誌記錄'));
  assert.deepEqual(logRecordTokens, ['日誌'], '分析日誌記錄 must tokenize to [日誌] without leaving 記錄');
  const logHits = api.filterEntries(entries, logRecordTokens, {});
  assert.ok(logHits.some(e => e.id === 'UC-096'), '分析日誌記錄 must recall UC-096');

  // Finding 2: longer alternatives must not leave shadow fragments
  const cleanTokens = Array.from(api.tokenize('資料整理乾淨'));
  assert.deepEqual(cleanTokens, ['資料', '整理'], '資料整理乾淨 must tokenize to [資料, 整理] without leaving 乾淨');
  const cleanHits = api.filterEntries(entries, cleanTokens, {});
  assert.ok(cleanHits.some(e => e.id === 'UC-036'), '資料整理乾淨 must recall UC-036');

  const logFileTokens = Array.from(api.tokenize('伺服器日誌檔'));
  assert.deepEqual(logFileTokens, ['日誌'], '伺服器日誌檔 must tokenize to [日誌] without leaving 檔');

  const complianceTokens = Array.from(api.tokenize('檢查合規性'));
  assert.deepEqual(complianceTokens, ['法規', '審查'], '檢查合規性 must tokenize to [法規, 審查] without leaving 性');
  const compHits = api.filterEntries(entries, complianceTokens, {});
  assert.ok(compHits.some(e => e.id === 'UC-102'), '檢查合規性 must recall UC-102');

  const compFollowTokens = Array.from(api.tokenize('法規遵循檢查'));
  assert.deepEqual(compFollowTokens, ['法規', '審查'], '法規遵循檢查 must tokenize to [法規, 審查]');
});

test('natural problem queries for note organization, knowledge bases, customer feedback, and interview preparation recall targeted cases', () => {
  const queries = [
    { raw: '筆記整理', expectedTokens: ['筆記', '整理'], minMatches: 40, canonicalId: 'UC-491' },
    { raw: '整理筆記', expectedTokens: ['筆記', '整理'], minMatches: 40, canonicalId: 'UC-491' },
    { raw: '幫我整理筆記', expectedTokens: ['筆記', '整理'], minMatches: 40, canonicalId: 'UC-491' },
    { raw: '個人知識庫', expectedTokens: ['知識庫'], minMatches: 25, canonicalId: 'UC-060' },
    { raw: '知識庫搭建', expectedTokens: ['知識庫'], minMatches: 25, canonicalId: 'UC-060' },
    { raw: '建立個人知識庫', expectedTokens: ['知識庫'], minMatches: 25, canonicalId: 'UC-060' },
    { raw: '知識管理', expectedTokens: ['知識庫'], minMatches: 25, canonicalId: 'UC-060' },
    { raw: '客戶反饋', expectedTokens: ['客戶', '回饋'], minMatches: 10, canonicalId: 'UC-011' },
    { raw: '用戶反饋', expectedTokens: ['客戶', '回饋'], minMatches: 10, canonicalId: 'UC-011' },
    { raw: '客戶意見', expectedTokens: ['客戶', '回饋'], minMatches: 10, canonicalId: 'UC-011' },
    { raw: '分析用戶反饋', expectedTokens: ['客戶', '回饋'], minMatches: 10, canonicalId: 'UC-011' },
    { raw: '客訴分析', expectedTokens: ['客訴', '工單'], minMatches: 50, canonicalId: 'UC-014' },
    { raw: '客訴工單', expectedTokens: ['客訴', '工單'], minMatches: 50, canonicalId: 'UC-014' },
    { raw: '面試提問', expectedTokens: ['面試', '準備'], minMatches: 5, canonicalId: 'UC-035' },
    { raw: '面試題目', expectedTokens: ['面試', '準備'], minMatches: 5, canonicalId: 'UC-035' },
    { raw: '履歷篩選', expectedTokens: ['履歷', '修改'], minMatches: 5, canonicalId: 'UC-035' }
  ];

  for (const item of queries) {
    const tokens = Array.from(api.tokenize(item.raw));
    assert.deepEqual(tokens, item.expectedTokens, `Tokens for "${item.raw}" must match expected`);
    const hits = api.filterEntries(entries, tokens, {});
    assert.ok(
      hits.length >= item.minMatches,
      `Query "${item.raw}" must return >= ${item.minMatches} cases, got ${hits.length}`
    );
    assert.ok(
      hits.some(e => e.id === item.canonicalId),
      `Query "${item.raw}" must recall canonical case ${item.canonicalId}`
    );
  }
});

test('hero problem tags and empty state suggestions expose 筆記整理, 客戶反饋, and 面試準備', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = html.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav.includes('href="?q=筆記整理#explore"'), 'hero-problem-tags must include 筆記整理');
  assert.ok(nav.includes('href="?q=客戶反饋#explore"'), 'hero-problem-tags must include 客戶反饋');
  assert.ok(nav.includes('href="?q=面試準備#explore"'), 'hero-problem-tags must include 面試準備');

  const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(appJs, /term:\s*['"]筆記整理['"]/, 'app.js empty state problem tags must include 筆記整理');
  assert.match(appJs, /term:\s*['"]客戶反饋['"]/, 'app.js empty state problem tags must include 客戶反饋');
  assert.match(appJs, /term:\s*['"]面試準備['"]/, 'app.js empty state problem tags must include 面試準備');
});

test('Reviewer regressions: complete prefix stripping, compound preservation, customer demand separation, and smart support preservation', () => {
  // Finding 1: 請幫我 prefix must be fully consumed without leaving stray 請
  const pleaseTokens = Array.from(api.tokenize('請幫我整理筆記'));
  assert.deepEqual(pleaseTokens, ['筆記', '整理'], '請幫我整理筆記 must tokenize to [筆記, 整理] without leaving stray 請');
  const pleaseHits = api.filterEntries(entries, pleaseTokens, {});
  assert.ok(pleaseHits.some(e => e.id === 'UC-491'), '請幫我整理筆記 must recall UC-491');

  // Finding 2: 筆記本/筆記軟體 compound must not leave stray 本 or 軟體
  const notebookTokens = Array.from(api.tokenize('整理筆記本'));
  assert.deepEqual(notebookTokens, ['筆記', '整理'], '整理筆記本 must tokenize to [筆記, 整理] without leaving stray 本');
  const notebookHits = api.filterEntries(entries, notebookTokens, {});
  assert.ok(notebookHits.some(e => e.id === 'UC-491'), '整理筆記本 must recall UC-491');

  // Finding 3: 客戶需求 must not be forcibly rewritten to 回饋 and must recall UC-019
  const demandTokens = Array.from(api.tokenize('客戶需求'));
  assert.ok(!demandTokens.includes('回饋'), '客戶需求 must not be rewritten to 回饋');
  const demandHits = api.filterEntries(entries, demandTokens, {});
  assert.ok(demandHits.some(e => e.id === 'UC-019'), '客戶需求 must recall UC-019');

  // Finding 4: 智能客服工單 must not leave stray 智能 and must recall UC-014
  const smartSupportTokens = Array.from(api.tokenize('智能客服工單'));
  assert.deepEqual(smartSupportTokens, ['客訴', '工單'], '智能客服工單 must tokenize to [客訴, 工單] without leaving stray 智能');
  const smartSupportHits = api.filterEntries(entries, smartSupportTokens, {});
  assert.ok(smartSupportHits.some(e => e.id === 'UC-014'), '智能客服工單 must recall UC-014');
});

test('natural problem queries for marketing copy, performance analysis, expense approval, and slide decks recall targeted cases', () => {
  const queries = [
    { raw: '行銷文案', expectedTokens: ['行銷', '文案'], minMatches: 10, canonicalId: 'UC-268' },
    { raw: '寫行銷文案', expectedTokens: ['行銷', '文案'], minMatches: 10, canonicalId: 'UC-268' },
    { raw: '撰寫行銷文案', expectedTokens: ['行銷', '文案'], minMatches: 10, canonicalId: 'UC-268' },
    { raw: 'marketing copy', expectedTokens: ['行銷', '文案'], minMatches: 10, canonicalId: 'UC-268' },
    { raw: '社群排程', expectedTokens: ['社群', '排程'], minMatches: 50, canonicalId: 'UC-006' },
    { raw: '社群發文', expectedTokens: ['社群', '發文'], minMatches: 50, canonicalId: 'UC-006' },
    { raw: '效能分析', expectedTokens: ['效能'], minMatches: 15, canonicalId: 'UC-173' },
    { raw: '性能分析', expectedTokens: ['效能'], minMatches: 15, canonicalId: 'UC-173' },
    { raw: 'performance analysis', expectedTokens: ['效能'], minMatches: 15, canonicalId: 'UC-173' },
    { raw: '前端效能', expectedTokens: ['效能'], minMatches: 15, canonicalId: 'UC-173' },
    { raw: '報帳審核', expectedTokens: ['報帳', '審核'], minMatches: 30, canonicalId: 'UC-225' },
    { raw: '審核報帳', expectedTokens: ['報帳', '審核'], minMatches: 30, canonicalId: 'UC-225' },
    { raw: '費用審查', expectedTokens: ['費用', '審核'], minMatches: 50, canonicalId: 'UC-225' },
    { raw: '簡報製作', expectedTokens: ['簡報'], minMatches: 40, canonicalId: 'UC-019' },
    { raw: '投影片大綱', expectedTokens: ['簡報'], minMatches: 40, canonicalId: 'UC-019' },
    { raw: 'PPT製作', expectedTokens: ['簡報'], minMatches: 40, canonicalId: 'UC-019' }
  ];

  for (const item of queries) {
    const tokens = Array.from(api.tokenize(item.raw));
    assert.deepEqual(tokens, item.expectedTokens, `Tokens for "${item.raw}" must match expected`);
    const hits = api.filterEntries(entries, tokens, {});
    assert.ok(
      hits.length >= item.minMatches,
      `Query "${item.raw}" must return >= ${item.minMatches} cases, got ${hits.length}`
    );
    assert.ok(
      hits.some(e => e.id === item.canonicalId),
      `Query "${item.raw}" must recall canonical case ${item.canonicalId}`
    );
  }
});

test('hero problem tags and empty state suggestions expose 行銷文案, 效能分析, 報帳審核, and 簡報製作', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = html.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav.includes('href="?q=行銷文案#explore"'), 'hero-problem-tags must include 行銷文案');
  assert.ok(nav.includes('href="?q=效能分析#explore"'), 'hero-problem-tags must include 效能分析');
  assert.ok(nav.includes('href="?q=報帳審核#explore"'), 'hero-problem-tags must include 報帳審核');
  assert.ok(nav.includes('href="?q=簡報製作#explore"'), 'hero-problem-tags must include 簡報製作');
  assert.ok(nav.includes('href="?q=社群排程#explore"'), 'hero-problem-tags must include 社群排程');

  const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(appJs, /term:\s*['"]行銷文案['"]/, 'app.js empty state problem tags must include 行銷文案');
  assert.match(appJs, /term:\s*['"]效能分析['"]/, 'app.js empty state problem tags must include 效能分析');
  assert.match(appJs, /term:\s*['"]報帳審核['"]/, 'app.js empty state problem tags must include 報帳審核');
  assert.match(appJs, /term:\s*['"]簡報製作['"]/, 'app.js empty state problem tags must include 簡報製作');
  assert.match(appJs, /term:\s*['"]社群排程['"]/, 'app.js empty state problem tags must include 社群排程');
});

test('Reviewer regressions: marketing copy English phrase, performance analysis decoupling, and approval compound boundaries', () => {
  // Finding 1: marketing copy must tokenize to [行銷, 文案] and recall UC-268
  const mktTokens = Array.from(api.tokenize('marketing copy'));
  assert.deepEqual(mktTokens, ['行銷', '文案'], 'marketing copy must tokenize to [行銷, 文案]');
  const mktHits = api.filterEntries(entries, mktTokens, {});
  assert.ok(mktHits.some(e => e.id === 'UC-268'), 'marketing copy must recall UC-268');

  // Finding 2: 效能分析 must not be collapsed into code refactoring and must rank UC-173 at top
  const perfTokens = Array.from(api.tokenize('效能分析'));
  assert.deepEqual(perfTokens, ['效能'], '效能分析 must tokenize to [效能]');
  const perfHits = api.filterEntries(entries, perfTokens, {});
  assert.ok(perfHits.some(e => e.id === 'UC-173'), '效能分析 must recall UC-173');
  const perfRanked = api.rankEntries(perfHits, perfTokens);
  assert.equal(perfRanked[0]?.id, 'UC-173', 'UC-173 must be top hit for 效能分析');

  // Finding 3: 報帳審核 must not leave stray fragments and must recall UC-225
  const expReviewTokens = Array.from(api.tokenize('報帳審核'));
  assert.deepEqual(expReviewTokens, ['報帳', '審核'], '報帳審核 must tokenize to [報帳, 審核]');
  const expHits = api.filterEntries(entries, expReviewTokens, {});
  assert.ok(expHits.some(e => e.id === 'UC-225'), '報帳審核 must recall UC-225');

  // Finding 4: global 文案 synonym must not include generic 'copy' to prevent matching Spectroscopy (UC-012) or file links (UC-374)
  const pureCopyTokens = Array.from(api.tokenize('文案'));
  const pureCopyHits = api.filterEntries(entries, pureCopyTokens, {});
  assert.ok(!pureCopyHits.some(e => e.id === 'UC-012'), 'Searching 文案 must not match UC-012 Spectroscopy');
  assert.ok(!pureCopyHits.some(e => e.id === 'UC-374'), 'Searching 文案 must not match UC-374 completed-copy-handoff.md');
});

test('natural problem queries for project progress, data analytics, audio transcription, meeting records, and market research recall targeted cases', () => {
  const queries = [
    { raw: '專案進度', expectedTokens: ['專案', '進度'], minMatches: 15, canonicalId: 'UC-408' },
    { raw: '我想管理專案進度', expectedTokens: ['專案', '進度'], minMatches: 15, canonicalId: 'UC-408' },
    { raw: '追蹤專案進度', expectedTokens: ['專案', '進度'], minMatches: 15, canonicalId: 'UC-408' },
    { raw: '專案管理', expectedTokens: ['專案', '管理'], minMatches: 20, canonicalId: 'UC-379' },
    { raw: '音訊轉寫', expectedTokens: ['逐字稿'], minMatches: 50, canonicalId: 'UC-132' },
    { raw: '錄音轉逐字稿', expectedTokens: ['逐字稿'], minMatches: 50, canonicalId: 'UC-412' },
    { raw: '錄音整理', expectedTokens: ['逐字稿'], minMatches: 50, canonicalId: 'UC-480' },
    { raw: '數據分析', expectedTokens: ['數據', '分析'], minMatches: 30, canonicalId: 'UC-459' },
    { raw: '做數據分析', expectedTokens: ['數據', '分析'], minMatches: 30, canonicalId: 'UC-095' },
    { raw: '報表分析', expectedTokens: ['數據', '分析'], minMatches: 30, canonicalId: 'UC-459' },
    { raw: '開會記錄', expectedTokens: ['會議', '筆記'], minMatches: 8, canonicalId: 'UC-094' },
    { raw: '我想整理開會記錄', expectedTokens: ['整理', '會議', '筆記'], minMatches: 6, canonicalId: 'UC-071' },
    { raw: '市場調研', expectedTokens: ['市場', '調研'], minMatches: 6, canonicalId: 'UC-090' },
    { raw: '市場分析', expectedTokens: ['市場', '調研'], minMatches: 6, canonicalId: 'UC-438' }
  ];

  for (const item of queries) {
    const tokens = Array.from(api.tokenize(item.raw));
    assert.deepEqual(tokens, item.expectedTokens, `Tokens for "${item.raw}" must match expected`);
    const hits = api.filterEntries(entries, tokens, {});
    assert.ok(
      hits.length >= item.minMatches,
      `Query "${item.raw}" must return >= ${item.minMatches} cases, got ${hits.length}`
    );
    assert.ok(
      hits.some(e => e.id === item.canonicalId),
      `Query "${item.raw}" must recall canonical case ${item.canonicalId}`
    );
  }
});

test('hero problem tags and empty state suggestions expose 專案進度, 數據分析, 音訊轉寫, and 市場調研', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = html.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav.includes('href="?q=專案進度#explore"'), 'hero-problem-tags must include 專案進度');
  assert.ok(nav.includes('href="?q=數據分析#explore"'), 'hero-problem-tags must include 數據分析');
  assert.ok(nav.includes('href="?q=音訊轉寫#explore"'), 'hero-problem-tags must include 音訊轉寫');
  assert.ok(nav.includes('href="?q=市場調研#explore"'), 'hero-problem-tags must include 市場調研');

  const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(appJs, /term:\s*['"]專案進度['"]/, 'app.js empty state problem tags must include 專案進度');
  assert.match(appJs, /term:\s*['"]數據分析['"]/, 'app.js empty state problem tags must include 數據分析');
  assert.match(appJs, /term:\s*['"]音訊轉寫['"]/, 'app.js empty state problem tags must include 音訊轉寫');
  assert.match(appJs, /term:\s*['"]市場調研['"]/, 'app.js empty state problem tags must include 市場調研');
});

test('Reviewer regressions: project progress compounds, data analysis preservation, and audio transcription phrase boundaries', () => {
  // Finding 1: 專案進度 must segment to [專案, 進度] and rank UC-408 in top 5
  const projTokens = Array.from(api.tokenize('專案進度'));
  assert.deepEqual(projTokens, ['專案', '進度'], '專案進度 must tokenize to [專案, 進度]');
  const projHits = api.filterEntries(entries, projTokens, {});
  const projRanked = api.rankEntries(projHits, projTokens);
  assert.ok(projRanked.slice(0, 5).some(e => e.id === 'UC-408'), '專案進度 must rank UC-408 in top 5');

  // Finding 2: 音訊轉寫 must map to [逐字稿] and recall UC-132
  const audioTokens = Array.from(api.tokenize('音訊轉寫'));
  assert.deepEqual(audioTokens, ['逐字稿'], '音訊轉寫 must tokenize to [逐字稿]');
  const audioHits = api.filterEntries(entries, audioTokens, {});
  assert.ok(audioHits.some(e => e.id === 'UC-132'), '音訊轉寫 must recall UC-132');

  // Finding 3: 開會記錄 without counter quantifier must tokenize to [會議, 筆記] and recall UC-094
  const meetingTokens = Array.from(api.tokenize('開會記錄'));
  assert.deepEqual(meetingTokens, ['會議', '筆記'], '開會記錄 must tokenize to [會議, 筆記]');
  const meetingHits = api.filterEntries(entries, meetingTokens, {});
  assert.ok(meetingHits.some(e => e.id === 'UC-094'), '開會記錄 must recall UC-094');

  // Finding 4: 數據分析 must segment to [數據, 分析] and recall UC-459
  const dataTokens = Array.from(api.tokenize('數據分析'));
  assert.deepEqual(dataTokens, ['數據', '分析'], '數據分析 must tokenize to [數據, 分析]');
  const dataHits = api.filterEntries(entries, dataTokens, {});
  assert.ok(dataHits.some(e => e.id === 'UC-459'), '數據分析 must recall UC-459');

  // Finding 5: 統計分析 & 資料分析 must preserve their respective nouns and recall UC-200 and UC-259
  const statTokens = Array.from(api.tokenize('統計分析'));
  assert.deepEqual(statTokens, ['統計', '分析'], '統計分析 must tokenize to [統計, 分析]');
  const statHits = api.filterEntries(entries, statTokens, {});
  assert.ok(statHits.some(e => e.id === 'UC-200'), '統計分析 must recall UC-200');

  const dataNounTokens = Array.from(api.tokenize('資料分析'));
  assert.deepEqual(dataNounTokens, ['資料', '分析'], '資料分析 must tokenize to [資料, 分析]');
  const dataNounHits = api.filterEntries(entries, dataNounTokens, {});
  assert.ok(dataNounHits.some(e => e.id === 'UC-259'), '資料分析 must recall UC-259');

  // Finding 6: Generic 進度追蹤 must not forcibly inject 專案 and must recall UC-425
  const genericProgressTokens = Array.from(api.tokenize('進度追蹤'));
  assert.ok(!genericProgressTokens.includes('專案'), 'Generic 進度追蹤 must not inject 專案');
  const progressHits = api.filterEntries(entries, genericProgressTokens, {});
  assert.ok(progressHits.some(e => e.id === 'UC-425'), '進度追蹤 must recall UC-425');

  // Finding 7: 漏轉寫欄位 must not map to 逐字稿 without audio context and must recall UC-145
  const transcribeColTokens = Array.from(api.tokenize('漏轉寫欄位'));
  assert.ok(!transcribeColTokens.includes('逐字稿'), '漏轉寫欄位 must not be rewritten to 逐字稿');
  const transcribeColHits = api.filterEntries(entries, transcribeColTokens, {});
  assert.ok(transcribeColHits.some(e => e.id === 'UC-145'), '漏轉寫欄位 must recall UC-145');

  // Finding 8: 專案狀態機 must protect 狀態機 and not collapse to 進度, recalling UC-453
  const statemachineTokens = Array.from(api.tokenize('專案狀態機'));
  assert.ok(!statemachineTokens.includes('進度'), '專案狀態機 must not collapse to 進度');
  const statemachineHits = api.filterEntries(entries, statemachineTokens, {});
  assert.ok(statemachineHits.some(e => e.id === 'UC-453'), '專案狀態機 must recall UC-453');
});

test('natural problem queries for product research, paper study, reading notes, language learning, security audit, privacy review, cost analysis, vendor assessment, and hiring screening recall targeted cases', () => {
  const queries = [
    { raw: '產品調研', expectedTokens: ['產品', '調研'], minMatches: 50, canonicalId: 'UC-011' },
    { raw: '做產品調研', expectedTokens: ['產品', '調研'], minMatches: 50, canonicalId: 'UC-011' },
    { raw: '產品研究', expectedTokens: ['產品', '調研'], minMatches: 50, canonicalId: 'UC-039' },
    { raw: '論文研讀', expectedTokens: ['論文'], minMatches: 10, canonicalId: 'UC-012' },
    { raw: '研讀論文', expectedTokens: ['論文'], minMatches: 10, canonicalId: 'UC-012' },
    { raw: '精讀文獻', expectedTokens: ['論文'], minMatches: 10, canonicalId: 'UC-012' },
    { raw: '讀書筆記', expectedTokens: ['閱讀', '筆記'], minMatches: 8, canonicalId: 'UC-030' },
    { raw: '做讀書筆記', expectedTokens: ['閱讀', '筆記'], minMatches: 8, canonicalId: 'UC-352' },
    { raw: '整理讀書筆記', expectedTokens: ['閱讀', '筆記'], minMatches: 8, canonicalId: 'UC-352' },
    { raw: '英語學習', expectedTokens: ['英語', '學習'], minMatches: 20, canonicalId: 'UC-030' },
    { raw: '英文學習', expectedTokens: ['英語', '學習'], minMatches: 20, canonicalId: 'UC-460' },
    { raw: '學英語', expectedTokens: ['英語', '學習'], minMatches: 20, canonicalId: 'UC-030' },
    { raw: '漏洞掃描', expectedTokens: ['資安', '漏洞'], minMatches: 50, canonicalId: 'UC-407' },
    { raw: '弱點掃描', expectedTokens: ['資安', '漏洞'], minMatches: 50, canonicalId: 'UC-407' },
    { raw: '掃描漏洞', expectedTokens: ['資安', '漏洞'], minMatches: 50, canonicalId: 'UC-407' },
    { raw: '隱私審查', expectedTokens: ['隱私', '審查'], minMatches: 20, canonicalId: 'UC-184' },
    { raw: '隱私檢查', expectedTokens: ['隱私', '審查'], minMatches: 20, canonicalId: 'UC-391' },
    { raw: '個資審查', expectedTokens: ['隱私', '審查'], minMatches: 20, canonicalId: 'UC-184' },
    { raw: '成本分析', expectedTokens: ['成本', '分析'], minMatches: 150, canonicalId: 'UC-066' },
    { raw: '分析成本', expectedTokens: ['成本', '分析'], minMatches: 150, canonicalId: 'UC-400' },
    { raw: '雲端成本分析', expectedTokens: ['成本', '分析'], minMatches: 150, canonicalId: 'UC-066' },
    { raw: '供應商評估', expectedTokens: ['供應商', '評估'], minMatches: 10, canonicalId: 'UC-101' },
    { raw: '評估供應商', expectedTokens: ['供應商', '評估'], minMatches: 10, canonicalId: 'UC-101' },
    { raw: '廠商評估', expectedTokens: ['供應商', '評估'], minMatches: 10, canonicalId: 'UC-101' },
    { raw: '招募審查', expectedTokens: ['招募', '審查'], minMatches: 10, canonicalId: 'UC-152' },
    { raw: '審查招募', expectedTokens: ['招募', '審查'], minMatches: 10, canonicalId: 'UC-152' },
    { raw: '招募初篩', expectedTokens: ['招募', '審查'], minMatches: 10, canonicalId: 'UC-152' }
  ];

  for (const item of queries) {
    const tokens = Array.from(api.tokenize(item.raw));
    assert.deepEqual(tokens, item.expectedTokens, `Tokens for "${item.raw}" must match expected`);
    const hits = api.filterEntries(entries, tokens, {});
    assert.ok(
      hits.length >= item.minMatches,
      `Query "${item.raw}" must return >= ${item.minMatches} cases, got ${hits.length}`
    );
    assert.ok(
      hits.some(e => e.id === item.canonicalId),
      `Query "${item.raw}" must recall canonical case ${item.canonicalId}`
    );
  }
});

test('hero problem tags and empty state suggestions expose 產品調研, 讀書筆記, 英語學習, 漏洞掃描, 隱私審查, 成本分析, 供應商評估, and 招募審查', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nav = html.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(nav.includes('href="?q=產品調研#explore"'), 'hero-problem-tags must include 產品調研');
  assert.ok(nav.includes('href="?q=讀書筆記#explore"'), 'hero-problem-tags must include 讀書筆記');
  assert.ok(nav.includes('href="?q=英語學習#explore"'), 'hero-problem-tags must include 英語學習');
  assert.ok(nav.includes('href="?q=漏洞掃描#explore"'), 'hero-problem-tags must include 漏洞掃描');
  assert.ok(nav.includes('href="?q=隱私審查#explore"'), 'hero-problem-tags must include 隱私審查');
  assert.ok(nav.includes('href="?q=成本分析#explore"'), 'hero-problem-tags must include 成本分析');
  assert.ok(nav.includes('href="?q=供應商評估#explore"'), 'hero-problem-tags must include 供應商評估');
  assert.ok(nav.includes('href="?q=招募審查#explore"'), 'hero-problem-tags must include 招募審查');

  const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(appJs, /term:\s*['"]產品調研['"]/, 'app.js empty state problem tags must include 產品調研');
  assert.match(appJs, /term:\s*['"]讀書筆記['"]/, 'app.js empty state problem tags must include 讀書筆記');
  assert.match(appJs, /term:\s*['"]英語學習['"]/, 'app.js empty state problem tags must include 英語學習');
  assert.match(appJs, /term:\s*['"]漏洞掃描['"]/, 'app.js empty state problem tags must include 漏洞掃描');
  assert.match(appJs, /term:\s*['"]隱私審查['"]/, 'app.js empty state problem tags must include 隱私審查');
  assert.match(appJs, /term:\s*['"]成本分析['"]/, 'app.js empty state problem tags must include 成本分析');
  assert.match(appJs, /term:\s*['"]供應商評估['"]/, 'app.js empty state problem tags must include 供應商評估');
  assert.match(appJs, /term:\s*['"]招募審查['"]/, 'app.js empty state problem tags must include 招募審查');
});

test('Reviewer regressions: product research boundaries, literature study synonyms, reading note segmentation, language learning preservation, vulnerability scanning to security watch, privacy review recall, cost analysis decoupling, vendor assessment preservation, and recruitment review audit', () => {
  // Finding 1: 產品調研 must segment to [產品, 調研] and rank UC-011 in top 5
  const prodTokens = Array.from(api.tokenize('產品調研'));
  assert.deepEqual(prodTokens, ['產品', '調研'], '產品調研 must tokenize to [產品, 調研]');
  const prodHits = api.filterEntries(entries, prodTokens, {});
  const prodRanked = api.rankEntries(prodHits, prodTokens);
  assert.ok(prodRanked.slice(0, 5).some(e => e.id === 'UC-011'), '產品調研 must rank UC-011 in top 5');

  // Finding 2: 論文研讀 must map to [論文] and recall UC-012
  const paperTokens = Array.from(api.tokenize('論文研讀'));
  assert.deepEqual(paperTokens, ['論文'], '論文研讀 must tokenize to [論文]');
  const paperHits = api.filterEntries(entries, paperTokens, {});
  assert.ok(paperHits.some(e => e.id === 'UC-012'), '論文研讀 must recall UC-012');

  // Finding 3: 讀書筆記 must segment to [閱讀, 筆記] and recall UC-030 and UC-352
  const bookTokens = Array.from(api.tokenize('讀書筆記'));
  assert.deepEqual(bookTokens, ['閱讀', '筆記'], '讀書筆記 must tokenize to [閱讀, 筆記]');
  const bookHits = api.filterEntries(entries, bookTokens, {});
  assert.ok(bookHits.some(e => e.id === 'UC-030'), '讀書筆記 must recall UC-030');
  assert.ok(bookHits.some(e => e.id === 'UC-352'), '讀書筆記 must recall UC-352');

  // Finding 4: 英語學習 must segment to [英語, 學習] and recall UC-030 and UC-460
  const engTokens = Array.from(api.tokenize('英語學習'));
  assert.deepEqual(engTokens, ['英語', '學習'], '英語學習 must tokenize to [英語, 學習]');
  const engHits = api.filterEntries(entries, engTokens, {});
  assert.ok(engHits.some(e => e.id === 'UC-030'), '英語學習 must recall UC-030');
  assert.ok(engHits.some(e => e.id === 'UC-460'), '英語學習 must recall UC-460');

  // Finding 5: 漏洞掃描 must map to [資安, 漏洞] and rank UC-407 at #1
  const vulnTokens = Array.from(api.tokenize('漏洞掃描'));
  assert.deepEqual(vulnTokens, ['資安', '漏洞'], '漏洞掃描 must tokenize to [資安, 漏洞]');
  const vulnHits = api.filterEntries(entries, vulnTokens, {});
  const vulnRanked = api.rankEntries(vulnHits, vulnTokens);
  assert.equal(vulnRanked[0]?.id, 'UC-407', 'UC-407 must rank #1 for 漏洞掃描');

  // Finding 6: 隱私審查 must segment to [隱私, 審查] and recall UC-184 and UC-391
  const privTokens = Array.from(api.tokenize('隱私審查'));
  assert.deepEqual(privTokens, ['隱私', '審查'], '隱私審查 must tokenize to [隱私, 審查]');
  const privHits = api.filterEntries(entries, privTokens, {});
  assert.ok(privHits.some(e => e.id === 'UC-184'), '隱私審查 must recall UC-184');
  assert.ok(privHits.some(e => e.id === 'UC-391'), '隱私審查 must recall UC-391');

  // Finding 7: 成本分析 must segment to [成本, 分析] and recall UC-066 and UC-400
  const costTokens = Array.from(api.tokenize('成本分析'));
  assert.deepEqual(costTokens, ['成本', '分析'], '成本分析 must tokenize to [成本, 分析]');
  const costHits = api.filterEntries(entries, costTokens, {});
  assert.ok(costHits.some(e => e.id === 'UC-066'), '成本分析 must recall UC-066');
  assert.ok(costHits.some(e => e.id === 'UC-400'), '成本分析 must recall UC-400');

  // Finding 8: 供應商評估 must segment to [供應商, 評估] and recall UC-101
  const vendorTokens = Array.from(api.tokenize('供應商評估'));
  assert.deepEqual(vendorTokens, ['供應商', '評估'], '供應商評估 must tokenize to [供應商, 評估]');
  const vendorHits = api.filterEntries(entries, vendorTokens, {});
  assert.ok(vendorHits.some(e => e.id === 'UC-101'), '供應商評估 must recall UC-101');

  // Finding 9: 招募審查 must segment to [招募, 審查] and rank UC-152 at #1
  const recruitTokens = Array.from(api.tokenize('招募審查'));
  assert.deepEqual(recruitTokens, ['招募', '審查'], '招募審查 must tokenize to [招募, 審查]');
  const recruitHits = api.filterEntries(entries, recruitTokens, {});
  const recruitRanked = api.rankEntries(recruitHits, recruitTokens);
  assert.equal(recruitRanked[0]?.id, 'UC-152', 'UC-152 must rank #1 for 招募審查');

  // Finding 10: 雲端費用 must not force 分析 and must recall UC-450 and UC-052
  const cloudFeeTokens = Array.from(api.tokenize('雲端費用'));
  assert.deepEqual(cloudFeeTokens, ['雲端費用'], '雲端費用 must preserve standalone noun without adding 分析');
  const cloudFeeHits = api.filterEntries(entries, cloudFeeTokens, {});
  assert.ok(cloudFeeHits.some(e => e.id === 'UC-450'), '雲端費用 must recall UC-450');
  assert.ok(cloudFeeHits.some(e => e.id === 'UC-052'), '雲端費用 must recall UC-052');

  // Finding 11: 數學 英文 must not truncate 數學 and must recall UC-354
  const mathTokens = Array.from(api.tokenize('數學 英文'));
  assert.deepEqual(mathTokens, ['數學', '英文'], '數學 英文 must not truncate 數學 into 數 英語 學習');
  const mathHits = api.filterEntries(entries, mathTokens, {});
  assert.ok(mathHits.some(e => e.id === 'UC-354'), '數學 英文 must recall UC-354');

  // Finding 12: 商品 研究 must preserve 商品 noun and recall UC-037 and UC-326
  const prodNounTokens = Array.from(api.tokenize('商品 研究'));
  assert.deepEqual(prodNounTokens, ['商品', '調研'], '商品 研究 must preserve 商品 noun');
  const prodNounHits = api.filterEntries(entries, prodNounTokens, {});
  assert.ok(prodNounHits.some(e => e.id === 'UC-037'), '商品 研究 must recall UC-037');
  assert.ok(prodNounHits.some(e => e.id === 'UC-326'), '商品 研究 must recall UC-326');

  // Finding 13: 閱讀摘要 must remain distinct from note-taking and rank UC-356 at top
  const readSumTokens = Array.from(api.tokenize('閱讀摘要'));
  assert.deepEqual(readSumTokens, ['閱讀摘要'], '閱讀摘要 must remain summary intent rather than note-taking');
  const readSumHits = api.filterEntries(entries, readSumTokens, {});
  const readSumRanked = api.rankEntries(readSumHits, readSumTokens);
  assert.equal(readSumRanked[0]?.id, 'UC-356', '閱讀摘要 must rank UC-356 at top');
  const spacedReadTokens = Array.from(api.tokenize('閱讀 摘要'));
  const spacedReadHits = api.filterEntries(entries, spacedReadTokens, {});
  assert.ok(spacedReadHits.some(e => e.id === 'UC-493'), '閱讀 摘要 must recall UC-493');
});
