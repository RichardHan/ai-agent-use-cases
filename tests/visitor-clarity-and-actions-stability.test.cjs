'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
const workflowsDir = path.join(root, '.github/workflows');

test('promoted travel query finds the travel-comparison case and query echo keeps emoji intact', () => {
  const vm = require('node:vm');
  const source = appJs.split('/* Browser event bindings. */')[0];
  const context = vm.createContext({URL, Discovery: require('../assets/discovery.js')});
  vm.runInContext(source + '\nthis.api={abbreviatedQuery,parseFile,filterEntries,tokenize};', context);
  const example = indexHtml.match(/id="query"[^>]*placeholder="([^"]+)"/)?.[1];
  assert.ok(example?.includes('旅遊'), 'the example must be visible to new visitors');
  const corpus = fs.readFileSync(path.join(root, 'cases/001-travel-checkout.md'), 'utf8');
  const entries = Array.from(context.api.parseFile('cases/001-travel-checkout.md', corpus));
  assert.ok(context.api.filterEntries(entries, context.api.tokenize('旅遊'), {}).some(item => item.id === 'UC-001'));
  assert.equal(context.api.abbreviatedQuery('a'.repeat(39) + '🧾' + 'z'), 'a'.repeat(39) + '🧾…');
  assert.equal(context.api.abbreviatedQuery('a'.repeat(40) + '🧾'), 'a'.repeat(40) + '…');
});



test('card renders .card-target-user when coreGoal is not provided', () => {
  const vm = require('node:vm');
  const source = appJs.split('/* Browser event bindings. */')[0];
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: {
      createElement(tag, className = '', textContent = '') {
        return {
          tagName: tag.toUpperCase(),
          className,
          textContent,
          children: [],
          dataset: {},
          attributes: {},
          append(...nodes) {
            for (const n of nodes) {
              if (typeof n === 'string') this.children.push({ textContent: n });
              else if (n) this.children.push(n);
            }
          },
          setAttribute(k, v) { this.attributes[k] = String(v); },
          addEventListener() {},
          replaceChildren(...nodes) { this.children = []; this.append(...nodes); },
          querySelector(sel) {
            const queue = [...this.children];
            while (queue.length) {
              const node = queue.shift();
              if (sel.startsWith('.') && node.className?.split(/\s+/).includes(sel.slice(1))) return node;
              if (node.children) queue.push(...node.children);
            }
            return null;
          }
        };
      },
      createTextNode(t) { return { textContent: String(t) }; }
    }
  });
  vm.runInContext(source + '\nthis.api={card,SCENARIO_TARGET_USERS};', context);
  const sampleNoGoal = {
    id: 'UC-999',
    title: '自學測試案例',
    scenario: '學習',
    kind: 'case',
    proof: '作者報告／示範',
    summary: '自學測試摘要說明',
    tools: ['Claude']
  };
  const node = context.api.card(sampleNoGoal);
  const targetUserEl = node.querySelector('.card-target-user');
  assert.ok(targetUserEl, 'card must render .card-target-user when coreGoal is missing');
  assert.ok((targetUserEl.textContent || '').includes('👤 適合對象：進行自主學習'), 'card-target-user must show scenario audience default');
});

test('results-return-browser.cjs preserves 300px mobile first-result budget', () => {
  const returnCjs = fs.readFileSync(path.join(root, 'tests/results-return-browser.cjs'), 'utf8');
  assert.match(
    returnCjs,
    /if\(width<=760\)assert\(row\.firstResultFromSearch<300,\s*'original mobile first-result budget is preserved'\);/,
    'results-return-browser.cjs must align with mobile-search-browser 300px budget'
  );
});

test('evidence-round-qa.yml includes in-loop and terminal isCurrentMainCommit checks', () => {
  const evidenceYml = fs.readFileSync(path.join(workflowsDir, 'evidence-round-qa.yml'), 'utf8');
  assert.ok(
    evidenceYml.includes('attempt % 15 == 0') && evidenceYml.includes('!isCurrentMainCommit'),
    'evidence-round-qa.yml must perform in-loop freshness check'
  );
  assert.ok(
    evidenceYml.includes("if(!isCurrentMainCommit(process.env.GITHUB_SHA)) process.exit(42)") &&
    evidenceYml.includes("raise SystemExit('Pages assets did not match')"),
    'evidence-round-qa.yml must verify freshness before exiting with failure'
  );
});

test('related published browser polling tolerates 25-minute deployments and skips superseded commits', () => {
  const relatedBrowser = fs.readFileSync(path.join(root, 'tests/related-browser.cjs'), 'utf8');
  assert.match(relatedBrowser, /for\(let i=0;i<300;i\+\+\)\{/, 'live assets must have 300 polling attempts');
  assert.match(
    relatedBrowser,
    /for\(let i=0;i<300;i\+\+\)\{\s*if\(i>0&&i%6===0&&skipIfSupersededPublishedUrl\(origin\)\)\{console\.log\('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '\+process\.env\.GITHUB_SHA\);process\.exit\(0\);\}/,
    'polling must skip superseded commits every six attempts'
  );
  assert.match(relatedBrowser, /await new Promise\(r=>setTimeout\(r,5000\)\)/, 'polling must wait five seconds per attempt');
  assert.match(
    relatedBrowser,
    /if\(skipIfSupersededPublishedUrl\(origin\)\)\{console\.log\('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '\+process\.env\.GITHUB_SHA\);process\.exit\(0\);\}\s*assert\(matched,/,
    'asset mismatch must verify freshness before failing'
  );
  const relatedWorkflow = fs.readFileSync(path.join(workflowsDir, 'related-qa.yml'), 'utf8');
  assert.match(relatedWorkflow, /timeout-minutes: 30/, 'job timeout must accommodate the polling budget');
});

test('category-find published polling allows 25 minutes within its job timeout', () => {
  const categoryWorkflow = fs.readFileSync(path.join(workflowsDir, 'category-find-qa.yml'), 'utf8');
  assert.match(categoryWorkflow, /for\(let i=0;i<750;i\+\+\)\{/, 'published assets must have 750 polling attempts');
  assert.match(categoryWorkflow, /await new Promise\(resolve=>setTimeout\(resolve,2000\)\)/, 'polling must wait two seconds per attempt');
  assert.match(categoryWorkflow, /within 25 minutes \(750 attempts\)/, 'timeout error must describe the expanded budget');
  assert.match(categoryWorkflow, /timeout-minutes: 30/, 'job timeout must accommodate the polling budget');
});
