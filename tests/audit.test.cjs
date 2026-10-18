'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const CANONICAL_SCENARIOS = ['生活', '工作', '省錢', '學習', '創作', '開發'];

function normalizeSourceUrl(rawUrl) {
  try {
    const cleaned = rawUrl.replace(/[.。;；)\]'\"<>]+$/, '');
    const u = new URL(cleaned);
    u.searchParams.delete('utm_source');
    u.searchParams.delete('utm_medium');
    u.searchParams.delete('utm_campaign');
    u.searchParams.delete('ref');
    const pathNoSlash = u.pathname.replace(/\/+$/, '');
    return (u.origin + pathNoSlash + (u.search ? u.search : '')).toLowerCase();
  } catch {
    return null;
  }
}

test('all cases and evidence files have valid scenario, non-empty tags, and verification date', () => {
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();
  const evidenceFiles = fs.readdirSync(path.join(root, 'evidence')).filter(f => f.endsWith('.md')).sort();
  assert(caseFiles.length >= 310, `Expected at least 310 cases, found ${caseFiles.length}`);
  assert(evidenceFiles.length >= 3, `Expected at least 3 evidence files, found ${evidenceFiles.length}`);

  const targets = [
    ...caseFiles.map(f => ({ dir: 'cases', file: f })),
    ...evidenceFiles.map(f => ({ dir: 'evidence', file: f }))
  ];

  const missingScenario = [];
  const invalidScenario = [];
  const missingTags = [];
  const missingDate = [];

  for (const { dir, file } of targets) {
    const content = fs.readFileSync(path.join(root, dir, file), 'utf8');
    const lead = content.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];

    const scenarioMatch = lead.match(/^-\s*情境\s*[：:]\s*(.+)$/m);
    if (!scenarioMatch) {
      missingScenario.push(`${dir}/${file}`);
    } else {
      const val = scenarioMatch[1].replace(/[`*_]/g, '').trim();
      if (!CANONICAL_SCENARIOS.includes(val)) {
        invalidScenario.push({ file: `${dir}/${file}`, scenario: val });
      }
    }

    const tagsMatch = lead.match(/^-\s*標籤\s*[：:]\s*(.+)$/m);
    if (!tagsMatch) {
      missingTags.push(`${dir}/${file}`);
    } else {
      const tags = tagsMatch[1].split(/[、,，\s/]+/).map(t => t.trim()).filter(Boolean);
      if (tags.length === 0) {
        missingTags.push(`${dir}/${file}`);
      }
    }

    const hasDate = /^-\s*查證日期\s*[：:]\s*(.+)$/m.test(lead) || /20\d{2}-\d{2}-\d{2}/.test(lead);
    if (!hasDate) {
      missingDate.push(`${dir}/${file}`);
    }
  }

  assert.deepEqual(missingScenario, [], `Missing '- 情境：': ${missingScenario.join(', ')}`);
  assert.deepEqual(invalidScenario, [], `Invalid scenario: ${JSON.stringify(invalidScenario)}`);
  assert.deepEqual(missingTags, [], `Missing '- 標籤：': ${missingTags.join(', ')}`);
  assert.deepEqual(missingDate, [], `Missing verification date: ${missingDate.join(', ')}`);
});

test('all cases and evidence files contain verified external source URLs without placeholders', () => {
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();
  const evidenceFiles = fs.readdirSync(path.join(root, 'evidence')).filter(f => f.endsWith('.md')).sort();
  const targets = [
    ...caseFiles.map(f => ({ dir: 'cases', file: f })),
    ...evidenceFiles.map(f => ({ dir: 'evidence', file: f }))
  ];

  const missingExternalSource = [];
  const suspiciousPlaceholders = [];

  for (const { dir, file } of targets) {
    const content = fs.readFileSync(path.join(root, dir, file), 'utf8');
    const urls = content.match(/https?:\/\/[^\s)\],\"\'\''<>]+/g) || [];
    const validExternalUrls = urls
      .map(normalizeSourceUrl)
      .filter(u => u && !u.includes('github.com/richardhan') && !u.includes('schema.org') && !u.includes('w3.org'));

    if (validExternalUrls.length === 0) {
      missingExternalSource.push(`${dir}/${file}`);
    }

    for (const url of validExternalUrls) {
      if (url.includes('example.com') || url.includes('localhost') || url.includes('foo.bar')) {
        suspiciousPlaceholders.push({ file: `${dir}/${file}`, url });
      }
    }
  }

  assert.deepEqual(missingExternalSource, [], `Files missing external source: ${missingExternalSource.join(', ')}`);
  assert.deepEqual(suspiciousPlaceholders, [], `Files with placeholder URLs: ${JSON.stringify(suspiciousPlaceholders)}`);
});

test('candidate duplicate detection normalizes URLs and identifies shared external sources without modifying corpus', () => {
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();
  const urlMap = new Map();

  for (const file of caseFiles) {
    const content = fs.readFileSync(path.join(root, 'cases', file), 'utf8');
    const urls = content.match(/https?:\/\/[^\s)\],\"\'\''<>]+/g) || [];
    for (const rawUrl of urls) {
      const url = normalizeSourceUrl(rawUrl);
      if (!url || url.includes('github.com/richardhan') || url.includes('schema.org') || url.includes('w3.org')) continue;
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

  // Ensure duplicate detection finds shared source candidates (Reddit threads, docs, blogs)
  assert(duplicates.length > 0, 'Candidate duplicate detector should find shared source candidates');
  // Confirm that candidate duplicates are purely listed as candidates and all original cases remain intact
  assert(caseFiles.length >= 313, `Corpus case count must remain intact (no automatic deletion of candidates); got ${caseFiles.length}`);
});

test('qualification audit maintains strict separation between catalog entries and verified cases', () => {
  const auditContent = fs.readFileSync(path.join(root, 'sources/qualification-audit-2026-10-16.md'), 'utf8');
  const catalogCountMatch = auditContent.match(/嚴格合格\s*\*\*(\d+)[／/]1,000/);
  assert(catalogCountMatch, 'Audit file must contain strict qualified count');
  const qualifiedCount = parseInt(catalogCountMatch[1], 10);

  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md'));
  // Qualified cases (e.g. 292) must be strictly less than or equal to total case markdown files
  assert(qualifiedCount >= 292, `Expected qualified count >= 292 (2026-10-18 14:00 baseline), got ${qualifiedCount}`);
  assert(qualifiedCount <= caseFiles.length, `Qualified count (${qualifiedCount}) cannot exceed total cases (${caseFiles.length})`);
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
