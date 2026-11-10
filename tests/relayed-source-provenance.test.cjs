'use strict';
// A case page can declare an official feature, demo or video while also stating
// that the official original reached the library through someone else. These
// checks hold three things together: the clause rules do not read across `＋`,
// the acquisition route is exposed as data, and the rendered card keeps the
// filter label while saying how the library obtained the material.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];

function createElement(tag, className = '', textContent = '') {
  return {
    tagName: String(tag).toUpperCase(),
    className,
    textContent,
    children: [],
    dataset: {},
    attributes: {},
    append(...nodes) {
      for (const node of nodes) if (node) this.children.push(node);
    },
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    focus() {},
    scrollIntoView() {},
    setAttribute(key, value) { this.attributes[key] = String(value); },
    getAttribute(key) { return this.attributes[key] ?? null; }
  };
}
const context = vm.createContext({
  URL,
  Discovery: require('../assets/discovery.js'),
  document: {
    createElement,
    createTextNode: text => ({ textContent: String(text) }),
    getElementById: () => createElement('div')
  }
});
vm.runInContext(source + '\nthis.api={parseFile,declaredEvidenceClasses,declaredEvidenceClass,relayedEvidenceClasses,facetCounts,proofBadges,declaredClassList,PROOF_PROVENANCE,card,copyNoteText};', context);
const api = context.api;

const files = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .concat('sources/pending.md');
const entries = files.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));
const byId = id => entries.find(entry => entry.id === id);

test('a class rule must not borrow a word from another declared clause', () => {
  const line = 'dots官方轉述＋Grok Bot作者自報與後續錯誤；未獨立實測';
  assert.equal(api.declaredEvidenceClass(line, 'case'), '作者報告／示範',
    '官方 in the first clause must not pair with 自報 from the second clause');
  assert.deepEqual([...api.declaredEvidenceClasses(line, 'case')], ['作者報告／示範'],
    '官方轉述 names who relayed the experience, not a first-party official claim');
  assert.deepEqual([...byId('UC-024').proofClasses], ['作者報告／示範'],
    'UC-024 states 官方轉述早期使用者經驗, so it is not counted as an official self-report');
  // The anchored grade notation still wins; splitting it would lose the vendor claim.
  assert.equal(api.declaredEvidenceClass('V＋B，服務商員工的實際使用自述與公開截圖；有推廣利益。', 'case'), '官方自報');
  assert.equal(byId('UC-328').proof, '官方自報');
  // A first-party declaration on its own line keeps its label.
  assert.equal(api.declaredEvidenceClass('官方自報內部實作；有操作例與畫面，非第三方審計。本次只核讀，未重現。', 'case'), '官方自報');
});

test('a relayed declaration is exposed as data, and a later source is not', () => {
  assert.deepEqual([...api.relayedEvidenceClasses('official（Spaces 功能與官方作例，經來源轉述）＋designed（兩位作者自擬）')], ['官方自報']);
  assert.deepEqual([...api.relayedEvidenceClasses('official（廠商工作坊示範與官方影片說明；Team Bots 官方文件已讀）。本庫未觀看影片，流程細節來自影片說明欄的官方章節與第三方文字整理；未獨立重現。')], ['官方自報']);
  // The relay note belongs to another source in these pages, so the official
  // class was read first-hand and must not carry the qualifier.
  assert.deepEqual([...api.relayedEvidenceClasses('author-demo（作者自述）＋official（Grok Bot 雲端電腦文件）；本庫流程為 designed；2026-10-19 快照回滾事件為二手轉述 unverified')], []);
  assert.deepEqual([...api.relayedEvidenceClasses('official（官方文件已讀）＋author-demo（作者影片，本庫未觀看影片）')], [],
    'the next clause names another source, so its relay note must not qualify the official class');
  assert.deepEqual([...api.relayedEvidenceClasses('作者測試自述＋官方模板及費用文件；本庫未撥打；Bland 官方文件。原影片未看、本庫未撥打或獨立重現。')], []);
  assert.deepEqual([...api.relayedEvidenceClasses('official（官方部落格自述內部使用案例；數字為官方自報，未獨立查核）')], [],
    'reading the official page directly is not a relayed declaration');

  const relayed = entries.filter(entry => entry.relayedProof.length).map(entry => entry.id);
  assert.deepEqual(relayed.map(id => String(id)).sort(), ['UC-049', 'UC-093', 'UC-282', 'UC-316', 'UC-514'],
    'the pages that state the relay carry the qualifier, the others do not');
  assert.deepEqual([...byId('UC-316').relayedProof], ['官方自報']);
  assert.deepEqual([...byId('UC-514').relayedProof], ['官方自報']);
  assert.deepEqual([...byId('UC-007').relayedProof], [], 'a directly read official page stays unqualified');
});

