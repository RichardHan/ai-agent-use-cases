'use strict';
// Latin synonyms used to match as raw substrings, so `客服` matched every case
// whose footnote linked to `support.google.com`, `權限` matched every case whose
// source line said `author`, `CI` matched `specific`, and `推特` matched any word
// containing the letter x. A reader searching a task got a list of unrelated
// cases and the count told them the library covered far more than it does.
//
// Two rules now decide an English synonym: it must stand as a word (Chinese
// neighbours, digits, punctuation and hyphens are boundaries), and a synonym the
// reader did not type must not match inside a source URL. Words the reader did
// type keep matching everything, URLs included, because a pasted domain is an
// intentional query.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8')
  .split('/* Browser event bindings. */')[0];

function setupEnvironment() {
  function createElement(tag, className = '', textContent = '') {
    const el = {
      tagName: tag.toUpperCase(),
      className,
      textContent,
      children: [],
      dataset: {},
      attributes: {},
      style: {},
      open: false,
      value: '',
      listeners: {},
      get lastChild() { return this.children[this.children.length - 1]; },
      append(...nodes) {
        for (const n of nodes) {
          this.children.push(typeof n === 'string' ? { tagName: '#text', textContent: n } : n);
        }
      },
      replaceChildren(...nodes) { this.children = []; this.append(...nodes); },
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] ?? null; },
      addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      closest() { return null; },
      focus() {},
      click() {},
      remove() {},
      scrollIntoView() {},
      getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; },
      cloneNode() { return createElement(tag, className, textContent); }
    };
    return el;
  }
  const documentMock = {
    getElementById() { return createElement('div'); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement: (tag, className, textContent) => createElement(tag, className, textContent),
    createTextNode: text => createElement('#text', '', text),
    addEventListener() {},
    body: createElement('body'),
    documentElement: createElement('html'),
    activeElement: null
  };
  const context = vm.createContext({
    document: documentMock,
    window: { document: documentMock },
    console,
    URL,
    URLSearchParams,
    crypto: { randomUUID: () => 'search-precision-test' },
    location: { href: 'https://example.test/ai-agent-use-cases/' },
    history: { state: null, pushState() {}, replaceState() {}, length: 1 },
    Discovery: require('../assets/discovery.js'),
    displayCopy: JSON.parse(fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8')),
    activeScenario: '',
    setTimeout,
    clearTimeout,
    navigator: {},
    fetch: () => {}
  });
  vm.runInContext(appSource + '\nthis.api = { metadata, parseFile, filterEntries, rankEntries, tokenize, termVariants, matchesSearchVariant, searchContext, SYNONYM_GROUPS };', context);
  return context.api;
}

const api = setupEnvironment();

function fixture(id, heading, body) {
  const markdown = `# ${id}：${heading}\n\n- 核心目標：${heading}。\n- 情境：工作\n\n## 方法\n\n${body}`;
  const items = api.parseFile(`cases/${id.toLowerCase().replace(/[^a-z0-9]/g, '')}-fixture.md`, markdown);
  assert.equal(items.length, 1, `${id} fixture must parse to one case`);
  return items[0];
}

function matches(item, query) {
  return api.filterEntries([item], Array.from(api.tokenize(query)), {}).length === 1;
}

function corpusItems() {
  const dir = path.join(root, 'cases');
  return fs.readdirSync(dir)
    .filter(name => name.endsWith('.md'))
    .sort()
    .map(name => api.metadata(fs.readFileSync(path.join(dir, name), 'utf8'), `cases/${name}`, 'case'))
    .filter(Boolean);
}

test('a vendor support URL is not a customer-service case', () => {
  const urlOnly = fixture('UC-901', '整理影音庫', '照著[官方說明](https://support.google.com/youtube/answer/1)把播放清單分類。');
  assert.equal(matches(urlOnly, '客服'), false,
    'a case whose only support hit is support.google.com must not answer 客服');
  const realSupport = fixture('UC-902', '客服信先分類', '先讓 AI 把客服信分成退款與技術問題，再交人回覆。');
  assert.equal(matches(realSupport, '客服'), true, 'a case that says 客服 must answer 客服');
  const ticketOnly = fixture('UC-903', '表單批次設定', '把票券批次設定逐項核對，[說明](https://support.zendesk.com/hc/1)只讀介面。');
  assert.equal(matches(ticketOnly, '客服'), false, 'a zendesk help-centre link alone is not customer service');
});

test('a reader who types the English word still matches its URL', () => {
  const urlOnly = fixture('UC-904', '整理影音庫', '照著[官方說明](https://support.google.com/youtube/answer/1)把播放清單分類。');
  assert.equal(matches(urlOnly, 'support'), true,
    'the reader typed support, so its own URL still counts');
});

test('權限 does not match the word author', () => {
  const authorLine = fixture('UC-905', '整理保單', '- 作者：Jane Doe（the author）\n\n保單條款比對後列出需要本人確認的差異，原文有一段 author note。');
  assert.equal(matches(authorLine, '權限'), false, 'author is not a permission');
  const authorization = fixture('UC-906', '授權範圍', '把 OAuth authorization 的授權範圍逐項列出來，只給必要權限。');
  assert.equal(matches(authorization, '權限'), true, 'authorization/權限 must still answer 權限');
});

test('CI/CD does not match specific or decision', () => {
  const words = fixture('UC-907', '發布檢查', '每次 decision 後跑一次 specific 清單，確認設定一致。');
  assert.equal(matches(words, 'CI'), false, 'specific/decision contain ci but are not CI');
  const ciCase = fixture('UC-908', '持續整合', '用 CI 跑測試，綠燈才發布。');
  assert.equal(matches(ciCase, 'CI'), true, 'a standalone CI must answer CI');
});

test('推特 does not match every word containing x', () => {
  const words = fixture('UC-909', '文字整理', '把 text 與 example 欄位整理成清單，檢查 context。');
  assert.equal(matches(words, '推特'), false, 'text/example/context contain x but are not Twitter');
  const platform = fixture('UC-910', '社群貼文排程', '把排程貼到 X 上，隔天再看互動。');
  assert.equal(matches(platform, '推特'), true, 'a standalone X is the platform');
  const sourceLink = fixture('UC-911', '整理名單', '原始的[貼文](https://x.com/someone/status/1)附了截圖。');
  assert.equal(matches(sourceLink, '推特'), false,
    'a source post link alone does not make the case about Twitter');
});

test('電動車, 儲存庫, 日誌, 筆記 and 測試 ignore longer words that merely contain their synonym', () => {
  const everyEvent = fixture('UC-912', '活動整理', 'every event 與 level 都記下來，方便事後比對。');
  assert.equal(matches(everyEvent, '電動車'), false, 'every/event/level contain ev but are not an EV');
  assert.equal(matches(fixture('UC-913', '充電排程', '把 EV 的充電排程設在離峰時段。'), '電動車'), true, 'a standalone EV must match');

  const report = fixture('UC-914', '月報彙整', '把每月 report 併成一頁，附上來源。');
  assert.equal(matches(report, '儲存庫'), false, 'report contains repo but is not a repository');
  assert.equal(matches(fixture('UC-915', '版本整理', '把 repo 的分支整理成清單。'), '儲存庫'), true, 'a standalone repo must match');

  const login = fixture('UC-916', '登入流程', 'login 失敗時先看密碼與兩步驗證。');
  assert.equal(matches(login, '日誌'), false, 'login contains log but is not a log');
  assert.equal(matches(fixture('UC-917', '錯誤排查', '把 log 依時間排序再對部署。'), '日誌'), true, 'a standalone log must match');

  const memory = fixture('UC-918', '對話記憶', '把 memory 分層，短期與長期分開。');
  assert.equal(matches(memory, '筆記'), false, 'memory contains memo but is not a note');
  assert.equal(matches(fixture('UC-919', '開會紀錄', '把 memo 貼進筆記本，會後分派。'), '筆記'), true, 'a standalone memo must match');

  const latest = fixture('UC-920', '版本公告', '看 latest 版本與變更說明。');
  assert.equal(matches(latest, '測試'), false, 'latest contains test but is not a test');
  assert.equal(matches(fixture('UC-921', '回歸檢查', 'test 跑完再合併。'), '測試'), true, 'a standalone test must match');
});

test('case ids, request abbreviations and Chinese neighbours keep matching', () => {
  const target = fixture('UC-922', '交付檢查', '合併前跑一次檢查。');
  assert.equal(matches(target, 'UC922'), true, 'unhyphenated id still matches');
  assert.equal(matches(target, 'UC-922'), true, 'hyphenated id still matches');
  const pr = fixture('UC-923', '合併請求', '把 PR149 的問題逐條回覆，privacy 段落不變。');
  assert.equal(matches(pr, 'PR149'), true, 'PR with a number still matches');
  assert.equal(matches(pr, 'PR'), true, 'PR as a word still matches');
  assert.equal(matches(pr, 'privacy'), true, 'the literal word privacy still matches');
  const chinese = fixture('UC-924', '日常工具', '用bot做每天的重複工作，先看輸出再決定。');
  assert.equal(matches(chinese, 'bot'), true, 'a latin synonym next to Chinese text is still a word');
});

test('every returned case matches at least one of the query variants as a word', () => {
  const items = corpusItems();
  assert.ok(items.length > 400, `corpus should load, got ${items.length}`);
  const probes = ['客服', '推特', 'CI', '儲存庫', '日誌', '筆記', '測試', '電動車', '搜尋', '發文', '權限'];
  const offenders = [];
  for (const query of probes) {
    const variants = Array.from(api.tokenize(query)).flatMap(term => Array.from(api.termVariants(term)));
    for (const item of api.filterEntries(items, Array.from(api.tokenize(query)), {})) {
      const prose = item.searchProse || '';
      if (!variants.some(variant => api.matchesSearchVariant(prose, variant))) {
        offenders.push(`${item.id}:${query}`);
      }
    }
  }
  assert.deepEqual(offenders.slice(0, 12), [],
    'a case must not answer a query only through a source URL or a longer English word');
});

test('every returned case for 客服 mentions customer service in its prose', () => {
  const items = corpusItems();
  const customerService = /客服|客訴|投訴|工單|(^|[^a-z0-9])(support|ticket|tickets|jira|zendesk)([^a-z0-9]|$)/i;
  const recovered = api.filterEntries(items, Array.from(api.tokenize('客服')), {});
  const offenders = recovered.filter(item => !customerService.test(item.searchProse || '')).map(item => item.id);
  assert.deepEqual(offenders, [], 'no case may answer 客服 from a vendor URL alone');
  assert.ok(recovered.length >= 45, `客服 must still recall the real support cases, got ${recovered.length}`);
});

test('author never becomes the reason a case answers 權限', () => {
  const items = corpusItems();
  const variants = Array.from(api.tokenize('權限')).flatMap(term => Array.from(api.termVariants(term)));
  const recovered = api.filterEntries(items, Array.from(api.tokenize('權限')), {});
  assert.ok(recovered.length > 0, '權限 must not lose every case');
  const bylineOnly = recovered
    .filter(item => !variants.some(variant => api.matchesSearchVariant(item.searchProse || '', variant)))
    .map(item => item.id);
  assert.deepEqual(bylineOnly, [], 'an English byline must not answer a permission question');
});

test('the explanation chip prefers prose evidence over a source URL', () => {
  // A case that mentions support.google.com above the sentence that really answers
  // 客服 must point the reader at that sentence, not at the vendor link.
  const item = fixture('UC-925', '整理信件', '');
  item.markdown = '# UC-925：整理信件\n\n## 來源\n\n[官方說明](https://support.google.com/youtube/answer/1)\n\n## 方法\n\n客服信先分成退款與技術問題。';
  const explained = api.searchContext(item, ['客服']).matches[0];
  assert.equal(explained.label, '原文 · 方法', 'the chip must name the prose line, not the source line');
  assert.match(explained.excerpt, /客服信先分成退款/, 'the excerpt must be the sentence that answers the query');
  // When the only evidence is the source URL, the chip still says so and marks it 來源.
  const urlOnly = fixture('UC-926', '影音整理', '');
  urlOnly.markdown = '# UC-926：影音整理\n\n## 來源\n\n[官方說明](https://support.google.com/youtube/answer/1)';
  const fallback = api.searchContext(urlOnly, ['客服']).matches[0];
  assert.equal(fallback.label, '原文 · 來源');
  assert.equal(fallback.caution, '來源');
});

test('source-link removal covers the shapes that appear in the corpus', () => {
  // Reported by the independent review: a scheme-less host, a Markdown title and a
  // balanced-parenthesis destination all still leaked the synonym, while a raw URL
  // followed by Chinese prose swallowed the prose.
  const cases = [
    ['bare www host', '請看 www.support.google.com/help 的說明。'],
    ['markdown title', '[指南](https://support.google.com/x "支援") 之後說明。'],
    ['balanced parentheses', '[指南](https://example.test/a(b)/support) 之後說明。'],
    ['trailing path', '原貼在 https://x.com/someone/status/1 上。']
  ];
  for (const [name, body] of cases) {
    const item = fixture('UC-927', '整理資料', body);
    assert.equal(matches(item, '客服'), false, `${name}: a source link must not answer 客服`);
  }
  const proseAfterUrl = fixture('UC-928', '整理信件', '見 https://example.test/article，客服信先分成退款與技術問題。');
  assert.equal(matches(proseAfterUrl, '客服'), true, 'Chinese prose written right after a raw URL must stay searchable');
  assert.match(proseAfterUrl.searchProse, /客服信先分成退款/, 'the prose after a raw URL must survive URL removal');
});

test('the excerpt is taken from the sentence that matched, not from a link above it', () => {
  const item = fixture('UC-929', '整理信件', '');
  item.markdown = '# UC-929：整理信件\n\n## 方法\n\n[官方說明](https://support.google.com/x) 先看規格，support 這一步要人工確認。';
  const explained = api.searchContext(item, ['客服']).matches[0];
  assert.equal(explained.label, '原文 · 方法');
  assert.match(explained.excerpt, /這一步要人工確認/, 'the excerpt must centre on the phrase that matched');
  assert.doesNotMatch(explained.excerpt, /^\s*support\.google\.com/, 'the excerpt must not start inside the source URL');
});
