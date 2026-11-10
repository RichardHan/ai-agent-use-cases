'use strict';
// Contract: the dead-end panel offers the same task entries the hero directory
// does, so it has to carry the same 「僅相關詞」 state. A visitor who already has no
// results must not be sent to a task whose 16 results all say "no case describes
// this" without being told that before the click.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8')
  .split('/* Browser event bindings. */')[0];

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
      value: '',
      listeners: {},
      get lastChild() { return this.children[this.children.length - 1]; },
      focus() { documentMock.activeElement = this; },
      showModal() { this.open = true; },
      click() { for (const listener of this.listeners.click || []) listener(); },
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
      removeAttribute(k) { delete this.attributes[k]; },
      addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
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

  const elements = new Map();
  const documentMock = {
    createElement,
    createTextNode(t) { return { tagName: '#text', textContent: String(t) }; },
    getElementById(id) {
      if (!elements.has(id)) {
        const node = createElement('div', id);
        node.attributes.id = id;
        elements.set(id, node);
      }
      return elements.get(id);
    }
  };

  const context = vm.createContext({
    document: documentMock,
    window: { document: documentMock },
    console,
    URL,
    URLSearchParams,
    crypto: { randomUUID: () => 'coverage-test-visit' },
    location: { href: 'https://example.test/ai-agent-use-cases/' },
    history: { state: null, pushState() {}, replaceState() {} },
    Discovery: require('../assets/discovery.js'),
    displayCopy: JSON.parse(fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8')),
    activeScenario: ''
  });

  vm.runInContext(appSource + '\nthis.api = { metadata, parseFile, filterEntries, tokenize, taskCoverage, renderSearchFeedback, TASK_COVERAGE_MARKER, clearTaskCoverage };', context);
  return { ...context.api, context, document: documentMock };
}

// Two cases: 郵件 is described in a title/purpose, 發票辨識 only appears in the
// body. The dead-end panel lists both, so both states have to be visible.
const CORPUS = `discoveryReady = true; failedPaths = []; entries = [
  {id:'UC-901', title:'整理收件匣', originalTitle:'整理收件匣', summary:'把郵件整理成每日摘要', coreGoal:'',
   search:'整理 收件匣 郵件 摘要', searchProse:'整理 收件匣 郵件 摘要', tags:['郵件'], scenario:'工作', kind:'case',
   difficulty:'入門對話', tools:[], category:'工作', proof:'作者報告／示範'},
  {id:'UC-902', title:'每月財務歸檔', originalTitle:'每月財務歸檔', summary:'把收據掃描後歸檔', coreGoal:'',
   search:'每月 財務 歸檔 發票 辨識 收據', searchProse:'每月 財務 歸檔 發票 辨識 收據', tags:[], scenario:'工作', kind:'case',
   difficulty:'入門對話', tools:[], category:'工作', proof:'作者報告／示範'},
  {id:'UC-903', title:'旅行行李清單', originalTitle:'旅行行李清單', summary:'出發前整理行李', coreGoal:'',
   search:'旅行 行李 清單 整理', searchProse:'旅行 行李 清單 整理', tags:[], scenario:'生活', kind:'case',
   difficulty:'入門對話', tools:[], category:'日常', proof:'作者報告／示範'},
  {id:'UC-904', title:'週末打掃', originalTitle:'週末打掃', summary:'把家裡打掃乾淨', coreGoal:'',
   search:'週末 打掃 郵件 收據 整理', searchProse:'週末 打掃 郵件 收據 整理', tags:[], scenario:'生活', kind:'case',
   difficulty:'入門對話', tools:[], category:'日常', proof:'作者報告／示範'},
  {id:'UC-905', title:'發票對帳', originalTitle:'發票對帳', summary:'每月的發票逐張核對', coreGoal:'',
   search:'發票 對帳 核對', searchProse:'發票 對帳 核對', tags:[], scenario:'工作', kind:'case',
   difficulty:'入門對話', tools:[], category:'工作', proof:'作者報告／示範'},
  {id:'UC-906', title:'每週例行檢查', originalTitle:'每週例行檢查', summary:'把例行檢查做完', coreGoal:'',
   search:'每週 例行 檢查 播客 摘要 逐字稿', searchProse:'每週 例行 檢查 播客 摘要 逐字稿', tags:[], scenario:'工作', kind:'case',
   difficulty:'入門對話', tools:[], category:'工作', proof:'作者報告／示範'}
];`;

