'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
const workflowsDir = path.join(root, '.github/workflows');

test('hero and search task shortcuts unify 代碼審查 and avoid noisy substring matches', () => {
  // Hero link must point to 代碼審查, not raw PR
  assert.ok(
    indexHtml.includes('href="?q=代碼審查#explore"') || indexHtml.includes('href="?q=%E4%BB%A3%E7%A2%BC%E5%AF%A9%E6%9F%BB#explore"'),
    'Hero shortcut for code review must use q=代碼審查 to avoid 200+ noisy substring matches'
  );
  assert.ok(
    !indexHtml.includes('href="?q=PR#explore"'),
    'Hero must not use raw q=PR which matches privacy, prompt, 1Password, etc.'
  );

  const vm = require('node:vm');
  const source = appJs.split('/* Browser event bindings. */')[0];
  const context = vm.createContext({ URL, Discovery: require('../assets/discovery.js') });
  vm.runInContext(source + '\nthis.api={metadata,filterEntries,tokenize};', context);

  // In real cases, 代碼審查 should return genuine review cases and avoid false matches like 1Password
  const fakeReviewCase = context.api.metadata(
    '# 自動化 PR 代碼審查\n\n- 核心目標：自動檢查 pull request 代碼品質\n- 目標使用者：後端工程師\n- 標籤：代碼審查、PR、GitHub\n- 查證日期：2026-10-25\n\n## 內容\n\n這是代碼審查工具。',
    'cases/test-review.md',
    'case'
  );
  const fakePasswordCase = context.api.metadata(
    '# 軟體序號管理\n\n- 核心目標：整理信箱序號並存入 1Password\n- 目標使用者：一般用戶\n- 標籤：密碼、序號\n- 查證日期：2026-10-25\n\n## 內容\n\n把序號存入 1Password。',
    'cases/test-password.md',
    'case'
  );

  const matched = context.api.filterEntries([fakeReviewCase, fakePasswordCase], context.api.tokenize('代碼審查'), {});
  assert.equal(matched.length, 1, 'Only genuine code review case should match 代碼審查');
  assert.equal(matched[0].id, fakeReviewCase.id);
});

test('proof recognition correctly identifies official demonstrations and examples as 官方自報', () => {
  const vm = require('node:vm');
  const source = appJs.split('/* Browser event bindings. */')[0];
  const context = vm.createContext({ URL, Discovery: require('../assets/discovery.js') });
  vm.runInContext(source + '\nthis.api={metadata};', context);

  const uc018 = fs.readFileSync(path.join(root, 'cases/018-demo-readiness.md'), 'utf8');
  const meta018 = context.api.metadata(uc018, 'cases/018-demo-readiness.md', 'case');
  assert.equal(meta018.proof, '官方自報', 'UC-018 官方首發用途展示 must be classified as 官方自報');

  const uc023 = fs.readFileSync(path.join(root, 'cases/023-launch-material-revision.md'), 'utf8');
  const meta023 = context.api.metadata(uc023, 'cases/023-launch-material-revision.md', 'case');
  assert.equal(meta023.proof, '官方自報', 'UC-023 官方發布情境／教學示例 must be classified as 官方自報');

  const uc031 = fs.readFileSync(path.join(root, 'cases/031-spending-dashboard.md'), 'utf8');
  const meta031 = context.api.metadata(uc031, 'cases/031-spending-dashboard.md', 'case');
  assert.equal(meta031.proof, '官方自報', 'UC-031 官方 Artifact 用途範例 must be classified as 官方自報');
});

test('official signed author statements remain discoverable as official sources', () => {
  const vm = require('node:vm');
  const context = vm.createContext({ URL, Discovery: require('../assets/discovery.js') });
  vm.runInContext(appJs.split('/* Browser event bindings. */')[0] + '\nthis.api={metadata,filterEntries};', context);
  const file = 'cases/017-prospect-research-drafts.md';
  const item = context.api.metadata(fs.readFileSync(path.join(root, file), 'utf8'), file, 'case');
  assert.equal(item.proof, '官方自報');
  assert.equal(context.api.filterEntries([item], [], {proof:'官方自報'}).length, 1);
});

test('author case is not relabelled as official by supporting documentation', () => {
  const vm = require('node:vm');
  const context = vm.createContext({ URL, Discovery: require('../assets/discovery.js') });
  vm.runInContext(appJs.split('/* Browser event bindings. */')[0] + '\nthis.api={metadata,filterEntries};', context);
  const markdown = fs.readFileSync(path.join(root, 'cases/372-office-mfp-scan-to-folder-smb-auth-fix.md'), 'utf8');
  const item = context.api.metadata(markdown, 'cases/372-office-mfp-scan-to-folder-smb-auth-fix.md', 'case');
  assert.equal(item.proof, '作者報告／示範');
  assert.equal(context.api.filterEntries([item], [], {proof:'作者報告／示範'}).length, 1);
  assert.equal(context.api.filterEntries([item], [], {proof:'官方自報'}).length, 0);
  for (const file of ['352-daily-flomo-memo-insight-push-rotating-template.md', '407-stack-aware-security-watch-exploited-vulns-certs-breaches.md']) {
    const template = context.api.metadata(fs.readFileSync(path.join(root, 'cases', file), 'utf8'), 'cases/' + file, 'case');
    assert.equal(template.proof, '模板／文件核讀');
    assert.equal(require('../assets/discovery.js').discoveryPool([template]).length, 0);
  }
});

