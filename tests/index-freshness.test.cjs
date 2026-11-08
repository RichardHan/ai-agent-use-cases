'use strict';
// INDEX.md is the fallback page the homepage links to when the corpus is slow,
// so the facts it states about itself have to come from the case files. These
// checks fail when the index date, its entry count or its audit batch falls
// behind the content it lists.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const readIndex = () => fs.readFileSync(path.join(root, 'INDEX.md'), 'utf8');

function loadAppMetadata() {
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
  class Node { constructor(tag) { this.tagName = tag; this.children = []; } append(...c) { this.children.push(...c); } }
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: { createElement: t => new Node(t), createTextNode: t => ({ textContent: t }) }
  });
  vm.runInContext(source + '\nthis.api={reviewDate,parseFile};', context);
  return context.api;
}

const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();

test('INDEX.md states the newest case review date and the real entry count', () => {
  const api = loadAppMetadata();
  const dates = caseFiles
    .map(file => api.reviewDate(fs.readFileSync(path.join(root, 'cases', file), 'utf8')))
    .filter(date => /^20\d{2}-\d{2}-\d{2}$/.test(date))
    .sort();
  assert(dates.length > 0, 'At least one case must carry a dated review clause');
  const newest = dates[dates.length - 1];

  const line = readIndex().match(/^本頁列出 (\d+) 筆案例；頁首核對日期最新為 (20\d{2}-\d{2}-\d{2})；本頁於 (20\d{2}-\d{2}-\d{2}) 校對/m);
  assert(line, 'INDEX.md must open with its entry count, newest review date and proofread date');
  const [, count, statedNewest, proofread] = line;
  assert.equal(Number(count), caseFiles.length, `INDEX.md states ${count} cases but cases/ holds ${caseFiles.length}`);
  assert.equal(statedNewest, newest, `INDEX.md states newest review date ${statedNewest} but the newest case review date is ${newest}`);
  assert(proofread >= newest, `INDEX.md proofread date ${proofread} is older than the newest case review date ${newest}`);
});

test('INDEX.md names the audit batch it delegates the count to, with that batch\'s page count', () => {
  const audit = fs.readFileSync(path.join(root, 'sources/qualification-audit-2026-10-16.md'), 'utf8');
  const batches = audit.split(/^## /m);
  assert(batches.length > 2, 'Audit report must contain at least one batch section');
  const latestBatch = batches[1];

  const headerDate = audit.match(/最新計數核對批次：(20\d{2}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  assert(headerDate, 'Audit report must date its latest batch');
  // The page count below comes from the first batch section, so that section has
  // to be the batch the summary line names; otherwise a section could be newer
  // than the summary and the index's quoted date would still pass.
  const sectionDate = latestBatch.split('\n')[0].trim().match(/^(20\d{2}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  assert(sectionDate, 'The latest batch section must be dated in its heading');
  assert.equal(`${sectionDate[1]} ${sectionDate[2]}`, `${headerDate[1]} ${headerDate[2]}`, 'The audit summary line and its first batch section name different batches');
  const batchPages = latestBatch.match(/主要案例頁(\d+)/);
  assert(batchPages, 'The latest audit batch must state how many case pages it counted');

  const claim = readIndex().match(/該報告最新的計數核對批次是 (20\d{2}-\d{2}-\d{2}) (\d{2}:\d{2})、當時 (\d+) 個主要案例頁/);
  assert(claim, 'INDEX.md must state the audit batch date and the page count it was measured against');
  assert.equal(`${claim[1]} ${claim[2]}`, `${sectionDate[1]} ${sectionDate[2]}`, 'INDEX.md quotes a different audit batch than the report\'s latest');
  assert.equal(claim[3], batchPages[1], 'INDEX.md quotes a different page count than the batch it names');
  // A batch measured against fewer pages than the index lists must say so.
  if (Number(batchPages[1]) < caseFiles.length) {
    assert.match(readIndex(), /之後新增的頁尚未重新計數/, 'INDEX.md must disclose pages added after the audit batch');
  }
});

test('INDEX.md lists cases before the research archive and keeps every section anchor', () => {
  const content = readIndex();
  const caseList = content.indexOf('<a id="case-list"></a>');
  const table = content.indexOf('## 主要案例（');
  const researchLog = content.indexOf('<a id="research-log"></a>');
  const firstArchiveEntry = content.search(/^20\d{2}-\d{2}-\d{2}[^\n]*批次：/m);

  assert(caseList !== -1 && table !== -1, 'INDEX.md must keep the case list anchor and heading');
  assert(researchLog !== -1, 'INDEX.md must mark the research archive with an anchor');
  assert(firstArchiveEntry !== -1, 'INDEX.md must keep the research log entries');
  assert(caseList < firstArchiveEntry, 'The case list must come before the research log on the index page');
  assert(table < firstArchiveEntry, 'The case table must come before the research log on the index page');
  assert(caseList < researchLog, 'The research archive anchor must follow the case list');

  for (const anchor of ['case-list', 'supplement-list', 'pending-sources', 'research-log']) {
    assert(content.includes(`(#${anchor})`), `INDEX.md navigation must link to #${anchor}`);
    assert(content.includes(`<a id="${anchor}"></a>`), `INDEX.md must define the #${anchor} target`);
  }
});
