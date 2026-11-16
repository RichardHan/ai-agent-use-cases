'use strict';
// A page can say it is a version of another case without a merge verb:
//   UC-322 「嚴格去重視為UC-048的數值追蹤版本，本頁保留但不另計」
//   UC-336 「既有239流程版本，本輪不另計」
// The library counts such a page as a supplement of the main case: still
// searchable and readable, never an independent draw, and never reworded into a
// merge it did not declare. These tests hold the parser to that rule and make sure
// a declaration cannot drift out of the catalog silently.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const casesDir = path.join(root, 'cases');

function loadApi() {
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: {
      createElement: () => ({
        className: '', textContent: '', children: [], dataset: {},
        append() {}, setAttribute() {}, addEventListener() {},
        replaceChildren() {}, querySelector() { return null; }
      }),
      createTextNode: text => ({ textContent: String(text) })
    }
  });
  vm.runInContext(source + '\nthis.api={parseFile,filterEntries,tokenize,mergeHandoffSentence,declaredVariantDestinations,copyNoteText};', context);
  vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);
  return context.api;
}

const api = loadApi();
const caseFiles = fs.readdirSync(casesDir).filter(name => name.endsWith('.md')).sort();
const cases = caseFiles.flatMap(file =>
  Array.from(api.parseFile('cases/' + file, fs.readFileSync(path.join(casesDir, file), 'utf8'))));
const byId = new Map(cases.map(item => [item.id, item]));
const proofLineOf = item => (item.markdown.match(/^-\s*(?:來源證據|證據狀態|證據等級|證據)\s*[：:]\s*(.+)$/m) || [])[1] || '';

function fixture(proof, body = '') {
  return `# UC-999：fixture\n\n- 證據狀態：author-demo。${proof}\n- 是否獨立重現：否\n\n## 段落\n\n${body}\n`;
}
const parse = markdown => api.parseFile('cases/999-fixture.md', markdown)[0];

test('a declared version of another case is read as that case’s supplement', () => {
  const declarations = [
    ['嚴格去重視為 UC-048 的數值追蹤版本，本頁保留但不另計。', 'UC-048'],
    ['既有239流程版本，本輪不另計；前批紀錄保留。', 'UC-239'],
    ['既有050流程版本，本輪不另計。', 'UC-050'],
    ['這是同一流程的版本，不另立案，對應 UC-212。', 'UC-212']
  ];
  for (const [proof, expected] of declarations) {
    const item = parse(fixture(proof));
    assert.deepEqual([...item.mergedInto], [expected], `「${proof}」 must point at ${expected}`);
    assert.equal(item.mergedKind, 'variant', `「${proof}」 is a declared version, not a merge`);
  }
});

test('a merge and a version are worded differently and keep their destinations', () => {
  const merged = parse(fixture('已併入 UC-156，不另計入 1,000 案目標（保留供搜尋與閱讀）'));
  assert.deepEqual([...merged.mergedInto], ['UC-156']);
  assert.equal(merged.mergedKind, 'merged');
  assert.match(api.mergeHandoffSentence(merged), /已合併至 UC-156/, 'an explicit merge keeps the merge wording');

  const variant = parse(fixture('視為 UC-048 的數值追蹤版本，本頁保留但不另計。'));
  assert.match(api.mergeHandoffSentence(variant), /與主案例 UC-048 屬同一流程的版本頁/);
  assert.doesNotMatch(api.mergeHandoffSentence(variant), /已合併至/, 'a version page is not rewritten into a merge');
});

test('a copied note carries the same version-page status as the detail', () => {
  const variant = parse(fixture('視為 UC-048 的數值追蹤版本，本頁保留但不另計。'));
  assert.match(api.copyNoteText(variant, 'https://example.test/?case=UC-999'),
    /同一流程的版本頁，不另計一案/, 'a copied variant note must not read as an independent case');
  assert.doesNotMatch(api.copyNoteText(variant, 'https://example.test/?case=UC-999'), /已合併至/);

  const merged = parse(fixture('已併入 UC-156，不另計入 1,000 案目標（保留供搜尋與閱讀）'));
  assert.match(api.copyNoteText(merged, 'https://example.test/?case=UC-999'), /已合併至 UC-156/);
});

test('the declaration needs 不另計 and a case reference', () => {
  // `1,000 案目標` must not turn into UC-000.
  const targetOnly = parse(fixture('本頁保留但不另計入 1,000 案目標。'));
  assert.deepEqual([...targetOnly.mergedInto], [], 'a target phrase is not a case id');
  // A mention without the not-counted sentence is not a declaration.
  assert.deepEqual([...parse(fixture('與 UC-005 的分工不同，本頁保留。')).mergedInto], []);
  // The page cannot be its own destination.
  assert.deepEqual([...parse(fixture('視為 UC-999 的版本，不另計。')).mergedInto], []);
  // Body prose is not the page's own declaration line.
  const body = parse(fixture('author-demo。', '這一節補充另一個流程，不另計 UC-123 版本。'));
  assert.deepEqual([...body.mergedInto], [], 'a body sentence is not a front-matter declaration');
});

test('every declaration in the corpus reaches the item it names', () => {
  for (const item of cases) {
    const declared = api.declaredVariantDestinations(proofLineOf(item), item.id);
    for (const id of declared) {
      assert.ok(item.mergedInto.includes(id), `${item.id} declares ${id} but the catalog does not record it`);
      assert.ok(byId.has(id), `${item.id} names ${id}, which must be a real case page`);
    }
    assert.ok(!item.mergedInto.includes(item.id), `${item.id} must not merge into itself`);
  }
});

test('variant pages stay searchable but are not drawn as independent cases', () => {
  const all = fs.readdirSync(casesDir).filter(name => name.endsWith('.md'))
    .flatMap(file => Array.from(api.parseFile('cases/' + file, fs.readFileSync(path.join(casesDir, file), 'utf8'))));
  const pool = require('../assets/discovery.js').discoveryPool(all);
  const merged = all.filter(item => item.mergedInto.length);
  assert.ok(merged.length >= 5, 'the corpus still declares merged and variant pages');
  for (const item of merged) {
    assert.ok(!pool.some(candidate => candidate.id === item.id), `${item.id} must not be drawable`);
    assert.equal(api.filterEntries([item], api.tokenize(item.id), {}).length, 1,
      `${item.id} must remain searchable by its id`);
  }
});