test('an author claim read through someone else is qualified, a first-hand read is not', () => {
  // The three author pages whose own header says the experience came through an
  // interview summary or a fan-account retelling of a video.
  assert.deepEqual([...api.relayedEvidenceClasses('author-demo（經 ChatGPT Pro Community 訪談轉述）。無操作錄影；未核特定診所系統。')], ['作者報告／示範']);
  assert.deepEqual([...api.relayedEvidenceClasses('`author-demo`（X 上的作者自述、影片轉述與跨產品比較）＋ `designed`（本庫提示詞）')], ['作者報告／示範']);
  assert.deepEqual([...api.relayedEvidenceClasses('`author-self-report`（Greg Isenberg 訪談影片的轉載摘要頁）；影片逐字稿本庫未看，列為缺口；建議流程為 `designed`')], ['作者報告／示範']);
  for (const id of ['UC-049', 'UC-093', 'UC-282'])
    assert.deepEqual([...byId(id).relayedProof], ['作者報告／示範'], id + ' carries the author relay qualifier');

  // A skipped video beside a post the library did read is a gap, not a relay.
  assert.deepEqual([...api.relayedEvidenceClasses('`author-demo`（兩位作者自述實測；來源A 兩則貼文各附影片，本庫只看影片縮圖未播放；來源B 一則貼文＋一張成品圖）；本庫提示詞為 `designed`')], [],
    'a video the library skipped does not turn its post into a retelling');
  assert.deepEqual([...api.relayedEvidenceClasses('`author-demo`（作者自述實測），原作者貼文＋一張流程示意插圖（非實際畫面）；另一位轉述者明說自己未做再現測試。')], [],
    'a later sentence about another person must not qualify the author clause');
  assert.deepEqual([...api.relayedEvidenceClasses('B，作者實際診斷自述；客服認同亦為作者轉述，沒有修後驗收。')], [],
    'the vendor agreeing through the author is stated inside the claim, not about acquisition');
  assert.deepEqual([...api.relayedEvidenceClasses('`author-demo`（Muse 作者使用自述，貼文由 Muse 協助撰寫；Grok Bot 作者自述＋對話截圖）＋`official`（Grok Bot 雲端電腦文件）')], [],
    'writing help is not relayed acquisition');
  for (const id of ['UC-295', 'UC-368', 'UC-459', 'UC-512'])
    assert.deepEqual([...byId(id).relayedProof], [], id + ' read the author post itself, so no acquisition qualifier');
});