function chipsOf(api) {
  return api.document.getElementById('empty-suggestions').querySelectorAll('.recovery-problem-tag');
}

test('dead-end chips mark the tasks no case describes in its own title or purpose', () => {
  const api = setupEnvironment();
  vm.runInContext(CORPUS, api.context);
  api.document.getElementById('query').value = '沒有這種任務';
  api.renderSearchFeedback(api.tokenize('沒有這種任務'), { scenario: '工作' });

  const chips = chipsOf(api);
  const byTag = Object.fromEntries(chips.map(chip => [chip.dataset.problemTag, chip]));
  assert.ok(byTag['郵件'], 'a covered task is still offered');
  assert.ok(byTag['發票辨識'], 'a related-words-only task is still offered, not silently dropped');

  assert.equal(byTag['郵件'].dataset.coverage, undefined, 'a task a case describes carries no marker');
  assert.equal(byTag['郵件'].querySelector('.task-coverage-none'), null, 'no marker text on a covered task');
  assert.equal(byTag['郵件'].title, undefined, 'no coverage title on a covered task');

  assert.equal(byTag['發票辨識'].dataset.coverage, 'none', 'a task with no self-description is marked');
  assert.equal(byTag['發票辨識'].querySelector('.task-coverage-none').textContent, '僅相關詞', 'the marker is the same word the hero uses');
  assert.match(byTag['發票辨識'].title, /沒有案例的標題、用途或痛點同時包含「發票」「辨識」/, 'the tooltip names the words it measured');
  assert.match(byTag['發票辨識'].title, /1 筆相關詞命中/, 'the tooltip promises the count the click will show');
  assert.equal(byTag['發票辨識'].getAttribute('aria-describedby'), 'empty-coverage-legend', 'the legend describes the marker');
  assert.equal(byTag['發票辨識'].getAttribute('aria-label'), '🧾 搜尋「發票辨識」僅相關詞', 'the accessible name includes the visible marker');
});

test('the marker state matches the results screen the chip opens', () => {
  const api = setupEnvironment();
  vm.runInContext(CORPUS, api.context);
  api.document.getElementById('query').value = '沒有這種任務';
  api.renderSearchFeedback(api.tokenize('沒有這種任務'), { scenario: '工作' });

  for (const chip of chipsOf(api)) {
    const term = chip.dataset.problemTag;
    const entries = vm.runInContext('entries', api.context);
    const overview = api.filterEntries(entries, api.tokenize(term), { scenario: '工作', scope: 'overview' }).length;
    const full = api.filterEntries(entries, api.tokenize(term), { scenario: '工作' }).length;
    assert.equal(chip.dataset.coverage === 'none', overview === 0, `${term}: marker matches the overview count`);
    if (chip.dataset.coverage === 'none') {
      assert.match(chip.title, new RegExp(` ${full} 筆相關詞命中`), `${term}: the promised count is the full-text count`);
    }
  }
});

test('tasks a case describes come before the ones only related words reach', () => {
  const api = setupEnvironment();
  vm.runInContext(CORPUS, api.context);
  api.document.getElementById('query').value = '沒有這種任務';
  api.renderSearchFeedback(api.tokenize('沒有這種任務'), { scenario: '工作' });
  const chips = chipsOf(api);
  const tags = chips.map(chip => chip.dataset.problemTag);
  const marked = tags.filter((_, index) => chips[index].dataset.coverage === 'none');
  const covered = tags.filter((_, index) => chips[index].dataset.coverage !== 'none');
  // 播客摘要 sits at position 8 of the curated list and 發票 at 13, so the curated
  // order alone would put the uncovered one first: only a real partition moves it.
  assert.ok(tags.indexOf('播客摘要') > tags.indexOf('發票'), `uncovered 播客摘要 must move behind covered 發票: ${tags.join(',')}`);
  assert.deepEqual(tags, [...covered, ...marked], 'the list is a stable partition: covered first, curated order kept inside each half');
  assert.deepEqual(marked, ['播客摘要', '發票辨識', '音訊轉寫'], 'the uncovered tasks keep their relative order');
});

