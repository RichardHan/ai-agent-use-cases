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

function setupEnvironment() {
  const elements = new Map();
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
      close() { this.open = false; },
      click() { for (const listener of this.listeners.click || []) listener(); },
      append(...nodes) {
        for (const n of nodes) {
          if (typeof n === 'string') this.children.push({ tagName: '#text', textContent: n });
          else if (n) this.children.push(n);
        }
      },
      replaceChildren(...nodes) {
        this.children = [];
        this.append(...nodes);
      },
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k]; },
      addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
      querySelector(sel) {
        if (!sel) return null;
        const queue = [...this.children];
        while (queue.length) {
          const node = queue.shift();
          if (sel.startsWith('.') && node.className?.split(/\s+/).includes(sel.slice(1))) return node;
          if (sel.startsWith('#') && node.attributes?.id === sel.slice(1)) return node;
          if (node.tagName?.toLowerCase() === sel.toLowerCase()) return node;
          if (node.children) queue.push(...node.children);
        }
        return null;
      },
      querySelectorAll(sel) {
        const hits = [];
        const queue = [...this.children];
        while (queue.length) {
          const node = queue.shift();
          if (sel.startsWith('.') && node.className?.split(/\s+/).includes(sel.slice(1))) hits.push(node);
          else if (sel.startsWith('#') && node.attributes?.id === sel.slice(1)) hits.push(node);
          else if (node.tagName?.toLowerCase() === sel.toLowerCase()) hits.push(node);
          if (node.children) queue.push(...node.children);
        }
        return hits;
      }
    };
    return el;
  }

  const documentMock = {
    createElement,
    createTextNode(t) { return { tagName: '#text', textContent: String(t) }; },
    getElementById(id) {
      if (!elements.has(id)) {
        const node = createElement(id === 'detail' ? 'dialog' : 'div', id);
        node.attributes.id = id;
        elements.set(id, node);
      }
      return elements.get(id);
    },
    querySelector(sel) {
      if (sel.startsWith('#')) return documentMock.getElementById(sel.slice(1));
      return createElement('div', sel.replace(/^[#.]/, ''));
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    activeElement: null
  };

  const context = vm.createContext({
    document: documentMock,
    window: { document: documentMock },
    console,
    URL,
    Discovery: { scenarioOf: () => '' },
    activeScenario: '',
    crypto: { randomUUID: () => 'journey-test-uuid' },
    location: { href: 'https://example.test/ai-agent-use-cases/' },
    history: { state: null, pushState() {}, replaceState() {} },
    displayCopy: {},
    discoveryReady: true
  });

  vm.runInContext(appSource + '\nthis.api = { metadata, parseFile, filterEntries, tokenize, showDetail, card, extractDifficulty };', context);
  return { context, api: context.api, document: documentMock };
}

test('hero problem tags navigate to verified high-intent queries targeting #explore', () => {
  const hero = htmlSource.match(/<nav class="hero-problem-tags"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.ok(hero, 'index.html must contain hero-problem-tags');
  
  const problemLinks = [...hero.matchAll(/<a\b(?=[^>]*\bclass="[^"]*problem-tag[^"]*")(?=[^>]*\bhref="([^"]+)")[^>]*>([\s\S]*?)<\/a>/g)];
  assert.ok(problemLinks.length >= 6, 'hero must include at least 6 problem tags');
  
  for (const [, href, label] of problemLinks) {
    const parsedUrl = new URL(href, 'https://example.test/ai-agent-use-cases/');
    assert.ok(parsedUrl.searchParams.get('q'), `Problem tag "${label.trim()}" must have a non-empty query parameter`);
    assert.equal(parsedUrl.hash, '#explore', `Problem tag "${label.trim()}" must anchor jump to #explore`);
  }
  
  const prTag = problemLinks.find(([, , label]) => label.includes('代碼審查') || label.includes('PR'));
  assert.ok(prTag, 'hero must include PR / 代碼審查 problem tag');
  const prUrl = new URL(prTag[1], 'https://example.test/ai-agent-use-cases/');
  assert.equal(prUrl.searchParams.get('q'), 'PR', 'PR tag query must match browser suite contract');
});
test('code review query matches targeted cases while noisy PR query is avoided', () => {
  const { api } = setupEnvironment();
  const sampleCorpus = [
    api.metadata('# UC-101：PR 狀態自動檢查\n- 網站標題：自動檢查 PR\n- 核心目標：自動檢查 Pull Request 狀態\n- 標籤：代碼審查、PR\n\n## 建議流程\n1. 讀取 PR。\n\n## 限制\n無\n', 'cases/101.md', 'case'),
    api.metadata('# UC-102：日常生活旅遊\n- 網站標題：規劃旅遊\n- 核心目標：預訂酒店，詳見 https://github.com/org/repo/pull/123\n- 標籤：旅遊\n\n## 建議流程\n1. 查機票。\n\n## 限制\n無\n', 'cases/102.md', 'case')
  ];

  const codeReviewHits = api.filterEntries(sampleCorpus, api.tokenize('代碼審查'), {});
  assert.equal(codeReviewHits.length, 1, 'Query "代碼審查" should only match intentional code review cases');
  assert.equal(codeReviewHits[0].id, 'UC-101');
});

test('published-version.cjs provides at least 360 attempts (18 minutes) polling budget', () => {
  const publishedSource = fs.readFileSync(path.join(root, 'tests/published-version.cjs'), 'utf8');
  const pollMatch = publishedSource.match(/attempt\s*<\s*(\d+)/);
  assert.ok(pollMatch, 'published-version.cjs must contain bounded attempt loop');
  assert.ok(Number(pollMatch[1]) >= 360, `published-version.cjs should poll at least 360 attempts (got ${pollMatch[1]})`);
});
