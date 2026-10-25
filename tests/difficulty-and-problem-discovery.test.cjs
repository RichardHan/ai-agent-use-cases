'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8')
  .split('/* Browser event bindings. */')[0];
const htmlSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cssSource = fs.readFileSync(path.join(root, 'assets/style.css'), 'utf8');

const readerCssSource = fs.readFileSync(path.join(root, 'assets/reader.css'), 'utf8');
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
      focus() { documentMock.activeElement = this; },
      showModal() { this.open = true; },
      click() { for (const listener of this.listeners.click || []) listener(); },
      append(...nodes) {
        for (const n of nodes) {
          if (typeof n === 'string' || typeof n === 'number') {
            this.children.push({ tagName: '#text', textContent: String(n) });
          } else if (n) {
            this.children.push(n);
          }
        }
      },
      replaceChildren(...nodes) {
        this.children = [];
        this.append(...nodes);
      },
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] ?? null; },
      addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
      querySelector(sel) {
        const find = node => {
          if (!node || !node.children) return null;
          for (const c of node.children) {
            if (sel.startsWith('.') && c.className && c.className.split(' ').includes(sel.slice(1))) return c;
            if (sel.startsWith('#') && c.attributes && c.attributes.id === sel.slice(1)) return c;
            if (c.tagName && c.tagName.toLowerCase() === sel.toLowerCase()) return c;
            const sub = find(c);
            if (sub) return sub;
          }
          return null;
        };
        return find(this);
      },
      querySelectorAll(sel) {
        const results = [];
        const find = node => {
          if (!node || !node.children) return;
          for (const c of node.children) {
            if (sel.startsWith('.') && c.className && c.className.split(' ').includes(sel.slice(1))) results.push(c);
            if (c.tagName && c.tagName.toLowerCase() === sel.toLowerCase()) results.push(c);
            find(c);
          }
        };
        find(this);
        return results;
      }
    };
    return el;
  }

  const elements = new Map();
  const documentMock = {
    createElement,
    createTextNode(t) { return { tagName: '#text', textContent: String(t) }; },
    getElementById(id) {
      if (!elements.has(id)) {
        const node = createElement('div', id);
        node.attributes.id = id;
        elements.set(id, node);
      }
      return elements.get(id);
    }
  };

  const context = vm.createContext({
    document: documentMock,
    window: { document: documentMock },
    console,
    URL,
    URLSearchParams,
    crypto: { randomUUID: () => 'discovery-test-visit' },
    location: { href: 'https://example.test/ai-agent-use-cases/' },
    history: { state: null, pushState() {}, replaceState() {} },
    Discovery: require('../assets/discovery.js'),
    displayCopy: JSON.parse(fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8')),
    activeScenario: ''
  });

  vm.runInContext(appSource + '\nthis.api = { metadata, parseFile, filterEntries, tokenize, card, extractDifficulty, DIFFICULTY_LABELS, FILTER_LABELS, chooseScenario, chooseDifficulty, showDetail, renderSearchFeedback };', context);
  return { ...context.api, context, document: documentMock };
}

test('difficulty options explain prerequisites without changing facet values', () => {
  const select = htmlSource.match(/<select\b[^>]*id="difficulty"[^>]*>([\s\S]*?)<\/select>/);
  assert.ok(select, 'index.html must have select#difficulty');
  assert.match(select[0], /name="difficulty"/);
  const options = [...select[1].matchAll(/<option value="([^"]*)">([^<]+)<\/option>/g)]
    .map(([, value, label]) => [value, label]);
  assert.deepEqual(options, [
    ['', '全部門檻（難易度）'],
    ['入門對話', '入門對話（免寫程式）'],
    ['工具串接', '工具串接（需帳號或外掛）'],
    ['進階開發', '進階開發（需本機環境或代碼）']
  ]);
});

test('hero scenario selection clears stale difficulty and other discovery facets', () => {
  const api = setupEnvironment(), calls = [];
  const ids = ['query', 'scenario', 'kind', 'difficulty', 'tool', 'category', 'proof'];
  ids.forEach(id => { api.document.getElementById(id).value = 'stale-' + id; });
  api.document.getElementById('sort').value = 'reviewed';
  api.context.render = () => calls.push('render');
  api.context.revealDiscovery = () => calls.push('reveal');
  api.chooseScenario('工作');
  ids.forEach(id => assert.equal(api.document.getElementById(id).value, '', id));
  assert.equal(vm.runInContext('activeScenario', api.context), '工作');
  assert.equal(api.document.getElementById('sort').value, 'reviewed', 'scenario entry retains the chosen sort');
  assert.deepEqual(calls, ['render', 'reveal']);
});

