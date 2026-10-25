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
      addEventListener() {},
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

  const documentMock = {
    createElement,
    createTextNode(t) { return { tagName: '#text', textContent: String(t) }; },
    getElementById(id) {
      const el = createElement('div', id);
      el.attributes.id = id;
      return el;
    }
  };

  const context = vm.createContext({
    document: documentMock,
    window: { document: documentMock },
    console,
    URL,
    URLSearchParams,
    Discovery: require('../assets/discovery.js'),
    displayCopy: JSON.parse(fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8')),
    activeScenario: ''
  });

  vm.runInContext(appSource + '\nthis.api = { metadata, parseFile, filterEntries, tokenize, card, extractDifficulty, DIFFICULTY_LABELS, FILTER_LABELS };', context);
  return context.api;
}

test('index.html contains difficulty filter select with accessible labels', () => {
  assert.match(htmlSource, /<select\s+id="difficulty"/, 'index.html must have select#difficulty');
  assert.match(htmlSource, /name="difficulty"/, 'select#difficulty must have name="difficulty"');
  assert.match(htmlSource, /入門對話/, 'select#difficulty must have option for 入門對話');
  assert.match(htmlSource, /工具串接/, 'select#difficulty must have option for 工具串接');
  assert.match(htmlSource, /進階開發/, 'select#difficulty must have option for 進階開發');
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
