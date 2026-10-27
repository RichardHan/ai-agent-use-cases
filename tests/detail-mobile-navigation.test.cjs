'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appSource = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8')
  .split('/* Browser event bindings. */')[0];
const readerCss = fs.readFileSync(path.join(__dirname, '../assets/reader.css'), 'utf8');

function setupDom() {
  const elements = new Map();
  function createElement(tag) {
    const el = {
      tagName: tag.toUpperCase(),
      className: '',
      children: [],
      dataset: {},
      attributes: {},
      style: {},
      hidden: false,
      textContent: '',
      tabIndex: 0,
      get lastChild() { return this.children[this.children.length - 1]; },
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] ?? null; },
      removeAttribute(k) { delete this.attributes[k]; },
      hasAttribute(k) { return k in this.attributes; },
      append(...children) {
        for (const c of children) {
          if (c == null) continue;
          if (typeof c === 'string' || typeof c === 'number') {
            this.children.push({ textContent: String(c), nodeType: 3 });
          } else {
            c.parentElement = this;
            this.children.push(c);
          }
        }
      },
      prepend(...children) {
        for (let i = children.length - 1; i >= 0; i--) {
          const c = children[i];
          if (c == null) continue;
          if (typeof c === 'string' || typeof c === 'number') {
            this.children.unshift({ textContent: String(c), nodeType: 3 });
          } else {
            c.parentElement = this;
            this.children.unshift(c);
          }
        }
      },
      replaceChildren(...children) {
        this.children = [];
        this.append(...children);
      },
      before(...nodes) {
        if (!this.parentElement) return;
        const idx = this.parentElement.children.indexOf(this);
        if (idx !== -1) {
          this.parentElement.children.splice(idx, 0, ...nodes);
        }
      },
      after(...nodes) {
        if (!this.parentElement) return;
        const idx = this.parentElement.children.indexOf(this);
        if (idx !== -1) {
          this.parentElement.children.splice(idx + 1, 0, ...nodes);
        }
      },
      querySelector(selector) {
        const queue = [...this.children];
        while (queue.length) {
          const node = queue.shift();
          if (node.nodeType === 3) continue;
          if (matches(node, selector)) return node;
          if (node.children) queue.push(...node.children);
        }
        return null;
      },
      querySelectorAll(selector) {
        const matchesList = [];
        const queue = [...this.children];
        while (queue.length) {
          const node = queue.shift();
          if (node.nodeType === 3) continue;
          if (matches(node, selector)) matchesList.push(node);
          if (node.children) queue.push(...node.children);
        }
        return matchesList;
      },
      contains(target) {
        if (this === target) return true;
        for (const child of this.children) {
          if (child === target || (child.contains && child.contains(target))) return true;
        }
        return false;
      },
      addEventListener() {},
      removeEventListener() {},
      focus() {},
      scrollIntoView() {},
      scrollTo() {},
      close() { this.open = false; },
      showModal() { this.open = true; }
    };
    return el;
  }

  function matches(node, selector) {
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return (node.className || '').split(/\s+/).includes(cls);
    }
    if (selector.startsWith('#')) {
      return node.id === selector.slice(1);
    }
    if (selector.toUpperCase() === node.tagName) return true;
    return false;
  }

  const document = {
    createElement,
    createTextNode(t) { return { textContent: t, nodeType: 3 }; },
    getElementById(id) {
      if (!elements.has(id)) {
        const el = createElement('div');
        el.id = id;
        elements.set(id, el);
      }
      return elements.get(id);
    },
    activeElement: null
  };
  const context = {
    document,
    location: new URL('https://richardhan.github.io/ai-agent-use-cases/'),
    history: { state: null, replaceState() {}, pushState() {} },
    navigator: { clipboard: { writeText: async () => {} } },
    window: { print() {} },
    clearTimeout() {},
    setTimeout() { return 1; },
    crypto: require('node:crypto'),
    URL
  };
  vm.createContext(context);
  vm.runInContext(appSource, context);
  return { context, document };
}