test('detail view renders qualified action cards within accessible guidance details', () => {
  const api = setupEnvironment();
  api.showDetail({
    id: 'UC-TEST', title: '整理郵件', what: '整理收件匣', kind: 'case', scenario: '工作',
    proof: '作者報告／示範', how: '先提供一封去識別化郵件。', caution: '寄出前由本人核對。',
    path: 'cases/test.md', markdown: '# 整理郵件\n\n## 來源\n作者自述。'
  }, null, false);
  const guidance = api.document.getElementById('detail-body').querySelector('.reader-guidance');
  assert.ok(guidance);
  assert.equal(guidance.tagName, 'DETAILS');
  assert.equal(guidance.open, false);
  assert.match(guidance.querySelector('summary').textContent, /非實測結果/);
  const cards = guidance.querySelectorAll('.guidance-card');
  assert.deepEqual(cards.map(card => card.querySelector('h2').textContent), ['🚀 怎麼開始', '⚠️ 要注意什麼']);
  assert.deepEqual(cards.map(card => card.querySelector('p').textContent), ['先提供一封去識別化郵件。', '寄出前由本人核對。']);
});

test('hero and search shortcuts expose the same high-intent pain points', () => {
  const hero = htmlSource.match(/<section class="discovery-hero"[\s\S]*?<\/section>/)[0];
  const chips = [...htmlSource.matchAll(/<button\b[^>]*class="chip chip-task"[^>]*data-query="([^"]+)"[^>]*>([^<]+)<\/button>/g)];
  for (const label of ['收件匣與郵件', '日報與會議', '自動客服', '代碼審查', '比價省錢', '旅遊規劃']) {
    assert.ok(hero.includes(label), 'hero shortcut: ' + label);
    assert.ok(chips.some(([, query, text]) => text.includes(label) && text.includes('搜尋「' + query + '」')), 'search shortcut: ' + label);
  }
});

test('empty recovery chips offer concrete pain points and apply their stated query', () => {
  const api = setupEnvironment(), calls = [];
  vm.runInContext('discoveryReady = true;', api.context);
  api.document.getElementById('query').value = 'unmatched-intent';
  api.document.getElementById('difficulty').value = '工具串接';
  api.context.render = () => calls.push('render');
  api.context.focusResults = () => calls.push('focus');
  api.renderSearchFeedback(['unmatched-intent'], { difficulty: '工具串接' });
  const chips = api.document.getElementById('empty-suggestions').querySelectorAll('.recovery-problem-tag');
  for (const [label, query] of [['郵件摘要', '郵件'], ['會議日報', '日報'], ['自動客服', '客服'], ['代碼審查', '代碼審查']]) {
    const chip = chips.find(chip => chip.textContent.startsWith(label));
    assert.ok(chip, label);
    assert.equal(chip.dataset.problemTag, query);
    assert.ok(chip.textContent.includes('搜尋「' + query + '」'));
    chip.click();
    assert.equal(api.document.getElementById('query').value, query);
    assert.equal(api.document.getElementById('difficulty').value, '工具串接', 'recovery preserves explicitly chosen facets');
  }
  assert.deepEqual(calls, Array(4).fill(['render', 'focus']).flat());
});

