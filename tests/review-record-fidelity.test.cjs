'use strict';
// A case page carries two kinds of record about its own review: the declared lead
// field the site reads (查證日期／本次增補查證), and the dated section headings the
// research batches append when they add a source (`## 2026-11-05 08:53補充：…`).
// The site deliberately reads only the lead, so a page that appends a section and
// never updates the lead keeps an older 「頁首核對」 than its own text, and
// `?sort=reviewed` files it behind pages that are older than it.
//
// On 2026-11-11 that was 98 of 511 case pages (42 of them ≥7 days stale, worst
// `cases/026-…`: badge 2026-10-13, section 2026-11-05, rank 508/518). This test is
// the rule that keeps the next batch from reopening the gap: whenever a page writes
// a dated section newer than its declared review, the lead must say so too.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

class Node {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.textContent = '';
  }
  append(...children) {
    this.children.push(...children);
  }
  setAttribute(name, value) {
    this[name] = value;
  }
}

function load() {
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: { createElement: tag => new Node(tag), createTextNode: text => ({ textContent: text }) }
  });
  vm.runInContext(
    fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0]
      + '\nthis.api={parseFile,reviewDate};',
    context
  );
  return context.api;
}

// The corpus convention this rule is about, read literally:
//   1) a level 2–4 heading that starts with an ISO date, or carries a parenthetical
//      review/supplement date (`## …（2026-10-16核讀）`, `## 補充：…（2026-10-22 11:42，台灣）`);
//   2) a dated version/merge log item or availability re-check (`- 2026-11-03 09:00 併入…`,
//      `- 目前可用性（2026-10-25）：…`, `於 2026-11-09 查核回 404`).
// Fenced examples and source publication dates are not library review records.
function datedReviewSections(markdown) {
  const sections = [];
  let fenced = false;
  for (const line of String(markdown).split('\n')) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const match = line.match(/^(#{2,4})\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?\s*(.+)$/)
      || line.match(/^(#{2,4})\s*(.+?[（(][^）)\n]*?\b(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?(?:\s*(?:補充?|核讀|查閱|查證|覆核|補核|補證)|[，,]\s*台灣(?:時間)?)[^）)\n]*[）)].*)$/);
    if (match) {
      const isLeading = /^\d{4}-\d{2}-\d{2}$/.test(match[2]);
      const date = isLeading ? match[2] : match[3];
      const time = (isLeading ? match[3] : match[4]) || '';
      const label = (isLeading ? match[4] : match[2]).trim();
      const parsed = new Date(date + 'T00:00:00Z');
      if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date) {
        sections.push({ date, time, label });
      }
      continue;
    }
    const recordMatch = line.match(/^-\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?(?:（[^）]*）)?\s*[：:\s]\s*((?:併入|補|重讀|新增)[^\n]+)$/)
      || line.match(/^-\s*目前可用性[（(](\d{4}-\d{2}-\d{2})[）)][：:]\s*()(.+)$/)
      || line.match(/(?:於\s*|；)(\d{4}-\d{2}-\d{2})()\s*((?:查核回\s*404|已讀主文|讀正文)[^\n]*)/);
    if (recordMatch) {
      const date = recordMatch[1];
      const parsed = new Date(date + 'T00:00:00Z');
      if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date) {
        sections.push({ date, time: recordMatch[2] || '', label: recordMatch[3].trim() });
      }
    }
  }
  return sections;
}

const corpus = () => ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .map(file => ({ file, markdown: fs.readFileSync(path.join(root, file), 'utf8') }));

test('a dated section heading is read as a review record, and code fences are not', () => {
  const markdown = [
    '# UC-999：範例',
    '',
    '- 查證日期：2026-10-13',
    '',
    '## 2026-11-05 08:53補充：新增來源',
    '',
    '```',
    '## 2026-12-01 這一行在程式碼區塊裡',
    '```',
    '### 2026-10-20 覆核',
    '## 日文反例：帳目平衡（2026-10-16核讀）',
    '## 補充：預防保養（2026-10-22 11:42，台灣）',
    '- 2026-11-03 09:00 併入 S-050C（新增來源）',
    '- 目前可用性（2026-10-25）：GitHub 顯示 Page not found',
    '- 作者發布：2026-11-30（非本庫查核紀錄）',
    '#### 2026-10-21',
    '## 沒有日期的補充'
  ].join('\n');
  assert.deepEqual(
    datedReviewSections(markdown).map(section => section.date),
    ['2026-11-05', '2026-10-20', '2026-10-16', '2026-10-22', '2026-11-03', '2026-10-25'],
    'leading/parenthetical dated headings and review/availability records count; fenced examples, author post dates and a bare date do not'
  );
});

test('no case page keeps a review date older than a dated section it wrote', () => {
  const { parseFile } = load();
  const offenders = [];
  let pages = 0;
  for (const { file, markdown } of corpus()) {
    const entry = Array.from(parseFile(file, markdown))[0];
    if (!entry || entry.kind !== 'case') continue;
    const declared = entry.reviewedDate || '';
    const newest = datedReviewSections(markdown)
      .map(section => section.date)
      .sort()
      .pop() || '';
    if (!newest) continue;
    pages += 1;
    if (!declared || newest > declared) {
      offenders.push(`${file}: lead says ${declared || '(未提供)'}, section says ${newest}`);
    }
  }
  // The rule is only meaningful if the corpus really writes dated sections.
  assert.ok(pages >= 100, `only ${pages} case pages write a dated section; the scan is not covering the corpus`);
  assert.deepEqual(
    offenders,
    [],
    'A page that appends a dated supplement section must declare it in the lead '
      + '(`- 本次增補查證：YYYY-MM-DD；只核該節新增來源，未重驗全案。`), otherwise the badge and '
      + '`?sort=reviewed` publish an older review date than the page itself records.'
  );
});

test('the declared date is what the badge and the recent-review sort read', () => {
  const { reviewDate } = load();
  assert.equal(
    reviewDate('# 案例\n\n- 本次增補查證：2026-11-05；只核該節新增來源，未重驗全案。\n- 查證日期：2026-10-13\n\n## 2026-11-05 08:53補充：新增來源'),
    '2026-11-05',
    'the supplemental line outranks the older header date'
  );
  // The rule this test enforces is about the lead, not about reading sections:
  // a dated section alone still must not date the page.
  assert.equal(
    reviewDate('# 案例\n\n- 查證日期：2026-10-13\n\n## 2026-11-05 08:53補充：新增來源'),
    '2026-10-13',
    'a section heading is not a lead field'
  );
});