test('detail source link has descriptive desktop and mobile labels, target _blank, and rel noopener', () => {
  const { context, document } = setupDom();
  const sample = {
    id: 'UC-001',
    title: '旅行比價',
    path: 'cases/001-travel.md',
    markdown: '# UC-001\n\n## 介紹\n這是測試內容。',
    kind: 'case',
    scenario: '生活',
    proof: '公開資料核讀'
  };

  context.showDetail(sample, null, false);
  const detailBody = document.getElementById('detail-body');
  const sourceLink = detailBody.querySelector('.detail-source');

  assert.ok(sourceLink, 'detail view must render .detail-source');
  assert.equal(sourceLink.target, '_blank', 'source link must open in new tab');
  assert.equal(sourceLink.rel, 'noopener noreferrer', 'source link must have secure rel');
  assert.match(sourceLink.getAttribute('aria-label'), /GitHub.*Markdown/, 'aria-label must clearly mention GitHub and Markdown');

  const longLabel = sourceLink.querySelector('.print-action-long');
  const shortLabel = sourceLink.querySelector('.print-action-short');
  assert.ok(longLabel && shortLabel, 'must render both responsive label spans');
  assert.match(longLabel.textContent, /GitHub 原始 Markdown/, 'desktop label must mention GitHub 原始 Markdown');
  assert.match(shortLabel.textContent, /原始 Markdown/, 'mobile label must say 原始 Markdown');
  const sourceVersionNote = detailBody.querySelector('.detail-source-version');
  assert.ok(sourceVersionNote, 'reader must explain the version of the external source');
  assert.equal(sourceVersionNote.hidden, false);
  assert.match(sourceVersionNote.textContent, /尚未核對.*發布版本/, 'unverified source explains why external navigation is unavailable');
  assert.equal(sourceLink.getAttribute('href'), null, 'unverified source must not navigate to mutable main');
  assert.equal(sourceLink.getAttribute('aria-disabled'), 'true');
  const latest = detailBody.querySelector('.detail-source-latest');
  assert.ok(latest, 'fallback must offer an explicitly unverified source route');
  assert.equal(latest.href, 'https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/001-travel.md');
  assert.match(latest.textContent, /最新版本.*可能不同/);
  assert.equal(latest.target, '_blank');
  assert.equal(latest.rel, 'noopener noreferrer');
});

test('verified source replaces a focused latest-version link without losing keyboard focus', () => {
  const { context, document } = setupDom();
  const sample = {
    id: 'UC-001', title: '旅行比價', path: 'cases/001-travel.md',
    markdown: '# UC-001\n\n## 介紹\n測試內容。', kind: 'case',
    scenario: '生活', proof: '公開資料核讀'
  };
  context.showDetail(sample, null, false);
  const body = document.getElementById('detail-body');
  const latest = body.querySelector('.detail-source-latest');
  const source = body.querySelector('.detail-source');
  document.querySelector = selector => selector === '#detail[open]' ? document.getElementById('detail') : selector === '#detail-body' ? body : null;
  source.focus = () => { document.activeElement = source; };
  document.activeElement = latest;
  context.pinSourcePaths([sample.path], 'a'.repeat(40));
  context.refreshCurrentSourceLinks(sample.path);
  assert.equal(document.activeElement, source);
  assert.equal(latest.hidden, true);
  assert.match(source.href, /blob\/a{40}\/cases\/001-travel\.md$/);
});

test('detail header meta proof badge includes semantic role note and descriptive aria-label', () => {
  const { context, document } = setupDom();
  const sample = {
    id: 'UC-002',
    title: '代碼審查助手',
    path: 'cases/002-code.md',
    markdown: '# UC-002\n\n## 介紹\n這是測試內容。',
    scenario: '開發',
    proof: '作者報告／示範'
  };

  context.showDetail(sample, null, false);
  const detailBody = document.getElementById('detail-body');
  const metaBar = detailBody.querySelector('.detail-header-meta');
  const proofBadge = metaBar ? metaBar.querySelector('.proof-badge') : null;

  assert.ok(proofBadge, 'metaBar must include .proof-badge');
  assert.equal(proofBadge.getAttribute('role'), 'note', 'proof badge must have role note');
  assert.match(proofBadge.getAttribute('aria-label'), /來源憑據：作者報告／示範/, 'aria-label must include proof type and definition');
  assert.match(proofBadge.getAttribute('aria-label'), /尚未取得獨立代碼庫驗證/, 'aria-label must include proof definition warning');
});

