'use strict';
// A case page's `##` headings are shared template labels. Before this check the
// full-text index could not tell them apart from prose, so 所需連接 matched 216 of
// 515 entries (no case writes that phrase) and the card quoted `## 權限、限制與驗收`
// back at the reader as if it were a sentence about permissions.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
const discoverySource = fs.readFileSync(path.join(root, 'assets/discovery.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(discoverySource + appSource + '\nthis.api={metadata,filterEntries,searchContext,tokenize,markdownSections,proseWithoutSectionHeadings,headingOnlyMatches};', context);
const {metadata, filterEntries, searchContext, tokenize, markdownSections, proseWithoutSectionHeadings, headingOnlyMatches} = context.api;

// A page shaped like the template: the label is shared, the section below it is this
// case's own prose.
const headingOnlyPage = `# UC-901：整理收件匣

- 情境：工作
- 一句話用途：把每日信件整理成待辦。

## 使用情境

每天早上讀取信箱。

## 所需連接、權限與限制

只讀取信件標題，不寄信、不刪除；需要 Google 帳號授權與一個排程時間。

## 可複製提示詞

整理今天的信件，列出三件要回覆的事。
`;
// The same word, but written in the case's own prose this time.
const prosePage = `# UC-902：權限盤點

- 情境：工作
- 一句話用途：定期盤點每個 Bot 拿到什麼權限。

## 使用情境

每季檢查一次，所需連接只有一張清單。

## 所需連接、權限與限制

僅讀取清單。
`;
const fencedPage = `# UC-903：示範提示詞

- 情境：開發
- 一句話用途：說明如何在程式碼註解裡放範例。

## 步驟

\`\`\`bash
## 權限與限制
echo hi
\`\`\`
`;

const items = [headingOnlyPage, prosePage, fencedPage].map((markdown, index) =>
  metadata(markdown, `cases/90${index + 1}-fixture.md`, 'case'));
const byId = id => items.find(item => item.id === id);

test('the indexed body drops section headings while the full-text index keeps them', () => {
  const page = byId('UC-901');
  assert.match(page.search, /所需連接/);
  assert.doesNotMatch(page.searchBody, /所需連接/, 'the shared label must not be counted as this case\'s prose');
  assert.match(page.searchBody, /只讀取信件標題/, 'the section content stays searchable');
  assert.match(page.searchBody, /整理收件匣/, 'declared fields stay in the body index');
  // 提示詞 is only this page's section label, so it stops explaining a prose hit
  // while the full-text index still reaches the page through its heading.
  assert.match(page.search, /可複製提示詞/);
  assert.doesNotMatch(page.searchBody, /提示詞/);
});

test('the body scope filters on prose and keeps a body mention', () => {
  const terms = tokenize('所需連接');
  assert.deepEqual(filterEntries(items, terms, {}).map(item => item.id), ['UC-901', 'UC-902']);
  assert.deepEqual(filterEntries(items, terms, {scope: 'body'}).map(item => item.id), ['UC-902'],
    'the prose mention survives; the shared label alone does not');
});

test('a heading match is reported as a section label with the section opening, never as prose', () => {
  const context_ = searchContext(byId('UC-901'), tokenize('所需連接'));
  assert.equal(context_.matches.length, 1);
  const [match] = context_.matches;
  assert.equal(match.label, '章節標題「所需連接、權限與限制」');
  assert.equal(match.caution, 'heading');
  assert.match(match.excerpt, /只讀取信件標題/, 'the excerpt is the section\'s own content');
  assert.doesNotMatch(match.excerpt, /所需連接、權限與限制/, 'the label is not quoted back as content');
});

test('a word that is in the case prose keeps the original explanation', () => {
  const context_ = searchContext(byId('UC-902'), tokenize('所需連接'));
  const [match] = context_.matches;
  assert.match(match.label, /^原文 · 使用情境$/, 'the prose line explains the hit, not the label below it');
  assert.notEqual(match.caution, 'heading');
});

test('a heading is not invented from a fenced example, and its word stays prose', () => {
  const page = byId('UC-903');
  assert.deepEqual(markdownSections(page.markdown).map(section => section.name).includes('權限與限制'), false);
  const context_ = searchContext(page, tokenize('權限'));
  const [match] = context_.matches;
  assert.match(match.label, /^原文 · /);
  assert.notEqual(match.caution, 'heading');
});

test('an empty section is still disclosed as a label-only hit', () => {
  const emptyPage = metadata(`# UC-904：空章節

- 情境：工作
- 一句話用途：示範空章節。

## 所需連接、權限與限制

## 驗收與可重現性

沒有。
`, 'cases/904-fixture.md', 'case');
  const context_ = searchContext(emptyPage, tokenize('所需連接'));
  const [match] = context_.matches;
  assert.equal(match.caution, 'headingEmpty');
  assert.equal(match.excerpt, '');
});


test('a case that matches a declared field counts as text, not as a section label', () => {
  const page = metadata(`# UC-905：權限儀表板

- 情境：工作
- 分類：權限盤點
- 一句話用途：整理清單。

## 步驟

只讀取清單。
`, 'cases/905-fixture.md', 'case');
  const terms = tokenize('權限');
  assert.equal(filterEntries([page], terms, {}).length, 1);
  assert.equal(filterEntries([page], terms, {scope: 'body'}).length, 1, 'the declared 分類 is part of the text index');
});

test('a multi-word query is split per case: one word in prose, one only in a heading', () => {
  // The sentence the results line prints says these cases need the heading to
  // match; it must not claim that every word is a label.
  const mixed = metadata(`# UC-906：AI 家庭助理

- 情境：生活
- 一句話用途：用 AI 整理家務。

## 使用情境

請 AI 安排打掃順序。

## 所需連接、權限與限制

只讀取行事曆。
`, 'cases/906-fixture.md', 'case');
  const proseOnly = metadata(`# UC-907：AI 權限說明

- 情境：工作
- 一句話用途：說明 AI 需要哪些權限。

## 使用情境

權限分三級。
`, 'cases/907-fixture.md', 'case');
  const terms = tokenize('AI 權限');
  const all = filterEntries([mixed, proseOnly], terms, {});
  assert.deepEqual(all.map(item => item.id), ['UC-906', 'UC-907']);
  const headingDependent = context.api.headingOnlyMatches(all, terms, {});
  assert.deepEqual(headingDependent.map(item => item.id), ['UC-906'],
    'only the case that needs the heading is reported as heading-dependent');
  assert.equal(filterEntries(all, terms, {scope: 'body'}).length, 1);
});

test('the heading-free copy keeps fenced code intact', () => {
  assert.match(proseWithoutSectionHeadings(fencedPage), /## 權限與限制/);
  assert.doesNotMatch(proseWithoutSectionHeadings(fencedPage), /^## 步驟$/m);
});
