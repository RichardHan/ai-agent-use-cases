'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');

const appSource = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8')
  .split('/* Browser event bindings. */')[0];
const cssSource = fs.readFileSync(path.join(__dirname, '../assets/style.css'), 'utf8');

function setupDom() {
  function createElement(tag, className = '') {
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
      textContent: '',
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
      querySelector(sel) {
        if (sel === '.proof') {
          return el.children.find(c => c.className?.includes('proof')) ||
                 el.children.flatMap(c => c.children || []).find(c => c.className?.includes('proof'));
        }
        if (sel === '.card-bottom button' || sel === 'button') {
          const bottom = el.children.find(c => c.className?.includes('card-bottom'));
          return bottom?.children?.find(c => c.tagName === 'BUTTON') ||
                 el.children.find(c => c.tagName === 'BUTTON');
        }
        if (sel === '.detail-badge.proof-badge') {
          return el.children.flatMap(c => c.children || []).find(c => c.className?.includes('proof-badge'));
        }
        return null;
      },
      addEventListener() {}
    };
    return el;
  }

  const documentMock = {
    createElement,
    createTextNode(t) { return { tagName: '#text', textContent: String(t) }; },
    getElementById(id) { return createElement('div', id); }
  };

  const context = vm.createContext({
    document: documentMock,
    window: { document: documentMock },
    console,
    activeScenario: '',
    crypto: { randomUUID: () => 'test-uuid' },
    location: { href: 'http://localhost/ai-agent-use-cases/' },
    history: { pushState() {}, replaceState() {}, state: null }
  });

  vm.runInContext(appSource, context);
  return context;
}

test('card renders with proof data-attribute and badge on article and span.proof', () => {
  const context = setupDom();
  const sample = {
    id: 'UC-001',
    title: '規劃旅行，先把交通和住宿比清楚',
    what: '把日期、預算與需求交給 AI，整理幾組可比較的旅行方案。',
    summary: '把日期、預算與需求交給 AI，整理幾組可比較的旅行方案。',
    kind: 'case',
    scenario: '生活',
    proof: '作者報告／示範',
    tools: ['Grok Bot'],
    tags: ['旅遊', '比價'],
    reviewedDate: '2026-10-15'
  };

  const cardNode = context.card(sample);
  assert.equal(cardNode.dataset.caseId, 'UC-001');
  assert.equal(cardNode.dataset.kind, 'case');
  assert.equal(cardNode.dataset.proof, '作者報告／示範');

  const proofSpan = cardNode.querySelector('.proof');
  assert.ok(proofSpan, 'card must contain .proof span');
  assert.equal(proofSpan.textContent, '作者報告／示範');
  assert.equal(proofSpan.dataset.proof, '作者報告／示範');

  const readBtn = cardNode.querySelector('.card-bottom button');
  assert.ok(readBtn, 'card must contain button in .card-bottom');
  assert.equal(readBtn.textContent, '看看怎麼用 →');
});

test('card handles all 5 proof types consistently without throwing', () => {
  const context = setupDom();
  const types = ['作者報告／示範', '官方自報', '公開資料核讀', '尚待查證', '模板／文件核讀'];

  for (const proof of types) {
    const item = {
      id: 'UC-999',
      title: '測試案例',
      summary: '測試用途說明',
      kind: proof === '尚待查證' ? 'pending' : 'case',
      scenario: '工作',
      proof,
      tools: [],
      tags: []
    };
    const node = context.card(item);
    assert.equal(node.dataset.proof, proof);
    const proofSpan = node.querySelector('.proof');
    assert.equal(proofSpan.textContent, proof);
    assert.equal(proofSpan.dataset.proof, proof);
  }
});

test('assets/style.css defines evidence proof badge rules for all types and plain-overview', () => {
  assert.match(cssSource, /\.card-bottom \.proof/, 'style.css must style .card-bottom .proof');
  assert.match(cssSource, /data-proof="官方自報"/, 'style.css must handle 官方自報');
  assert.match(cssSource, /data-proof="作者報告／示範"/, 'style.css must handle 作者報告／示範');
  assert.match(cssSource, /data-proof="公開資料核讀"/, 'style.css must handle 公開資料核讀');
  assert.match(cssSource, /data-proof="尚待查證"/, 'style.css must handle 尚待查證');
  assert.match(cssSource, /data-proof="模板／文件核讀"/, 'style.css must handle 模板／文件核讀');
  assert.match(cssSource, /\.detail-badge\.proof-badge/, 'style.css must style detail-badge proof-badge');
  assert.match(cssSource, /\.plain-overview/, 'style.css must style plain-overview');
});
