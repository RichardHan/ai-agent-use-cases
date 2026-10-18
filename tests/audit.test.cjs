'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const CANONICAL_SCENARIOS = ['生活', '工作', '省錢', '學習', '創作', '開發'];

test('all cases have valid scenario and non-empty tags', () => {
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();
  assert(caseFiles.length >= 310, `Expected at least 310 cases, found ${caseFiles.length}`);

  const missingScenario = [];
  const invalidScenario = [];
  const missingTags = [];

  for (const file of caseFiles) {
    const content = fs.readFileSync(path.join(root, 'cases', file), 'utf8');
    const lead = content.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];

    const scenarioMatch = lead.match(/^-\s*情境\s*[：:]\s*(.+)$/m);
    if (!scenarioMatch) {
      missingScenario.push(file);
    } else {
      const val = scenarioMatch[1].replace(/[`*_]/g, '').trim();
      if (!CANONICAL_SCENARIOS.includes(val)) {
        invalidScenario.push({ file, scenario: val });
      }
    }

    const tagsMatch = lead.match(/^-\s*標籤\s*[：:]\s*(.+)$/m);
    if (!tagsMatch) {
      missingTags.push(file);
    } else {
      const tags = tagsMatch[1].split(/[、,，\s/]+/).map(t => t.trim()).filter(Boolean);
      if (tags.length === 0) {
        missingTags.push(file);
      }
    }
  }

  assert.deepEqual(missingScenario, [], `Cases missing '- 情境：': ${missingScenario.join(', ')}`);
  assert.deepEqual(invalidScenario, [], `Cases with invalid scenario: ${JSON.stringify(invalidScenario)}`);
  assert.deepEqual(missingTags, [], `Cases missing '- 標籤：': ${missingTags.join(', ')}`);
});

test('candidate duplicate detection identifies shared external sources without modifying corpus', () => {
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();
  const urlMap = new Map();

  for (const file of caseFiles) {
    const content = fs.readFileSync(path.join(root, 'cases', file), 'utf8');
    const urls = content.match(/https?:\/\/[^\s)\],\"'\''<>]+/g) || [];
    for (const rawUrl of urls) {
      const url = rawUrl.replace(/[.。;；]+$/, '');
      if (url.includes('github.com/RichardHan') || url.includes('schema.org') || url.includes('w3.org')) continue;
      if (!urlMap.has(url)) urlMap.set(url, new Set());
      urlMap.get(url).add(file);
    }
  }

  const duplicates = [];
  for (const [url, fileSet] of urlMap.entries()) {
    if (fileSet.size > 1) {
      duplicates.push({ url, cases: Array.from(fileSet) });
    }
  }

  // Ensure duplicate detection finds known shared source threads (e.g. Reddit comment threads or product docs)
  assert(duplicates.length > 0, 'Candidate duplicate detector should find shared source candidates');
  // Confirm that candidate duplicates are purely listed as candidates and all original cases remain intact
  assert.equal(caseFiles.length, 313, 'Corpus case count must remain intact (no automatic deletion of candidates)');
});

test('qualification audit maintains strict separation between catalog entries and verified cases', () => {
  const auditContent = fs.readFileSync(path.join(root, 'sources/qualification-audit-2026-10-16.md'), 'utf8');
  const catalogCountMatch = auditContent.match(/嚴格合格\s*\*\*(\d+)[／/]1,000/);
  assert(catalogCountMatch, 'Audit file must contain strict qualified count');
  const qualifiedCount = parseInt(catalogCountMatch[1], 10);

  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md'));
  // Qualified cases (e.g. 290+) must be strictly less than or equal to total case markdown files
  assert(qualifiedCount <= caseFiles.length, `Qualified count (${qualifiedCount}) cannot exceed total cases (${caseFiles.length})`);
  assert(qualifiedCount >= 280, `Expected qualified count to be at least 280, got ${qualifiedCount}`);
});

test('app.js metadata extraction gracefully falls back to extract tags from category lines', () => {
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
  class Node { constructor(tag) { this.tagName = tag; this.children = []; } append(...c) { this.children.push(...c); } }
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: { createElement: t => new Node(t), createTextNode: text => ({ textContent: text }) }
  });
  vm.runInContext(source + '\nthis.api={metadata,parseFile};', context);

  // Test slash separated category/tags
  const doc1 = '# UC-901：測試案例一\n\n- 分類／標籤：工作／報價草稿／品牌／審核\n- 來源證據：author-demo\n\n## 內容';
  const entry1 = context.api.parseFile('cases/901.md', doc1)[0];
  assert.deepEqual(Array.from(entry1.tags), ['報價草稿', '品牌', '審核']);

  // Test pipe separated category/tags
  const doc2 = '# UC-902：測試案例二\n\n- 分類：開發｜發布、版本、環境、驗收\n- 來源證據：author-demo\n\n## 內容';
  const entry2 = context.api.parseFile('cases/902.md', doc2)[0];
  assert.deepEqual(Array.from(entry2.tags), ['發布', '版本', '環境', '驗收']);
});