test('related return remains distinct from the early scenario exploration action', () => {
  const { context } = setupDom();
  const sample = {
    id: 'UC-005',
    title: '長篇流程',
    path: 'cases/005-long.md',
    kind: 'case',
    scenario: '工作',
    category: '行政',
    proof: '官方自報'
  };
  const relatedEl = context.renderRelated(sample);
  const backBtn = relatedEl.querySelector('.related-back');
  const scenarioBtn = context.scenarioExploreAction(sample);
  assert.ok(backBtn);
  assert.equal(relatedEl.querySelector('.detail-action-scenario'), null, 'bottom section does not repeat the action');
  assert.match(scenarioBtn.textContent, /探索更多「工作」案例/);
  assert.equal(backBtn.textContent, '關閉並返回結果');
  assert.notEqual(backBtn.textContent, scenarioBtn.textContent);
});

test('reader.css provides distinct left border accents and responsive wrapping for detail navigation', () => {
  assert.match(readerCss, /\.reader-guidance-shortcut\s*\{[^}]*border-left:\s*3px solid var\(--green\)/, 'guidance shortcut must have primary green accent border');
  assert.match(readerCss, /\.reader-method-shortcut\s*\{[^}]*border-left:/, 'method shortcut must have distinct left border');
  assert.match(readerCss, /\.reader-original-open\s*\{[^}]*border-left:/, 'original research button must have distinct left border');
  assert.match(readerCss, /\.related-back\s*\{[^}]*min-height:\s*44px/, 'related-back button must satisfy 44px touch target');
  assert.match(readerCss, /\.related-back\s*\{[^}]*width:\s*100%/, 'related-back must be full width on mobile');
  assert.match(readerCss, /\.detail-proof-note\s*\{[^}]*flex-wrap:\s*wrap/, 'detail-proof-note must support wrapping');
});

test('hardened GitHub Actions workflows feature in-loop superseded-main checks and accurate error messages', () => {
  const workflowsDir = path.join(__dirname, '../.github/workflows');
  const recencyYml = fs.readFileSync(path.join(workflowsDir, 'recency-qa.yml'), 'utf8');
  const combinedYml = fs.readFileSync(path.join(workflowsDir, 'combined-recovery-qa.yml'), 'utf8');
  const roundYml = fs.readFileSync(path.join(workflowsDir, 'round-qa.yml'), 'utf8');
  const refinementYml = fs.readFileSync(path.join(workflowsDir, 'card-refinement-qa.yml'), 'utf8');
  const controlsYml = fs.readFileSync(path.join(workflowsDir, 'reader-controls-qa.yml'), 'utf8');

  // Verify in-loop superseded check
  for (const [name, yml] of Object.entries({ recencyYml, combinedYml, roundYml, refinementYml, controlsYml })) {
    assert.match(yml, /isCurrentMainCommit\(process\.env\.GITHUB_SHA\)/, `${name} must include isCurrentMainCommit`);
    assert.match(yml, /(attempt|i)\s*%\s*15\s*===\s*0/, `${name} must check superseded commit inside polling loop`);
  }

  // Verify accurate timeout messages
  assert.match(recencyYml, /within 25 minutes \(301 attempts\)/, 'recency-qa.yml must report 25 minutes / 301 attempts');
  assert.doesNotMatch(recencyYml, /within eight minutes/, 'recency-qa.yml must not contain obsolete eight minutes text');
  assert.match(combinedYml, /after 501 attempts/, 'combined-recovery-qa.yml must report 501 attempts');
  assert.match(recencyYml, /SKIP_PUBLISHED_BROWSER_CHECK superseded or unverifiable main commit/, 'recency-qa.yml must gate live browser step with freshness check');
});