test('unverified cases in cases/ are classified as 尚待查證 and discoverable under 尚待查證', () => {
  const vm = require('node:vm');
  const context = vm.createContext({ URL, Discovery: require('../assets/discovery.js') });
  vm.runInContext(appJs.split('/* Browser event bindings. */')[0] + '\nthis.api={metadata,filterEntries};', context);
  const unverifiedCases = [
    'cases/447-jet-lag-light-sleep-coach.md',
    'cases/404-fan-watch-official-news-twice-daily-calendar-dedup.md',
    'cases/408-daily-team-sync-one-page-prep-calendar-notion-slack-linear.md',
    'cases/414-event-registrant-email-alias-credit-link-once-per-person.md',
    'cases/377-calendar-client-code-to-freshbooks-time-entry.md',
    'cases/384-paid-article-boundary-post-edit-verification.md'
  ];
  for (const file of unverifiedCases) {
    const markdown = fs.readFileSync(path.join(root, file), 'utf8');
    const item = context.api.metadata(markdown, file, 'case');
    assert.equal(item.proof, '尚待查證', `${file} must be classified as 尚待查證`);
    assert.equal(context.api.filterEntries([item], [], {proof: '尚待查證'}).length, 1, `${file} must be discoverable under 尚待查證 facet`);
    assert.equal(context.api.filterEntries([item], [], {proof: '作者報告／示範'}).length, 0, `${file} must not be labelled 作者報告／示範`);
    assert.equal(context.api.filterEntries([item], [], {proof: '公開資料核讀'}).length, 0, `${file} must not be labelled 公開資料核讀`);
  }
});

test('community author projects utilizing official SDKs are classified as 作者報告／示範 without inflating to 官方自報', () => {
  const vm = require('node:vm');
  const context = vm.createContext({ URL, Discovery: require('../assets/discovery.js') });
  vm.runInContext(appJs.split('/* Browser event bindings. */')[0] + '\nthis.api={metadata,filterEntries};', context);
  const file = 'cases/455-muse-gadgets-m5stickc-plus2-pocket-push-to-talk.md';
  const markdown = fs.readFileSync(path.join(root, file), 'utf8');
  const item = context.api.metadata(markdown, file, 'case');
  assert.equal(item.proof, '作者報告／示範', 'UC-455 maker project must be 作者報告／示範');
  assert.equal(context.api.filterEntries([item], [], {proof: '作者報告／示範'}).length, 1);
  assert.equal(context.api.filterEntries([item], [], {proof: '官方自報'}).length, 0, 'UC-455 must not be inflated to 官方自報');
});

test('card renders both targetUser and coreGoal when available to orient visitors on problem and audience', () => {
  const vm = require('node:vm');
  const source = appJs.split('/* Browser event bindings. */')[0];
  const elements = [];
  function FakeNode(tag, cls, text) {
    this.tagName = tag.toUpperCase();
    this.className = cls || '';
    this.textContent = text !== undefined ? String(text) : '';
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.append = (...nodes) => {
      for (const n of nodes) {
        if (typeof n === 'string') this.textContent += n;
        else this.children.push(n);
      }
    };
    this.querySelector = (sel) => {
      const clsMatch = sel.match(/^\.([a-zA-Z0-9_-]+)$/);
      if (clsMatch) {
        const targetCls = clsMatch[1];
        const search = (node) => {
          if ((node.className || '').split(/\s+/).includes(targetCls)) return node;
          for (const c of node.children) {
            const found = search(c);
            if (found) return found;
          }
          return null;
        };
        return search(this);
      }
      return null;
    };
    this.querySelectorAll = (sel) => {
      const res = [];
      const clsMatch = sel.match(/^\.([a-zA-Z0-9_-]+)$/);
      if (clsMatch) {
        const targetCls = clsMatch[1];
        const search = (node) => {
          if ((node.className || '').split(/\s+/).includes(targetCls)) res.push(node);
          for (const c of node.children) search(c);
        };
        search(this);
      }
      return res;
    };
    this.addEventListener = () => {};
    this.setAttribute = (k, v) => { this.attributes[k] = v; };
  }

  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: {
      createElement: (tag) => new FakeNode(tag),
      createTextNode: (t) => t
    }
  });
  vm.runInContext(source + '\nthis.api={card,SCENARIO_TARGET_USERS};', context);

  const sampleBoth = {
    id: 'UC-999',
    title: '測試案例標題',
    coreGoal: '提升團隊代碼審查效率',
    targetUser: '資深軟體工程師與技術主管',
    summary: '詳細摘要說明文字',
    scenario: '工作',
    difficulty: '進階開發',
    kind: 'case',
    proof: '作者報告／示範',
    tools: ['Grok Bot'],
    tags: ['代碼審查'],
    date: '2026-10-25',
    reviewedDate: '2026-10-25'
  };

  const node = context.api.card(sampleBoth);
  const goalEl = node.querySelector('.card-goal');
  const targetUserEl = node.querySelector('.card-target-user');
  assert.ok(goalEl, 'card must render .card-goal when coreGoal is present');
  assert.ok(targetUserEl, 'card must also render .card-target-user when targetUser is available to clarify audience');
  assert.ok(goalEl.textContent.includes('提升團隊代碼審查效率'));
  assert.ok(targetUserEl.textContent.includes('資深軟體工程師與技術主管'));
});

test('Recent review and Combined recovery reuse the extended publication deadline', () => {
  for (const file of ['recency-qa.yml', 'combined-recovery-qa.yml']) {
    const workflow = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
    assert.match(workflow, /waitForPublishedAssets/, `${file} must use the shared publication wait`);
    const timeout = Number(workflow.match(/timeout-minutes:\s*(\d+)/)[1]);
    const {PUBLICATION_TIMEOUT_MS}=require('../scripts/published-assets.cjs');
    assert.ok(timeout*60000>=PUBLICATION_TIMEOUT_MS+20*60000, `${file} must cover the 60-minute wait plus setup and journeys`);
  }
});
