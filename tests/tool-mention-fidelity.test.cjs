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
  vm.runInContext(source + '\nthis.api={metadata,parseFile,TOOL_PATTERNS,withoutSourceUrls,withoutDisclaimedTools:typeof withoutDisclaimedTools==="function"?withoutDisclaimedTools:null};', context);
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
    for (const entry of api.parseFile(file, markdown)) {
      // Each entry is checked against its own slice: stripping the whole file would
      // let one pending lead's words vouch for another lead's tool.
      const text = (api.withoutDisclaimedTools || api.withoutSourceUrls)(entry.markdown || '');
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

test('disclaimers, deduplication contrasts, and relative case links do not produce tool tags', () => {
  const api = load();
  // Even without a `- 工具：` lead line, an affirmed tool sharing a comma-separated
  // sentence with a negated tool keeps the affirmed tool and drops the negated one.
  const lead = '# UC-901：測試\n\n- 網站標題：測試\n\n';
  const withDisclaimers = lead
    + '作者說不需要 Grok Bot，直接用 Muse 完成。\n\n'
    + '## 所需連接、權限與限制\n\n'
    + '- 本案只涉及 Meta Muse，不推定 Grok Bot 或 ChatGPT dots 有相同機制。\n'
    + '- 不同於 [UC-006](006-facebook-publication.md)：006 是讀 Facebook 成效再發文。\n\n'
    + '## 去重與版本紀錄\n\n'
    + '- 2026-11-14 新增。[UC-381](381-dots-daily-ai-brief-to-archived-news-page.md) 是 ChatGPT dots 每日簡報；[UC-061](061-dispatcher-bot-typed-commands-ledger.md) 由 Cursor 協作。\n';
  assert.deepEqual(Array.from([...api.parseFile('cases/901-test.md', withDisclaimers)][0].tools), ['Meta Muse']);
});

test('corpus cases with scope disclaimers or deduplication links list only tools actually used', () => {
  const api = load();
  const pages = corpus();
  const entry = id => {
    const page = pages.find(item => path.basename(item.file).startsWith(id + '-'));
    return [...api.parseFile(page.file, page.markdown)][0];
  };
  assert.deepEqual(Array.from(entry('526').tools), ['Meta Muse']);
  assert.deepEqual(Array.from(entry('527').tools), ['Meta Muse', 'GitHub']);
  assert.deepEqual(Array.from(entry('528').tools), ['Meta Muse']);
  assert.deepEqual(Array.from(entry('336').tools), ['Grok Bot']);
  assert.deepEqual(Array.from(entry('463').tools), ['Grok Bot']);
  assert.deepEqual(Array.from(entry('351').tools), ['Grok Bot', 'GitHub']);
  assert.deepEqual(Array.from(entry('353').tools), ['Grok Bot', 'GitHub']);
  assert.deepEqual(Array.from(entry('004').tools), ['Grok Bot', 'Notion']);
  // UC-519 declares ChatGPT dots and compares a brief trial of Muse; Grok Bot is only in the disclaimer.
  assert.deepEqual(Array.from(entry('519').tools), ['Meta Muse', 'ChatGPT dots']);

  // Every supported tool affirmed in a case's own `- 工具：` line must remain in entry.tools.
  const missingDeclared = [];
  for (const { file, markdown } of pages) {
    for (const item of api.parseFile(file, markdown)) {
      const cleanText = (api.withoutDisclaimedTools || api.withoutSourceUrls)(item.markdown || '');
      const lead = cleanText.split(/\n##\s+/)[0];
      const toolLine = lead.match(/^-\s*工具\s*[：:]\s*(.+)$/m)?.[1] || '';
      for (const [name, re] of api.TOOL_PATTERNS) {
        if (re.test(toolLine) && !item.tools.includes(name)) {
          missingDeclared.push(`${item.id} (${file}) declares ${name} in - 工具： but entry.tools=${JSON.stringify(item.tools)}`);
        }
      }
    }
  }
  assert.deepEqual(missingDeclared, []);
});

test('the 提及工具 facet still explains what it counts and excludes disclaimers', () => {
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  const toolHint = source.match(/function renderFacetCounts[\s\S]*?const toolHint\s*=\s*'([^']+)'/)?.[1] || '';
  assert.match(toolHint, /提及工具只看/, 'the facet hint must say where the tool list comes from');
  assert.match(toolHint, /不推定/, 'the facet hint itself must disclose that non-extrapolation disclaimers are excluded');
  assert.match(toolHint, /去重/, 'the facet hint itself must disclose that deduplication comparisons are excluded');
});