test('the legend appears only while a marker is on screen', () => {
  const api = setupEnvironment();
  vm.runInContext(CORPUS, api.context);
  api.document.getElementById('query').value = '沒有這種任務';
  api.renderSearchFeedback(api.tokenize('沒有這種任務'), { scenario: '工作' });
  const legend = api.document.getElementById('empty-suggestions').querySelector('.empty-problem-legend');
  assert.ok(legend, 'the legend explains the marker');
  assert.match(legend.textContent, /僅相關詞/, 'the legend names the marker');
  assert.match(legend.textContent, /沒有案例的標題、用途或痛點同時包含這項任務的搜尋詞/, 'the legend states what the marker measures');

  // A partial load is not a census, and a panel with no marked chip needs no legend.
  vm.runInContext(CORPUS + '\nfailedPaths = ["cases/missing.md"];', api.context);
  api.renderSearchFeedback(api.tokenize('沒有這種任務'), { scenario: '工作' });
  assert.equal(chipsOf(api).filter(chip => chip.dataset.coverage).length, 0, 'nothing is marked while a source file is missing');
  assert.equal(api.document.getElementById('empty-suggestions').querySelector('.empty-problem-legend'), null, 'no legend without markers');
});

test('coverage follows the filters the panel is offering tasks under', () => {
  const api = setupEnvironment();
  vm.runInContext(CORPUS, api.context);
  api.document.getElementById('query').value = '沒有這種任務';
  // Under 生活 the 郵件 case that describes itself is filtered out: only a case
  // that mentions the word in its body remains, so the task is not covered there.
  api.renderSearchFeedback(api.tokenize('沒有這種任務'), { scenario: '生活' });
  const chips = chipsOf(api);
  const inbox = chips.find(chip => chip.dataset.problemTag === '郵件');
  assert.ok(inbox, 'the chip is still offered when the facet leaves related cases');
  assert.equal(inbox.dataset.coverage, 'none', 'coverage is measured under the same facet the results would use');
  assert.match(inbox.title, /1 筆相關詞命中/, 'the promise is the filtered count');
});

test('a reloaded corpus invalidates the memoised coverage', () => {
  const api = setupEnvironment();
  vm.runInContext(CORPUS, api.context);
  api.document.getElementById('query').value = '沒有這種任務';
  api.renderSearchFeedback(api.tokenize('沒有這種任務'), { scenario: '工作' });
  const before = chipsOf(api).find(chip => chip.dataset.problemTag === '發票辨識');
  assert.equal(before.dataset.coverage, 'none', 'the task starts uncovered');

  // mergeCorpus() always returns a new array, so a reload must not read the old answer.
  vm.runInContext(`entries = [...entries, {id:'UC-905', title:'發票辨識歸檔', originalTitle:'發票辨識歸檔',
     summary:'掃描發票並辨識品項', coreGoal:'', search:'發票 辨識 歸檔 掃描', searchProse:'發票 辨識 歸檔 掃描',
     tags:[], scenario:'工作', kind:'case', difficulty:'入門對話', tools:[], category:'工作', proof:'作者報告／示範'}];`, api.context);
  api.renderSearchFeedback(api.tokenize('沒有這種任務'), { scenario: '工作' });
  const after = chipsOf(api).find(chip => chip.dataset.problemTag === '發票辨識');
  assert.equal(after.dataset.coverage, undefined, 'a case that now describes the task clears the marker');
  assert.equal(after.querySelector('.task-coverage-none'), null, 'the marker text is gone too');
});
