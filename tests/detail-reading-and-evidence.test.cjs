'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appSource = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8')
  .split('/* Browser event bindings. */')[0];
const readerCss = fs.readFileSync(path.join(__dirname, '../assets/reader.css'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../assets/style.css'), 'utf8');

function setupDom() {
  function createElement(tag, className = '', textContent = '') {
    const el = {
      tagName: tag.toUpperCase(),
      className,
      classList: {
        add(cls) { if (!el.className.split(' ').includes(cls)) el.className = (el.className + ' ' + cls).trim(); },
        contains(cls) { return el.className.split(' ').includes(cls); }
      },
      dataset: {},
      attributes: {},
      children: [],
      _text: textContent,
      get textContent() {
        if (el.children.length === 0) return el._text;
        return el.children.map(c => c.textContent || '').join('');
      },
      set textContent(v) { el._text = String(v); el.children = []; },
      open: false,
      get lastChild() { return el.children[el.children.length - 1]; },
      setAttribute(k, v) { el.attributes[k] = String(v); },
      getAttribute(k) { return el.attributes[k] ?? null; },
      append(...nodes) {
        for (const n of nodes) {
          if (typeof n === 'string' || typeof n === 'number') {
            el.children.push({ tagName: '#text', textContent: String(n) });
          } else if (n) {
            el.children.push(n);
          }
        }
      },
      replaceChildren(...nodes) {
        el.children = [];
        el.append(...nodes);
      },
      querySelector(sel) {
        const cls = sel.replace(/^\./, '');
        function find(node) {
          if (!node || !node.children) return null;
          for (const c of node.children) {
            if (c.className && c.className.split(' ').includes(cls)) return c;
            const res = find(c);
            if (res) return res;
          }
          return null;
        }
        return find(el);
      },
      querySelectorAll(sel) {
        const matches = [];
        function walk(node) {
          if (!node || !node.children) return;
          for (const c of node.children) {
            if (sel === '.guidance-card' && c.className?.includes('guidance-card')) matches.push(c);
            if (sel === 'button' && c.tagName === 'BUTTON') matches.push(c);
            walk(c);
          }
        }
        walk(el);
        return matches;
      },
      listeners: {},
      addEventListener(type, handler) { (el.listeners[type] ||= []).push(handler); },
      async click() { for (const handler of el.listeners.click || []) await handler(); },
      focus() { documentMock.activeElement = el; },
      select() { el.selected = true; }
    };

    return el;
  }

  const detailBody = createElement('div', 'detail-body');
  const detailModal = createElement('dialog', 'detail');
  detailModal.showModal = function() { this.open = true; };
  detailModal.close = function() { this.open = false; };
  detailModal.children.push(detailBody);
  const documentMock = {
    createElement,
    createTextNode(t) { return { tagName: '#text', textContent: String(t) }; },
    getElementById(id) {
      if (id === 'detail') return detailModal;
      if (id === 'detail-body') return detailBody;
      return createElement('div', id);
    },
    querySelector(sel) {
      if (sel === '#detail-body') return detailBody;
      if (sel === '#detail') return detailModal;
      return createElement('div', sel.replace(/^[#.]/, ''));
    }
  };

  const timers = [];
  const clearedTimers = new Set();

  const context = vm.createContext({
    document: documentMock,
    window: { document: documentMock },
    console,
    URL,
    Discovery: { scenarioOf: () => '' },
    activeScenario: '',
    crypto: { randomUUID: () => 'test-uuid' },
    location: { href: 'http://localhost/ai-agent-use-cases/' },
    history: { pushState() {}, replaceState() {}, state: null },
    displayCopy: {},
    discoveryReady: true,
    navigator: { clipboard: undefined },
    setTimeout(callback) { timers.push(callback); return timers.length; },
    clearTimeout(id) { clearedTimers.add(id); }
  });

  vm.runInContext(appSource, context);
  return { context, detailBody, detailModal, createElement, timers, clearedTimers };
}

test('metadata extracts targetUser and coreGoal when declared in markdown lead', () => {
  const { context } = setupDom();
  const sampleMarkdown = `# UC-281：多代理接力實作

- 情境：開發
- 標籤：多代理、驗收
- 網站標題：一人同時顧多個專案？用「構想 Bot → 實作代理 → 截圖 QA」接力
- 一句話用途：作者用 Grok Bot 做發想並由 Claude Opus 工人代理接力。
- 核心目標：把產品構想、實作與視覺驗收拆成可交接的代理流水線。
- 目標使用者：同時維護多個網站或 App、願意用多套代理分工的開發者
- 來源證據：author-demo
- 查證日期：2026-10-17

## 來源版本
內容...
`;

  const meta = context.metadata(sampleMarkdown, 'cases/281-pipeline.md', 'case');
  assert.equal(meta.targetUser, '同時維護多個網站或 App、願意用多套代理分工的開發者');
  assert.equal(meta.coreGoal, '把產品構想、實作與視覺驗收拆成可交接的代理流水線。');
  assert.match(meta.search, /同時維護多個網站/);
});

test('metadata handles missing targetUser and coreGoal gracefully without crashing', () => {
  const { context } = setupDom();
  const sampleMarkdown = `# UC-001：旅行規劃

- 情境：生活
- 標籤：旅遊
- 網站標題：規劃旅行，先把交通和住宿比清楚
- 一句話用途：整理可比較的旅行方案。

## 內容
`;

  const meta = context.metadata(sampleMarkdown, 'cases/001-travel.md', 'case');
  assert.equal(meta.targetUser, '');
  assert.equal(meta.coreGoal, '');
});

test('PROOF_DEFINITIONS provides honest plain-language explanations for all 5 proof types', () => {
  const { context } = setupDom();
  assert.ok(context.PROOF_DEFINITIONS, 'PROOF_DEFINITIONS object must exist in app.js');
  const requiredProofs = ['官方自報', '作者報告／示範', '公開資料核讀', '模板／文件核讀', '尚待查證'];
  for (const proof of requiredProofs) {
    const desc = context.PROOF_DEFINITIONS[proof];
    assert.ok(desc, `PROOF_DEFINITIONS must have entry for "${proof}"`);
    assert.ok(desc.length >= 10, `Definition for "${proof}" should be substantive`);
  }
});

test('showDetail renders detail-proof-note and targetUser section when present', () => {
  const { context, detailBody } = setupDom();
  const sample = {
    id: 'UC-281',
    title: '一人同時顧多個專案？用「構想 Bot → 實作代理 → 截圖 QA」接力',
    what: '作者用 Grok Bot 做發想並由 Claude Opus 工人代理接力。',
    summary: '作者用 Grok Bot 做發想並由 Claude Opus 工人代理接力。',
    targetUser: '同時維護多個網站或 App、願意用多套代理分工的開發者',
    coreGoal: '把產品構想、實作與視覺驗收拆成可交接的代理流水線。',
    how: '先用小範圍測試',
    caution: '注意安全性',
    kind: 'case',
    scenario: '開發',
    proof: '作者報告／示範',
    tools: ['Grok Bot'],
    tags: ['多代理'],
    reviewedDate: '2026-10-17',
    path: 'cases/281.md',
    markdown: '# UC-281\n\n## 來源\n內容'
  };

  context.showDetail(sample, null, false);

  const proofNote = detailBody.querySelector('.detail-proof-note');
  assert.ok(proofNote, 'showDetail must render .detail-proof-note');
  assert.match(proofNote.textContent, /作者報告／示範/);
  assert.match(proofNote.textContent, /社群作者公開分享/);

  const targetUserEl = detailBody.querySelector('.detail-target-user');
  assert.ok(targetUserEl, 'showDetail must render .detail-target-user when item.targetUser exists');
  assert.match(targetUserEl.textContent, /適合對象/);
  assert.match(targetUserEl.textContent, /同時維護多個網站/);
});

test('reader guidance sections are styled and mobile toolbar meets accessibility guidelines', () => {
  assert.match(readerCss, /\.detail-proof-note\s*\{/, 'reader.css must define .detail-proof-note');
  assert.match(readerCss, /\.proof-note-tag\s*\{/, 'reader.css must define .proof-note-tag');
  assert.match(readerCss, /\.detail-target-user\s*\{/, 'reader.css must define .detail-target-user');
  assert.match(readerCss, /\.guidance-card\s*\{/, 'reader.css must define .guidance-card');
  assert.match(readerCss, /\.detail-toolbar-actions button\s*\{[^}]*min-height:\s*44px/, 'toolbar buttons must retain >= 44px min-height on mobile');
});

test('SCENARIO_TARGET_USERS provides substantive defaults for all 6 core scenarios', () => {
  const { context } = setupDom();
  assert.ok(context.SCENARIO_TARGET_USERS, 'SCENARIO_TARGET_USERS must exist in app.js');
  const scenarios = ['生活', '工作', '省錢', '學習', '創作', '開發'];
  for (const s of scenarios) {
    const text = context.SCENARIO_TARGET_USERS[s];
    assert.ok(text, `SCENARIO_TARGET_USERS must have entry for scenario "${s}"`);
    assert.ok(text.length >= 10, `Audience definition for "${s}" must be substantive`);
  }
});

test('showDetail falls back to SCENARIO_TARGET_USERS when targetUser is omitted', () => {
  const { context, detailBody } = setupDom();
  const sampleWithoutTarget = {
    id: 'UC-005',
    title: '雲端 PR 審查代理',
    what: '把開發需求交給實作助手，再用另一個角色檢查程式修改。',
    summary: '把開發需求交給實作助手，再用另一個角色檢查程式修改。',
    kind: 'case',
    scenario: '開發',
    proof: '作者報告／示範',
    tools: ['GitHub'],
    tags: ['PR'],
    reviewedDate: '2026-10-18',
    path: 'cases/005-cloud-pr-review.md',
    markdown: '# UC-005\n\n## 來源\n內容'
  };

  context.showDetail(sampleWithoutTarget, null, false);
  const targetUserEl = detailBody.querySelector('.detail-target-user');
  assert.ok(targetUserEl, 'showDetail must render .detail-target-user using scenario fallback');
  assert.match(targetUserEl.textContent, /適合對象/);
  assert.match(targetUserEl.textContent, /工程師、程式開發者/);
});

test('renderRelated includes next-step actions: scenario exploration and note copy', () => {
  const { context } = setupDom();
  const sample = {
    id: 'UC-001',
    title: '旅行規劃比價',
    what: '整理可比較的旅行方案。',
    summary: '整理可比較的旅行方案。',
    how: '第一步先比交通',
    caution: '注意訂房退改政策',
    kind: 'case',
    scenario: '生活',
    category: '旅遊',
    proof: '公開資料核讀',
    tools: ['ChatGPT'],
    tags: ['旅遊']
  };

  const relatedEl = context.renderRelated(sample);
  const nextActions = relatedEl.querySelector('.detail-next-actions');
  assert.ok(nextActions, 'renderRelated must include .detail-next-actions');

  const scenarioBtn = relatedEl.querySelector('.detail-action-scenario');
  assert.ok(scenarioBtn, 'renderRelated must include scenario exploration button');
  assert.match(scenarioBtn.textContent, /探索更多「生活」案例/);

  const copyBtn = relatedEl.querySelector('.detail-action-copy');
  assert.ok(copyBtn, 'renderRelated must include copy note button');
  assert.match(copyBtn.textContent, /複製本篇筆記與連結/);
});

test('note-copy failure exposes the complete note in a selectable manual fallback', async () => {
  const { context } = setupDom();
  const sample = {
    id: 'UC-001',
    title: '旅行規劃比價',
    what: '整理可比較的旅行方案。',
    how: '第一步先比交通',
    caution: '注意訂房退改政策',
    kind: 'case',
    scenario: '生活',
    proof: '作者報告／示範',
    category: '旅遊'
  };
  context.navigator.clipboard = { writeText: async () => { throw new Error('denied'); } };

  const related = context.renderRelated(sample);
  await related.querySelector('.detail-action-copy').click();

  const status = related.querySelector('.detail-action-status');
  const manual = related.querySelector('.detail-action-manual-copy');
  assert.match(status.textContent, /手動複製下方完整筆記/);
  assert.equal(manual.hidden, false);
  assert.equal(manual.readOnly, true);
  assert.match(manual.value, /UC-001 · 旅行規劃比價/);
  assert.match(manual.value, /第一步先比交通/);
  assert.match(manual.value, /注意訂房退改政策/);
  assert.match(manual.value, /case=UC-001/);
});

test('only the latest note-copy request can replace feedback', async () => {
  const { context } = setupDom();
  const pending = [];
  context.navigator.clipboard = {
    writeText: () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
  };
  const related = context.renderRelated({
    id: 'UC-001', title: '旅行規劃比價', what: '用途', kind: 'case', scenario: '生活'
  });
  const copy = related.querySelector('.detail-action-copy');
  const first = copy.click();
  const second = copy.click();
  pending[1].resolve();
  await second;
  pending[0].reject(new Error('late denial'));
  await first;
  assert.equal(related.querySelector('.detail-action-status').textContent, '已複製案例筆記！');
});

test('a previous success timeout cannot erase newer copy feedback', async () => {
  const { context, timers, clearedTimers } = setupDom();
  context.navigator.clipboard = { writeText: async () => {} };
  const related = context.renderRelated({
    id: 'UC-001', title: '旅行規劃比價', what: '用途', kind: 'case', scenario: '生活'
  });
  const copy = related.querySelector('.detail-action-copy');
  await copy.click();
  const firstTimeout = timers[0];
  await copy.click();
  firstTimeout();
  assert.ok(clearedTimers.has(1));
  assert.equal(related.querySelector('.detail-action-status').textContent, '已複製案例筆記！');
});

test('copy denial does not steal focus after the reader moved away', async () => {
  const { context } = setupDom();
  let rejectClipboard;
  context.navigator.clipboard = {
    writeText: () => new Promise((resolve, reject) => { rejectClipboard = reject; })
  };
  const related = context.renderRelated({
    id: 'UC-001', title: '旅行規劃比價', what: '用途', kind: 'case', scenario: '生活'
  });
  const copy = related.querySelector('.detail-action-copy');
  copy.focus();
  const pendingCopy = copy.click();
  const nextControl = {};
  context.document.activeElement = nextControl;
  rejectClipboard(new Error('denied'));
  await pendingCopy;
  assert.equal(context.document.activeElement, nextControl);
  assert.equal(related.querySelector('.detail-action-manual-copy').hidden, false);
});

test('card proof badge includes accessible aria-label with explanation', () => {
  const { context } = setupDom();
  const sample = {
    id: 'UC-001',
    title: '測試卡片',
    summary: '用途摘要',
    kind: 'case',
    scenario: '生活',
    proof: '作者報告／示範',
    tools: ['Grok Bot'],
    tags: ['旅遊']
  };

  const cardEl = context.card(sample);
  const proofEl = cardEl.querySelector('.proof');
  assert.ok(proofEl, 'card must contain .proof');
  assert.match(proofEl.getAttribute('aria-label') || '', /來源憑據：作者報告／示範/);
  assert.match(proofEl.getAttribute('aria-label') || '', /社群作者公開分享/);
});

test('reader.css uses valid color variable var(--ink) and defines next-step and guidance styles', () => {
  assert.doesNotMatch(readerCss, /var\(--fg\)/, 'reader.css must not use undefined var(--fg)');
  assert.match(readerCss, /\.detail-next-actions\s*\{/, 'reader.css must define .detail-next-actions');
  assert.match(readerCss, /\.detail-action-scenario\s*\{/, 'reader.css must define .detail-action-scenario');
  assert.match(readerCss, /\.detail-action-copy\s*\{/, 'reader.css must define .detail-action-copy');
  assert.match(readerCss, /\.reader-guidance-shortcut\s*\{/, 'reader.css must define .reader-guidance-shortcut');
});