test('the card keeps the filter label and states the acquisition route', () => {
  const relayed = api.card(byId('UC-514'), []);
  const bottom = relayed.children.find(child => child.className === 'card-bottom');
  const badge = bottom.children.find(child => child.className === 'proof');
  assert.equal(badge.textContent, '官方自報', 'the visible label stays the filter value');
  assert.equal(badge.dataset.proofProvenance, 'relayed');
  assert.match(badge.getAttribute('aria-label'), /官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文/);
  assert.match(badge.title, /官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文/);
  const officialMark = bottom.children.find(child => child.className === 'proof-relayed');
  assert.equal(officialMark.textContent, '取得：經轉述');
  assert.equal(officialMark.getAttribute('aria-label'), '取得方式：官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文');

  // An author claim read through a retelling says so too, with its own wording.
  const author = api.card(byId('UC-282'), []);
  const authorBottom = author.children.find(child => child.className === 'card-bottom');
  assert.equal(authorBottom.children.find(child => child.className === 'proof').textContent, '作者報告／示範');
  const authorMark = authorBottom.children.find(child => child.className === 'proof-relayed');
  assert.ok(authorMark, 'the author relay gets a visible marker on the card');
  assert.match(authorMark.getAttribute('aria-label'), /作者內容經第三人轉述或僅讀摘要整理，本庫未取得作者原文/);

  const direct = api.card(byId('UC-007'), []);
  const directBottom = direct.children.find(child => child.className === 'card-bottom');
  const directBadge = directBottom.children.find(child => child.className === 'proof');
  assert.equal(directBadge.dataset.proofProvenance, undefined);
  assert.doesNotMatch(directBadge.getAttribute('aria-label'), /未完整核讀官方原文/);
  assert.equal(directBottom.children.filter(child => child.className === 'proof-relayed').length, 0,
    'a first-hand read gets no acquisition marker');
  assert.equal(api.card(byId('UC-093'), []).children.find(child => child.className === 'card-bottom')
    .children.find(child => child.className === 'proof-relayed').textContent, '取得：經轉述',
  'the marker does not claim a class the page did not declare');
});

test('the detail chips keep the label and add the acquisition route', () => {
  const item = byId('UC-514');
  const chips = api.proofBadges(item);
  assert.deepEqual(Array.from(chips, chip => chip.textContent), ['官方自報', '設計／未實跑']);
  assert.equal(chips[0].dataset.proofProvenance, 'relayed');
  assert.match(chips[0].getAttribute('aria-label'), /來源憑據（主要）：官方自報，官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文。/);
  assert.doesNotMatch(chips[1].getAttribute('aria-label'), /未完整核讀官方原文/);

  const classList = api.declaredClassList(item);
  const first = classList.children.find(child => child.className === 'proof-note-class-list').children[0];
  assert.match(first.children[1].textContent, /官方團隊／原廠自述（官方內容經第三人轉述）/);
});

test('the copied note and the related row repeat the acquisition route', () => {
  const relayed = api.copyNoteText(byId('UC-282'), 'https://example.test/?case=UC-282');
  assert.match(relayed, /📎 來源證據：.*（作者內容經第三人轉述或僅讀摘要整理，本庫未取得作者原文）/);
  const direct = api.copyNoteText(byId('UC-007'), 'https://example.test/?case=UC-007');
  assert.doesNotMatch(direct, /經第三人轉述/, 'a first-hand read does not gain a qualifier in the copied note');
  const official = api.copyNoteText(byId('UC-514'), 'https://example.test/?case=UC-514');
  assert.match(official, /官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文/);
});

test('the evidence facet counts one class per entry after the reclassification', () => {
  const values = [...new Set(entries.map(entry => entry.proof))];
  const counts = api.facetCounts(entries, [], {}, 'proof', values);
  assert.equal(counts.reduce((sum, n) => sum + n, 0), entries.length);
  const official = entries.filter(entry => entry.proof === '官方自報').map(entry => entry.id);
  assert.equal(counts[values.indexOf('官方自報')], official.length);
  assert.ok(!official.includes('UC-024'), 'UC-024 is counted under its author claim, not the official one');
  assert.ok(official.includes('UC-316'), 'a relayed official claim is still an official claim');
});

test('copy for a resolved lead does not describe it as still being sought', () => {
  const copy = JSON.parse(fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'));
  for (const item of entries.filter(entry => entry.kind === 'pending' && entry.resolved)) {
    const text = [copy[item.id]?.how || '', copy[item.id]?.caution || ''].join(' ');
    assert.doesNotMatch(text, /目前先查|只有作者留言/,
      `${item.id}: ${item.mergedInto} already holds the result, so the card copy must not ask to keep searching`);
  }
});
