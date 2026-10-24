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
        if (sel === '.proof') {
          return el.children.find(c => c.className?.includes('proof')) ||
                 el.children.flatMap(c => c.children || []).find(c => c.className?.includes('proof'));
        }
        if (sel === '.detail-proof-note') {
          return el.children.find(c => c.className?.includes('detail-proof-note')) ||
                 el.children.flatMap(c => c.children || []).find(c => c.className?.includes('detail-proof-note'));
        }
        if (sel === '.detail-target-user') {
          return el.children.find(c => c.className?.includes('detail-target-user')) ||
                 el.children.flatMap(c => c.children || []).find(c => c.className?.includes('detail-target-user'));
        }
        if (sel === '.reader-guidance') {
          return el.children.find(c => c.className?.includes('reader-guidance')) ||
                 el.children.flatMap(c => c.children || []).find(c => c.className?.includes('reader-guidance'));
        }
        return null;
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
      addEventListener() {},
      focus() {}
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
    discoveryReady: true
  });

  vm.runInContext(appSource, context);
  return { context, detailBody, detailModal };
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