test('expanded discovery and guidance styles wrap within narrow containers with touch-sized controls', () => {
  for (const selector of ['.chip', '.recovery-problem-tag', '.hero-task-examples>a', '.problem-tag']) {
    const rule = cssSource.split(selector + '{')[1]?.split('}')[0];
    assert.ok(rule, selector);
    assert.match(rule, /min-height:44px/);
    assert.match(rule, /min-width:44px/);
    assert.match(rule, /max-width:100%/);
    assert.match(rule, /overflow-wrap:anywhere/);
  }
  assert.match(readerCssSource, /\.reader-guidance\[open\]\{[^}]*background:var\(--white\)/);
  assert.match(readerCssSource, /\.reader-guidance\{[^}]*max-width:100%;overflow-wrap:anywhere/);
  assert.match(readerCssSource, /\.guidance-card\{[^}]*min-width:0/);
  assert.match(readerCssSource, /@media\(max-width:640px\)\{\s*\.guidance-grid\{grid-template-columns:1fr\}/);
});

test('extractDifficulty correctly derives difficulty tiers based on facts', () => {
  const api = setupEnvironment();
  assert.equal(typeof api.extractDifficulty, 'function', 'extractDifficulty must be exported');

  // Case 1: Simple conversational prompt
  const uc001 = fs.readFileSync(path.join(root, 'cases/001-travel-checkout.md'), 'utf8');
  const meta001 = api.metadata(uc001, 'cases/001-travel-checkout.md', 'case');
  assert.equal(meta001.difficulty, '入門對話', 'UC-001 travel checkout should be 入門對話');

  // Case 2: Dev / CLI / Docker / Coding
  const uc005 = fs.readFileSync(path.join(root, 'cases/005-cloud-pr-review.md'), 'utf8');
  const meta005 = api.metadata(uc005, 'cases/005-cloud-pr-review.md', 'case');
  assert.equal(meta005.difficulty, '進階開發', 'UC-005 PR review should be 進階開發');

  // Case 3: API key / Webhook / Connector
  const uc014 = fs.readFileSync(path.join(root, 'cases/014-support-inbox-approval-refund.md'), 'utf8');
  const meta014 = api.metadata(uc014, 'cases/014-support-inbox-approval-refund.md', 'case');
  assert.equal(meta014.difficulty, '工具串接', 'UC-014 Stripe API refund should be 工具串接');
});

test('filterEntries supports difficulty facet filtering without breaking other facets', () => {
  const api = setupEnvironment();
  const cases = ['cases/001-travel-checkout.md', 'cases/005-cloud-pr-review.md', 'cases/014-support-inbox-approval-refund.md']
    .map(p => api.metadata(fs.readFileSync(path.join(root, p), 'utf8'), p, 'case'));

  const entryLevel = api.filterEntries(cases, [], { difficulty: '入門對話' });
  assert.equal(entryLevel.length, 1);
  assert.equal(entryLevel[0].id, 'UC-001');

  const devLevel = api.filterEntries(cases, [], { difficulty: '進階開發' });
  assert.equal(devLevel.length, 1);
  assert.equal(devLevel[0].id, 'UC-005');

  const connectorLevel = api.filterEntries(cases, [], { difficulty: '工具串接' });
  assert.equal(connectorLevel.length, 1);
  assert.equal(connectorLevel[0].id, 'UC-014');

  // Combined with scenario
  const devWithScenario = api.filterEntries(cases, [], { difficulty: '進階開發', scenario: '開發' });
  assert.equal(devWithScenario.length, 1);
  assert.equal(devWithScenario[0].id, 'UC-005');

  const devWithWrongScenario = api.filterEntries(cases, [], { difficulty: '進階開發', scenario: '生活' });
  assert.equal(devWithWrongScenario.length, 0);
});

test('card renders difficulty badge and problem context', () => {
  const api = setupEnvironment();
  const uc001 = fs.readFileSync(path.join(root, 'cases/001-travel-checkout.md'), 'utf8');
  const meta001 = api.metadata(uc001, 'cases/001-travel-checkout.md', 'case');
  const cardNode = api.card(meta001);

  const diffBadge = cardNode.querySelector('.card-difficulty');
  assert.ok(diffBadge, 'card must render .card-difficulty badge');
  assert.equal(diffBadge.textContent, '入門對話');
  assert.equal(diffBadge.dataset.difficulty, '入門對話');

  // Must have touch & visual styling in CSS
  assert.match(cssSource, /\.card-difficulty/, 'style.css must define .card-difficulty');
});

test('assets/app.js registers FILTER_LABELS.difficulty', () => {
  const api = setupEnvironment();
  assert.equal(api.FILTER_LABELS.difficulty, '實作門檻');
});
test('extractDifficulty correctly classifies MCP and declared connector tools', () => {
  const api = setupEnvironment();
  const uc020 = fs.readFileSync(path.join(root, 'cases/020-figma-batch-cards.md'), 'utf8');
  const meta020 = api.metadata(uc020, 'cases/020-figma-batch-cards.md', 'case');
  assert.equal(meta020.difficulty, '工具串接', 'UC-020 with Figma MCP should be 工具串接');
});

test('app.js includes difficulty in clearFacets and removeConditions', () => {
  const fullSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(fullSource, /function clearFacets\(\)[\s\S]*?difficulty/, 'clearFacets must include difficulty');
  assert.match(fullSource, /function removeConditions\(conditions\)[\s\S]*?difficulty/, 'removeConditions must include difficulty');
});

test('index.html provides direct hero difficulty options for first-time visitors', () => {
  const drawOptions = htmlSource.match(/id="draw-difficulty-options"[\s\S]*?<\/div>\s*<\/div>/);
  assert.ok(drawOptions, 'index.html must include #draw-difficulty-options');
  const buttons = [...drawOptions[0].matchAll(/data-difficulty="([^"]*)"/g)].map(m => m[1]);
  assert.deepEqual(buttons, ['', '入門對話', '工具串接', '進階開發']);
});

test('chooseDifficulty updates difficulty facet, triggers render, and reveals discovery', () => {
  const api = setupEnvironment(), calls = [];
  api.context.render = () => calls.push('render');
  api.context.revealDiscovery = () => calls.push('reveal');
  api.chooseDifficulty('入門對話');
  assert.equal(api.document.getElementById('difficulty').value, '入門對話');
  assert.deepEqual(calls, ['render', 'reveal']);
});

test('assets/style.css defines responsive and accessible styling for hero difficulty options', () => {
  assert.match(cssSource, /\.draw-difficulty-bar\s*\{/, 'style.css must style .draw-difficulty-bar');
  assert.match(cssSource, /\.draw-diff-btn\s*\{[^}]*min-height:\s*44px/, 'draw-diff-btn must have at least 44px touch target');
  assert.match(cssSource, /\.draw-diff-btn\[aria-pressed=true\]/, 'draw-diff-btn must style active pressed state');
  assert.match(cssSource, /\.draw-difficulty-buttons\s*\{[^}]*grid-template-columns:\s*1fr/, 'draw-difficulty-buttons must stack on 360px viewport');
});
