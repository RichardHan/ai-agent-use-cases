'use strict';
// 「提及工具」是卡片第一行印出來的字，也是 `?tool=` 篩選與選項筆數的唯一來源。
// 它先前對**整份 markdown**比對工具樣式，於是來源連結的網址也被算成案例提到的工具：
// `https://github.com/gdombiak/AstroViewingConditions/...` 讓 UC-210 掛上 GitHub，
// 而該頁自己的 `- 工具：` 寫的是 Grok Bot／Astronomer／Astro Engine／Python Host；
// `https://cursor.com/docs/...` 讓 042 掛上 Cursor。
//
// 本庫對搜尋索引早有同一條規則（`withoutSourceUrls()`：來源網址是證據，不是內容），
// 只是工具沒有套用。這支測試把規則固定在語料上，避免下一批研究再把網域當成工具。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

class Node {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.textContent = ''; }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this[name] = value; }
}

function load() {
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: { createElement: tag => new Node(tag), createTextNode: text => ({ textContent: text }) }
  });
  vm.runInContext(source + '\nthis.api={metadata,parseFile,TOOL_PATTERNS,withoutSourceUrls};', context);
  vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);
  return context.api;
}

const corpus = () => ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .map(file => ({ file, markdown: fs.readFileSync(path.join(root, file), 'utf8') }))
  .concat([{ file: 'sources/pending.md', markdown: fs.readFileSync(path.join(root, 'sources/pending.md'), 'utf8') }]);

test('a tool listed on a card is mentioned by the page itself, not only by a source address', () => {
  const api = load();
  const offenders = [];
  for (const { file, markdown } of corpus()) {
    const text = api.withoutSourceUrls(markdown);
    for (const entry of api.parseFile(file, markdown)) {
      for (const tool of entry.tools || []) {
        const pattern = api.TOOL_PATTERNS.find(([name]) => name === tool)?.[1];
        assert.ok(pattern, `${tool} must come from TOOL_PATTERNS`);
        if (!pattern.test(text)) offenders.push(`${entry.id} (${file}) lists ${tool} but its prose only links to it`);
      }
    }
  }
  assert.deepEqual(offenders, [], offenders.slice(0, 6).join('\n'));
});

test('a source address alone does not produce a tool, a sentence about the tool does', () => {
  const api = load();
  const lead = '# UC-900：測試\n\n- 網站標題：測試\n\n';
  const addressOnly = lead + '- [實作紀錄](https://github.com/example/repo/blob/main/README.md)：已讀。\n';
  const prose = lead + '作者用 GitHub Actions 跑測試，並貼上 https://github.com/example/repo 的結果。\n';
  assert.deepEqual(Array.from([...api.parseFile('cases/900-test.md', addressOnly)][0].tools), []);
  assert.deepEqual(Array.from([...api.parseFile('cases/900-test.md', prose)][0].tools), ['GitHub']);
});

test('cases whose only GitHub contact is a link to their own research repository', () => {
  const api = load();
  const pages = corpus();
  const entry = id => {
    const page = pages.find(item => path.basename(item.file).startsWith(id + '-'));
    return [...api.parseFile(page.file, page.markdown)][0];
  };
  // UC-210 declares Grok Bot／Astronomer／Astro Engine／Python Host; GitHub is where
  // the author's repository lives, which is evidence for the case, not a tool it uses.
  assert.deepEqual(Array.from(entry('210').tools), ['Grok Bot']);
  // UC-004 declares Grok Bot、X、Notion and only links to GitHub. Other tools it
  // discusses stay listed: this facet counts mentions, not the declared shortlist.
  assert.ok(!Array.from(entry('004').tools).includes('GitHub'));
  // UC-005 really does declare and discuss GitHub, so the filter must keep it.
  assert.ok(Array.from(entry('005').tools).includes('GitHub'));
});

test('the 提及工具 facet still explains what it counts', () => {
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  assert.match(source, /function renderFacetCounts/);
  assert.match(source, /提及工具只看/, 'the facet hint must say where the tool list comes from');
});
