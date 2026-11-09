'use strict';
// A case page can declare more than one evidence class in its header
// (`official`（功能說明）＋`designed`（作者自擬、未實跑）). The filter and the
// counts still use one primary class, but the page must not present that class's
// claimant as if it were the only one. These checks hold the two halves together:
// the corpus label stays where it was, and every declared class is preserved.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];

const context = vm.createContext({
  URL,
  Discovery: require('../assets/discovery.js'),
  document: { createElement: () => ({ append() {}, setAttribute() {}, dataset: {} }), createTextNode: text => ({ textContent: text }) }
});
vm.runInContext(source + '\nthis.api={parseFile,declaredEvidenceClasses,declaredEvidenceClass,PROOF_DEFINITIONS,PROOF_CLAIMANTS,PROOF_STATUS_SHORT,PROOF_SAFE_ADOPTION_TIP,facetCounts};', context);
const api = context.api;

const files = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .concat('sources/pending.md');
const entries = files.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));
const byId = id => entries.find(entry => entry.id === id);
const evidenceLine = entry => (entry.markdown.match(/^-\s*(?:來源證據|證據狀態|證據等級|證據)\s*[：:]\s*(.+)$/m) || [])[1] || '';

test('the primary class keeps driving the filter, and every entry declares at least one class', () => {
  const drifted = entries
    .filter(entry => !entry.proofClasses.length || entry.proofClasses[0] !== entry.proof)
    .map(entry => `${entry.id}: proof=${entry.proof} classes=${entry.proofClasses.join('|')}`);
  assert.deepEqual(drifted, [], 'clause parsing must not move the label the counts are built on');
});

test('a declaration that joins classes with ＋ or ； keeps every class it names', () => {
  assert.deepEqual([...byId('UC-514').proofClasses], ['官方自報', '設計／未實跑'],
    'official feature text plus two authors’ unrun prompts is not an official claim about the outcome');
  assert.deepEqual([...byId('UC-014').proofClasses], ['作者報告／示範', '設計／未實跑']);
  assert.deepEqual([...byId('UC-072').proofClasses], ['作者報告／示範', '官方自報']);
  assert.deepEqual([...byId('UC-316').proofClasses], ['官方自報'],
    'a relayed official video plus a third-party write-up is still one official class, not two');
});

test('a passing or negated mention of a class does not become an attributed class', () => {
  const classes = line => [...api.declaredEvidenceClasses(line, 'case')];
  assert.deepEqual(classes('author-demo（作者實測）＋旁註提及模板，但模板不是本案證據'), ['作者報告／示範'],
    'a template mentioned as a side note is not a 模板／文件核讀 declaration');
  assert.deepEqual(classes('author-demo（作者實測）；另註 unverified 欄位尚未填'), ['作者報告／示範'],
    'an unverified field name is not a 尚待查證 declaration');
  assert.deepEqual(classes('`designed`（作者自行設計、未附執行結果）；作者稱參考官方文件'), ['設計／未實跑'],
    'designing a prompt is not an author execution record');
  assert.deepEqual(classes('unverified（待驗證）。作者已設定並描述行為，但尚未實測'), ['尚待查證'],
    'an unverified lead is not upgraded to an author report by its prose');
  assert.deepEqual(classes('author-demo（作者貼文）＋公開資料核讀（官方規格頁）'), ['作者報告／示範', '公開資料核讀'],
    'an explicitly named 公開資料核讀 clause is kept');
  assert.deepEqual(classes('`official`（功能文件已讀）＋`author-demo`（作者自述實測）'), ['作者報告／示範', '官方自報'],
    'explicit tokens are honoured inside a clause, primary first');
  // Real corpus fixtures: a public template page that the case only inspected
  // stays auxiliary material, and a designed-only prompt keeps one class.
  assert.deepEqual([...byId('UC-344').proofClasses], ['作者報告／示範'], 'UC-344 reads a template page as auxiliary');
  assert.deepEqual([...byId('UC-496').proofClasses], ['設計／未實跑'], 'UC-496 only designed a prompt');
});

test('a single-clause declaration does not gain invented classes', () => {
  assert.deepEqual([...api.declaredEvidenceClasses('author-demo（作者貼文＋截圖）', 'case')], ['作者報告／示範']);
  assert.deepEqual([...api.declaredEvidenceClasses('unverified', 'case')], ['尚待查證']);
  assert.deepEqual([...api.declaredEvidenceClasses('designed', 'case')], ['設計／未實跑']);
  assert.deepEqual([...api.declaredEvidenceClasses('', 'case')], ['公開資料核讀'],
    'an undeclared case keeps the existing fallback instead of gaining a class');
  assert.ok(entries.filter(entry => entry.proofClasses.length > 1).length >= 100,
    'the corpus still contains the mixed declarations this round made visible');
});

test('the 來源類型 facet counts each entry exactly once, under its primary class', () => {
  const values = [...new Set(entries.map(entry => entry.proof))];
  const counts = api.facetCounts(entries, [], {}, 'proof', values);
  assert.equal(counts.reduce((sum, n) => sum + n, 0), entries.length,
    'the filter still partitions the corpus, so a case is never counted twice');
  const mixed = entries.filter(entry => entry.proofClasses.length > 1);
  for (const entry of mixed.slice(0, 20)) {
    const index = values.indexOf(entry.proof);
    assert.ok(counts[index] >= 1, `${entry.id} is counted under its primary class`);
  }
});

test('every class the corpus declares has a definition, claimant, boundary and safety tip', () => {
  for (const entry of entries.filter(item => item.kind !== 'pending')) {
    for (const label of entry.proofClasses) {
      assert.ok(api.PROOF_DEFINITIONS[label], `${entry.id}: no definition for ${label}`);
      assert.ok(api.PROOF_CLAIMANTS[label], `${entry.id}: no claimant for ${label}`);
      assert.ok(api.PROOF_STATUS_SHORT[label], `${entry.id}: no short boundary for ${label}`);
      assert.ok(api.PROOF_SAFE_ADOPTION_TIP[label], `${entry.id}: no safety tip for ${label}`);
      assert.ok(evidenceLine(entry).replace(/`/g, '').length > 0 || label === '公開資料核讀',
        `${entry.id}: ${label} must come from a declaration, not from an empty line`);
    }
  }
});
