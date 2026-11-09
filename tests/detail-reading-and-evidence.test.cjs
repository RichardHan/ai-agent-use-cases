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
        const wanted = sel.startsWith('.') ? sel.slice(1) : '';
        const match = c => sel === 'button'
          ? c.tagName === 'BUTTON'
          : !!wanted && (c.className || '').split(' ').includes(wanted);
        function walk(node) {
          if (!node || !node.children) return;
          for (const c of node.children) {
            if (match(c)) matches.push(c);
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

test('long case description leads with its stated goal and preserves the full account on demand', () => {
  const { context, detailBody, detailModal } = setupDom();
  const full = '作者逐一核對候選名單、人工決定是否採用；'.repeat(12);
  const item = {
    id: 'UC-359', title: '長標題案例', what: full,
    coreGoal: '先篩選候選，再由本人決定。',
    kind: 'case', scenario: '工作', proof: '作者報告／示範',
    tools: [], tags: [], path: 'cases/359.md', markdown: '# UC-359\n\n## 來源\n內容'
  };
  context.showDetail(item, null, false);
  const overview = detailBody.querySelector('.plain-overview');
  assert.equal(overview.children[0].children[1].textContent, item.coreGoal);
  const fullAccount = overview.querySelector('.detail-full-account');
  assert.equal(fullAccount.tagName, 'DETAILS');
  assert.match(fullAccount.children[0].textContent, /完整用途/);
  assert.equal(fullAccount.children[1].textContent, full);
  assert.equal(overview.querySelector('.detail-core-goal'), null, 'do not repeat the same goal');
  detailModal.close();
  context.showDetail({...item, what: '短用途', coreGoal: '另一句核心目標'}, null, false);
  assert.equal(detailBody.querySelector('.plain-overview').children[0].children[1].textContent, '短用途');
  assert.equal(detailBody.querySelector('.detail-full-account'), null);
  detailModal.close();
  context.showDetail({...item, coreGoal: ''}, null, false);
  assert.equal(detailBody.querySelector('.plain-overview').children[0].children[1].textContent, full);
  assert.equal(detailBody.querySelector('.detail-full-account'), null);
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

test('scenario exploration is available before research while note copy remains after related cases', () => {
  const { context, detailBody } = setupDom();
  const sample = {
    id: 'UC-001',
    path: 'cases/001-travel.md',
    markdown: '# 旅行規劃比價\n\n## 方法\n比較交通。',
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

  context.showDetail(sample, null, false);
  const overview = detailBody.querySelector('.plain-overview');
  const scenarioBtn = overview.querySelector('.detail-action-scenario');
  assert.ok(scenarioBtn, 'scenario exploration follows the purpose');
  assert.match(scenarioBtn.textContent, /探索更多「生活」案例/);
  const relatedEl = detailBody.querySelector('.related-cases');
  assert.equal(relatedEl.querySelector('.detail-action-scenario'), null);
  const nextActions = relatedEl.querySelector('.detail-next-actions');
  assert.ok(nextActions);

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
  assert.match(manual.value, /本庫入門建議為整理者設計，非實測結果；未獨立重現/);
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
  assert.match(readerCss, /\.detail-action-manual-copy\s*\{/, 'reader.css must define .detail-action-manual-copy');
});

test('PROOF_CLAIMANTS and PROOF_VERIFICATION_STATUS provide transparent attribution and boundaries', () => {
  const { context } = setupDom();
  assert.ok(context.PROOF_CLAIMANTS, 'PROOF_CLAIMANTS must exist');
  assert.ok(context.PROOF_VERIFICATION_STATUS, 'PROOF_VERIFICATION_STATUS must exist');
  const requiredProofs = ['官方自報', '作者報告／示範', '公開資料核讀', '模板／文件核讀', '尚待查證'];
  for (const proof of requiredProofs) {
    assert.ok(context.PROOF_CLAIMANTS[proof], `PROOF_CLAIMANTS must define "${proof}"`);
    assert.ok(context.PROOF_VERIFICATION_STATUS[proof], `PROOF_VERIFICATION_STATUS must define "${proof}"`);
  }
});

test('showDetail renders structured claimant and verification status in detail-proof-note', () => {
  const { context, detailBody } = setupDom();
  const sampleOfficial = {
    id: 'UC-010', title: '官方示範', what: '官方用途',
    kind: 'case', scenario: '工作', proof: '官方自報',
    tools: [], tags: [], path: 'cases/010.md', markdown: '# UC-010\n\n## 來源\n官方內容'
  };
  context.showDetail(sampleOfficial, null, false);
  const proofNote = detailBody.querySelector('.detail-proof-note');
  assert.ok(proofNote, 'must render .detail-proof-note');
  const claimantEl = proofNote.querySelector('.proof-note-claimant');
  assert.ok(claimantEl, 'must render .proof-note-claimant');
  assert.match(claimantEl.textContent, /官方團隊／原廠自述/);
  const statusEl = proofNote.querySelector('.proof-note-status');
  assert.ok(statusEl, 'must render .proof-note-status');
  assert.match(statusEl.textContent, /未經第三方獨立實測重現/);
});

test('reader.css defines styling for structured proof note elements', () => {
  assert.match(readerCss, /\.proof-note-claimant\s*\{/, 'reader.css must define .proof-note-claimant');
  assert.match(readerCss, /\.proof-note-status\s*\{/, 'reader.css must define .proof-note-status');
});

test('PROOF_SAFE_ADOPTION_TIP provides transparent adoption guidance and boundaries', () => {
  const { context } = setupDom();
  assert.ok(context.PROOF_SAFE_ADOPTION_TIP, 'PROOF_SAFE_ADOPTION_TIP must exist in app.js');
  const requiredProofs = ['官方自報', '作者報告／示範', '公開資料核讀', '模板／文件核讀', '尚待查證'];
  for (const proof of requiredProofs) {
    const tip = context.PROOF_SAFE_ADOPTION_TIP[proof];
    assert.ok(tip, `PROOF_SAFE_ADOPTION_TIP must define "${proof}"`);
    assert.ok(tip.length >= 15, `Adoption tip for "${proof}" should be substantive`);
  }
});

test('showDetail renders structured safe adoption tip in detail-proof-note', () => {
  const { context, detailBody } = setupDom();
  const sample = {
    id: 'UC-014', title: '工單處理', what: '工單用途',
    kind: 'case', scenario: '工作', proof: '作者報告／示範',
    tools: [], tags: [], path: 'cases/014.md', markdown: '# UC-014\n\n## 來源\n內容'
  };
  context.showDetail(sample, null, false);
  const proofNote = detailBody.querySelector('.detail-proof-note');
  assert.ok(proofNote, 'must render .detail-proof-note');
  const safetyEl = proofNote.querySelector('.proof-note-safety');
  assert.ok(safetyEl, 'must render .proof-note-safety');
  assert.match(safetyEl.textContent, /安全採用建議/);
  assert.match(safetyEl.textContent, /資料去敏|人工審批/);
});

test('reader.css defines styling for proof-note-safety', () => {
  assert.match(readerCss, /\.proof-note-safety\s*\{/, 'reader.css must define .proof-note-safety');
});

test('PROOF_SAFE_ADOPTION_TIP provides transparent three-layer adoption boundaries (safe scope, forbidden actions, human audit)', () => {
  const { context, detailBody } = setupDom();
  const requiredProofs = ['官方自報', '作者報告／示範', '公開資料核讀', '模板／文件核讀', '尚待查證'];
  for (const proof of requiredProofs) {
    const tip = context.PROOF_SAFE_ADOPTION_TIP[proof];
    assert.match(tip, /落地三層防護/, `Adoption tip for "${proof}" must announce 落地三層防護`);
    assert.match(tip, /建議試跑/, `Adoption tip for "${proof}" must specify 建議試跑`);
    assert.match(tip, /禁止動作/, `Adoption tip for "${proof}" must specify 禁止動作`);
    assert.match(tip, /必經審核/, `Adoption tip for "${proof}" must specify 必經審核`);
  }

  const sample = {
    id: 'UC-014', title: '工單處理', what: '工單用途',
    kind: 'case', scenario: '工作', proof: '作者報告／示範',
    tools: [], tags: [], path: 'cases/014.md', markdown: '# UC-014\n\n## 來源\n內容'
  };
  context.showDetail(sample, null, false);
  const safetyEl = detailBody.querySelector('.proof-note-safety');
  assert.ok(safetyEl, 'must render .proof-note-safety');
  assert.match(safetyEl.textContent, /落地三層防護/);
  assert.match(safetyEl.textContent, /建議試跑/);
  assert.match(safetyEl.textContent, /禁止動作/);
  assert.match(safetyEl.textContent, /必經審核/);
});

test('showDetail renders three-layer safe adoption tip even for unknown or missing proof types', () => {
  const { context, detailBody } = setupDom();
  const sampleUnknown = {
    id: 'UC-999', title: '未知來源測試', what: '測試用途',
    kind: 'case', scenario: '工作', proof: '未知來源類型',
    tools: [], tags: [], path: 'cases/999.md', markdown: '# UC-999\n\n## 來源\n內容'
  };
  context.showDetail(sampleUnknown, null, false);
  const safetyEl = detailBody.querySelector('.proof-note-safety');
  assert.ok(safetyEl, 'must render .proof-note-safety');
  assert.match(safetyEl.textContent, /落地三層防護/, 'fallback tip must announce 落地三層防護');
  assert.match(safetyEl.textContent, /建議試跑/, 'fallback tip must specify 建議試跑');
  assert.match(safetyEl.textContent, /禁止動作/, 'fallback tip must specify 禁止動作');
  assert.match(safetyEl.textContent, /必經審核/, 'fallback tip must specify 必經審核');
});

test('reader view provides quick safety and credibility shortcut to proof and safe adoption notes', () => {
  const readerJs = fs.readFileSync(path.join(__dirname, '../assets/reader.js'), 'utf8');
  assert.match(readerJs, /reader-safety-shortcut/, 'reader.js must create .reader-safety-shortcut');
  assert.match(readerJs, /查核依據與安全採用/, 'safety shortcut must have clear descriptive label');
  assert.match(readerJs, /safetyShortcut\.setAttribute\(['"]aria-label['"],\s*['"]查核依據與安全採用/, 'aria-label must begin with visible label for WCAG 2.5.3');
  assert.match(readerCss, /\.reader-safety-shortcut\s*\{[^}]*min-height:\s*44px/, 'reader.css must give .reader-safety-shortcut at least 44px touch target');
  assert.match(readerCss, /\.reader-safety-shortcut:focus-visible\s*\{/, 'reader.css must define focus-visible for safety shortcut');
});

test('detail view says whether the 實作門檻 was declared or guessed', () => {
  const { context, detailBody, detailModal } = setupDom();
  const item = {
    id: 'UC-063', title: 'Plex 媒體庫整理', what: '先列整理草案。',
    kind: 'case', scenario: '生活', proof: '作者報告／示範',
    difficulty: '入門對話', difficultySource: 'inferred',
    tools: ['Grok Bot'], tags: [], path: 'cases/063.md', markdown: '# UC-063\n\n## 來源\n內容'
  };
  context.showDetail(item, null, false);
  const inferred = detailBody.querySelector('.detail-difficulty');
  assert.ok(inferred, 'detail must render .detail-difficulty');
  const inferredNote = inferred.querySelector('.detail-difficulty-source');
  assert.ok(inferredNote, 'detail must say where the tier came from');
  assert.match(inferredNote.textContent, /未宣告/);
  assert.match(inferredNote.textContent, /推測/);
  detailModal.close();

  context.showDetail({ ...item, difficulty: '工具串接', difficultySource: 'declared' }, null, false);
  const declaredNote = detailBody.querySelector('.detail-difficulty').querySelector('.detail-difficulty-source');
  assert.match(declaredNote.textContent, /案例頁自行宣告/);
  assert.doesNotMatch(declaredNote.textContent, /推測/);
  detailModal.close();
});

test('every verification class has a faithful short form for the first-screen trust summary', () => {
  const { context } = setupDom();
  assert.deepEqual(
    Object.keys(context.PROOF_STATUS_SHORT).sort(),
    Object.keys(context.PROOF_VERIFICATION_STATUS).sort(),
    'PROOF_STATUS_SHORT must cover exactly the classes the full note explains'
  );
  for (const [proof, short] of Object.entries(context.PROOF_STATUS_SHORT)) {
    assert.ok(short.length > 0 && short.length <= 20, `short status for "${proof}" must stay compact`);
    assert.doesNotMatch(short, /https?:|\[|\]/, `short status for "${proof}" must be plain text`);
  }
});

test('showDetail renders claimant and verification beside the title, not only far down the page', async () => {
  const { context, detailBody } = setupDom();
  const item = {
    id: 'UC-098', title: '工程 PDF 轉 Excel', what: '整理多份 PDF。',
    kind: 'case', scenario: '工作', proof: '作者報告／示範',
    tools: [], tags: [], path: 'cases/098.md', markdown: '# UC-098\n\n## 來源\n內容'
  };
  context.showDetail(item, null, false);
  const summary = detailBody.querySelector('.detail-trust-summary');
  assert.ok(summary, 'detail must render .detail-trust-summary');
  assert.match(summary.textContent, /成果主張：社群作者／專案實踐者/);
  assert.match(summary.textContent, /核讀：本庫未獨立重現/);
  const jump = summary.querySelectorAll('button').find(button => button.textContent.includes('核讀與安全建議'));
  assert.ok(jump, 'summary must offer a jump to the full proof note');
  const note = detailBody.querySelector('.detail-proof-note');
  assert.ok(note, 'detail must still render the full proof note');
  await jump.click();
  assert.equal(context.document.activeElement, note, 'jump must move focus to the proof note');
  assert.equal(String(note.tabIndex), '-1', 'focused proof note must be programmatically focusable');
});

test('trust summary follows each proof class and falls back without inventing attribution', () => {
  const { context, detailBody, detailModal } = setupDom();
  const base = {
    id: 'UC-020', title: '樣本', what: '用途', kind: 'case', scenario: '工作',
    tools: [], tags: [], path: 'cases/020.md', markdown: '# UC-020\n\n## 來源\n內容'
  };
  for (const [proof, claimant] of Object.entries(context.PROOF_CLAIMANTS)) {
    context.showDetail({ ...base, proof }, null, false);
    const text = detailBody.querySelector('.detail-trust-summary').textContent;
    assert.ok(text.includes('成果主張：' + claimant), `summary must name the claimant for "${proof}"`);
    assert.ok(text.includes('核讀：' + context.PROOF_STATUS_SHORT[proof]), `summary must carry the short status for "${proof}"`);
    detailModal.close();
  }
  context.showDetail({ ...base, proof: '未知等級' }, null, false);
  const fallback = detailBody.querySelector('.detail-trust-summary').textContent;
  assert.match(fallback, /成果主張：來源未明/);
  assert.match(fallback, /核讀：未獨立重現/);
});

test('reader.css keeps the trust summary legible and the jump operable', () => {
  assert.match(readerCss, /\.detail-trust-summary\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(readerCss, /\.detail-trust-jump\s*\{[^}]*min-height:\s*44px/);
  assert.match(readerCss, /\.detail-trust-jump:focus-visible\s*\{/);
  assert.match(readerCss, /\.detail-proof-note\s*\{[^}]*scroll-margin-top:/);
});

test('a case that declares two evidence classes shows both chips and keeps the primary one named', () => {
  const { context, detailBody } = setupDom();
  const item = {
    id: 'UC-514', title: '年末送禮追蹤畫面', what: '用一句話請 Muse 做一個會留下來的送禮畫面。',
    summary: '用一句話請 Muse 做一個會留下來的送禮畫面。',
    kind: 'case', scenario: '生活', proof: '官方自報',
    proofClasses: ['官方自報', '設計／未實跑'],
    tools: ['Meta Muse'], tags: ['送禮'], reviewedDate: '2026-11-09',
    path: 'cases/514.md', markdown: '# UC-514\n\n## 來源\n內容'
  };
  context.showDetail(item, null, false);

  const chips = [...detailBody.querySelector('.detail-header-meta').querySelectorAll('.proof-badge')];
  assert.deepEqual(chips.map(chip => chip.textContent), ['官方自報', '設計／未實跑'],
    'every declared class is a visible chip, not only the class that won precedence');
  assert.match(chips[0].getAttribute('aria-label'), /來源憑據（主要）：官方自報/,
    'the first chip is marked as the primary class in its accessible name');
  assert.match(chips[1].getAttribute('aria-label'), /來源憑據（同案宣告）：設計／未實跑/);

  const summary = detailBody.querySelector('.detail-trust-summary').textContent;
  assert.match(summary, /成果主張：主要 官方團隊／原廠自述/, summary);
  assert.match(summary, /另宣告 設計／未實跑/, summary);
  assert.doesNotMatch(summary, /成果主張：官方團隊／原廠自述核讀/,
    'a single claimant must not be stated as if it covered the whole page');

  const list = detailBody.querySelector('.proof-note-classes');
  assert.ok(list, 'the full note lists the declared classes');
  assert.match(list.textContent, /本案例頁首宣告 2 類來源/);
  assert.match(list.textContent, /主要：成果主張 官方團隊／原廠自述/);
  assert.match(list.textContent, /同案宣告：成果主張 提示詞設計者（未提供執行結果）/);
  assert.match(detailBody.querySelector('.proof-note-claimant').textContent, /成果主張來源（主要：官方自報）/);
});

test('a single-class case keeps exactly one chip and the wording the round-3 summary shipped', () => {
  const { context, detailBody } = setupDom();
  const item = {
    id: 'UC-098', title: '單一來源案例', what: '作者公開的實作紀錄。',
    summary: '作者公開的實作紀錄。',
    kind: 'case', scenario: '工作', proof: '作者報告／示範',
    proofClasses: ['作者報告／示範'],
    tools: [], tags: [], reviewedDate: '2026-11-09',
    path: 'cases/098.md', markdown: '# UC-098\n\n## 來源\n內容'
  };
  context.showDetail(item, null, false);
  const chips = [...detailBody.querySelector('.detail-header-meta').querySelectorAll('.proof-badge')];
  assert.equal(chips.length, 1);
  assert.equal(chips[0].getAttribute('aria-label'), '來源憑據：作者報告／示範。' + context.PROOF_DEFINITIONS['作者報告／示範']);
  const summary = detailBody.querySelector('.detail-trust-summary').textContent;
  assert.match(summary, /成果主張：社群作者／專案實踐者核讀：本庫未獨立重現/);
  assert.equal(detailBody.querySelector('.proof-note-classes'), null, 'no class list when there is nothing to list');
});

test('multi-class styles are defined and keep the tags legible on a phone', () => {
  assert.match(readerCss, /\.proof-note-class-list\s*\{[^}]*flex-direction:\s*column/);
  for (const label of ['官方自報', '作者報告／示範', '公開資料核讀', '模板／文件核讀', '尚待查證', '設計／未實跑']) {
    assert.ok(readerCss.includes(`.proof-note-class-tag[data-proof="${label}"]`), `reader.css must colour ${label}`);
  }
});
