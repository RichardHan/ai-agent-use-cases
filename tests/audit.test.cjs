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
    const cleaned = rawUrl.replace(/^[<(（['"]+/, '').replace(/[.。;；)\]）〕』'\"<>?？!！]+$/, '');
    const u = new URL(cleaned);
    let host = u.hostname.toLowerCase();
    if (host === 'twitter.com' || host === 'www.twitter.com' || host === 'mobile.twitter.com') host = 'x.com';
    if (host === 'www.x.com' || host === 'mobile.x.com' || host === 'm.x.com') host = 'x.com';
    if (host === 'www.reddit.com' || host === 'old.reddit.com' || host === 'm.reddit.com' || host === 'new.reddit.com') host = 'reddit.com';
    if (host === 'www.facebook.com' || host === 'm.facebook.com' || host === 'web.facebook.com') host = 'facebook.com';
    if (host === 'm.youtube.com') host = 'www.youtube.com';
    if (host === 'youtu.be') {
      host = 'www.youtube.com';
      const id = u.pathname.slice(1);
      u.pathname = '/watch';
      u.searchParams.set('v', id);
    }
    const tracking = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ref', 's', 't', 'feature', 'open', 'context', 'hl', 'mobile-help', 'track', 'raw_json', 'si', 'igsh', 'trk', 'spm_id_from'];
    tracking.forEach(p => u.searchParams.delete(p));
    u.hash = '';
    const pathNoSlash = u.pathname.replace(/\/+$/, '');
    return (u.protocol + '//' + host + pathNoSlash + (u.search ? u.search : '')).toLowerCase();
  } catch {
    return null;
  }
}

test('all cases and evidence files have valid scenario, non-empty tags, and verification date', () => {
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();
  const evidenceFiles = fs.readdirSync(path.join(root, 'evidence')).filter(f => f.endsWith('.md')).sort();
  assert(caseFiles.length >= 322, `Expected at least 322 cases, found ${caseFiles.length}`);
  assert(evidenceFiles.length >= 3, `Expected at least 3 evidence files, found ${evidenceFiles.length}`);

  const targets = [
    ...caseFiles.map(f => ({ dir: 'cases', file: f })),
    ...evidenceFiles.map(f => ({ dir: 'evidence', file: f }))
  ];

  const missingScenario = [];
  const invalidScenario = [];
  const missingTags = [];
  const missingDate = [];
  const missingProof = [];

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

    const hasProof = /^-\s*(?:來源證據|證據狀態|證據等級|證據)\s*[：:]\s*(.+)$/m.test(lead);
    if (!hasProof) {
      missingProof.push(`${dir}/${file}`);
    }
  }

  assert.deepEqual(missingScenario, [], `Missing '- 情境：': ${missingScenario.join(', ')}`);
  assert.deepEqual(invalidScenario, [], `Invalid scenario: ${JSON.stringify(invalidScenario)}`);
  assert.deepEqual(missingTags, [], `Missing '- 標籤：': ${missingTags.join(', ')}`);
  assert.deepEqual(missingDate, [], `Missing verification date: ${missingDate.join(', ')}`);
  assert.deepEqual(missingProof, [], `Missing proof/evidence header: ${missingProof.join(', ')}`);
});

test('all cases, evidence files, and pending leads contain verified external source URLs without placeholders', () => {
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();
  const evidenceFiles = fs.readdirSync(path.join(root, 'evidence')).filter(f => f.endsWith('.md')).sort();
  const targets = [
    ...caseFiles.map(f => ({ dir: 'cases', file: f })),
    ...evidenceFiles.map(f => ({ dir: 'evidence', file: f })),
    { dir: 'sources', file: 'pending.md' }
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
  const evidenceFiles = fs.readdirSync(path.join(root, 'evidence')).filter(f => f.endsWith('.md')).sort();
  const targets = [
    ...caseFiles.map(f => ({ dir: 'cases', file: f })),
    ...evidenceFiles.map(f => ({ dir: 'evidence', file: f })),
    { dir: 'sources', file: 'pending.md' }
  ];
  const urlMap = new Map();

  for (const { dir, file } of targets) {
    const content = fs.readFileSync(path.join(root, dir, file), 'utf8');
    const urls = content.match(/https?:\/\/[^\s)\],\"\'\''<>]+/g) || [];
    for (const rawUrl of urls) {
      const url = normalizeSourceUrl(rawUrl);
      if (!url || url.includes('github.com/richardhan') || url.includes('schema.org') || url.includes('w3.org')) continue;
      if (!urlMap.has(url)) urlMap.set(url, new Set());
      urlMap.get(url).add(`${dir}/${file}`);
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
  assert(caseFiles.length >= 322, `Corpus case count must remain intact (no automatic deletion of candidates); got ${caseFiles.length}`);

  // Specifically verify known shared discussion thread candidates are identified
  const redditDiscussion = duplicates.find(d => d.url.includes('1wa57uk/comment/p8gwy2e'));
  assert(redditDiscussion, 'Must detect shared Reddit comment thread candidate');
  assert(redditDiscussion.cases.includes('cases/097-public-gis-layer-map.md'), 'Shared thread candidate includes UC-097');
  assert(redditDiscussion.cases.includes('cases/098-engineering-pdf-excel-extraction.md'), 'Shared thread candidate includes UC-098');
  assert(redditDiscussion.cases.includes('cases/099-travel-photo-scrapbook.md'), 'Shared thread candidate includes UC-099');

  // Verify cross-directory shared candidates (cases vs pending leads, cases vs evidence)
  const pendingCrossCandidate = duplicates.find(d => d.url.includes('2101482577970303407'));
  assert(pendingCrossCandidate, 'Must detect shared source between cases/028 and sources/pending.md');
  assert(pendingCrossCandidate.cases.includes('cases/028-bill-comparison-preparation.md'));
  assert(pendingCrossCandidate.cases.includes('sources/pending.md'));

  const evidenceCrossCandidate = duplicates.find(d => d.url.includes('i-connected-chatgpt-dots-to-gmail-calendar-slack-and-notion'));
  assert(evidenceCrossCandidate, 'Must detect shared source between cases/283 and evidence/008');
  assert(evidenceCrossCandidate.cases.includes('cases/283-dots-connected-apps-permission-pitfalls.md'));
  assert(evidenceCrossCandidate.cases.includes('evidence/008-morning-brief-validation.md'));

  // Verify domain-normalized candidate duplicates (Reddit www/non-www, Substack query params)
  const redditMetaCandidate = duplicates.find(d => d.url.includes('reddit.com/r/metaai/comments/1wydk5b'));
  assert(redditMetaCandidate, 'Must detect shared Reddit discussion between cases/171 and cases/284 via domain normalization');
  assert(redditMetaCandidate.cases.includes('cases/171-credit-report-dispute-evidence-preparation.md'));
  assert(redditMetaCandidate.cases.includes('cases/284-delayed-baggage-status-expense-claim.md'));

  const substackCandidate = duplicates.find(d => d.url.includes('semicolonexpected.substack.com/p/i-tried-meta-muse-ai-specific-things'));
  assert(substackCandidate, 'Must detect shared Substack article between cases/043 and cases/241 via tracking param normalization');
  assert(substackCandidate.cases.includes('cases/043-public-events-calendar.md'));
  assert(substackCandidate.cases.includes('cases/241-community-participation-spam-review.md'));

  // Verify additional cross-case candidate duplicate clusters without deleting any cases
  const redditProcureCandidate = duplicates.find(d => d.url.includes('pesozyw'));
  assert(redditProcureCandidate, 'Must detect shared Reddit procurement discussion between UC-101 and UC-102');
  assert(redditProcureCandidate.cases.includes('cases/101-procurement-capability-shortlist.md'));
  assert(redditProcureCandidate.cases.includes('cases/102-regulatory-change-safety-form-draft.md'));

  const redditMailCandidate = duplicates.find(d => d.url.includes('peug3yn'));
  assert(redditMailCandidate, 'Must detect shared Reddit mail migration discussion between UC-156 and UC-250');
  assert(redditMailCandidate.cases.includes('cases/156-mail-system-migration-verification.md'));
  assert(redditMailCandidate.cases.includes('cases/250-mail-migration-data-routing-cutover.md'));

  const museWorkflowCandidate = duplicates.find(d => d.url.includes('alex-cornell-meta-muse-workflows'));
  assert(museWorkflowCandidate, 'Must detect shared Alex Cornell workflow article between UC-107 and UC-108');
  assert(museWorkflowCandidate.cases.includes('cases/107-old-blog-private-audio-archive.md'));
  assert(museWorkflowCandidate.cases.includes('cases/108-golf-round-practice-data-review.md'));

  const appleVisCandidate = duplicates.find(d => d.url.includes('applevis.com/apps/ios/productivity/muse-meta'));
  assert(appleVisCandidate, 'Must detect shared AppleVis Muse review between UC-133 and UC-180');
  assert(appleVisCandidate.cases.includes('cases/133-screen-reader-menu-reformat.md'));
  assert(appleVisCandidate.cases.includes('cases/180-photo-library-descriptive-metadata.md'));

  const deployBlogCandidate = duplicates.find(d => d.url.includes('zhuyawei.com/blog/meta-muse-personal-workflow-cloud-deploy'));
  assert(deployBlogCandidate, 'Must detect shared deployment workflow between UC-151 and UC-214');
  assert(deployBlogCandidate.cases.includes('cases/151-booked-stay-prerequisite-followup.md'));
  assert(deployBlogCandidate.cases.includes('cases/214-release-artifact-runtime-identity-check.md'));

  const vehicleMaintenanceCandidate = duplicates.find(d => d.url.includes('pgubvln'));
  assert(vehicleMaintenanceCandidate, 'Must detect shared Reddit discussion comment between UC-124 and UC-215');
  assert(vehicleMaintenanceCandidate.cases.includes('cases/124-vehicle-maintenance-record-review.md'));
  assert(vehicleMaintenanceCandidate.cases.includes('cases/215-recipe-inbox-structured-collection.md'));

  const substackCodeCapitalCandidate = duplicates.find(d => d.url.includes('meus-principais-casos-de-uso-para-o-grok-bot'));
  assert(substackCodeCapitalCandidate, 'Must detect shared CodeCapital Substack article between UC-095 and UC-096');
  assert(substackCodeCapitalCandidate.cases.includes('cases/095-product-usage-error-correlation.md'));
  assert(substackCodeCapitalCandidate.cases.includes('cases/096-production-log-deploy-triage.md'));

  const eleanorKonikCandidate = duplicates.find(d => d.url.includes('muse-was-my-gateway-drug-to-grok'));
  assert(eleanorKonikCandidate, 'Must detect shared Eleanor Konik article between UC-066 and UC-182');
  assert(eleanorKonikCandidate.cases.includes('cases/066-agent-token-usage-self-audit.md'));
  assert(eleanorKonikCandidate.cases.includes('cases/182-library-book-selection-holds.md'));

  const platformMuseCandidate = duplicates.find(d => d.url.includes('platform.muse.ai/docs'));
  assert(platformMuseCandidate, 'Must detect shared Platform Muse documentation between UC-155 and UC-248');
  assert(platformMuseCandidate.cases.includes('cases/155-field-service-job-change-coordination.md'));
  assert(platformMuseCandidate.cases.includes('cases/248-cross-agent-conversation-disclosure-boundary.md'));

  const grokBotFilesCandidate = duplicates.find(d => d.url.includes('docs.x.ai/grok-bot/files-and-results'));
  assert(grokBotFilesCandidate, 'Must detect shared Grok Bot files-and-results docs between UC-198 and UC-252');
  assert(grokBotFilesCandidate.cases.includes('cases/198-prelab-document-gap-review.md'));
  assert(grokBotFilesCandidate.cases.includes('cases/252-three-statement-scenario-board-pack.md'));

  const mcpEventsCandidate = duplicates.find(d => d.url.includes('plugins/build/mcp-events'));
  assert(mcpEventsCandidate, 'Must detect shared MCP events documentation between UC-074 and UC-239');
  assert(mcpEventsCandidate.cases.includes('cases/074-event-trigger-readback.md'));
  assert(mcpEventsCandidate.cases.includes('cases/239-wearable-conversation-delivery-state-validation.md'));

  const digitizCandidate = duplicates.find(d => d.url.includes('digitiz.fr/chatgpt-dots'));
  assert(digitizCandidate, 'Must detect shared Digitiz article between UC-002 and UC-073');
  assert(digitizCandidate.cases.includes('cases/002-video-production.md'));
  assert(digitizCandidate.cases.includes('cases/073-customer-journey-content-audit.md'));

  const botStoreAcademyCandidate = duplicates.find(d => d.url.includes('bot.store/academy/what-people-use-grok-bot-for'));
  assert(botStoreAcademyCandidate, 'Must detect shared Bot Store Academy article between UC-024 and UC-035');
  assert(botStoreAcademyCandidate.cases.includes('cases/024-missing-invoice-check.md'));
  assert(botStoreAcademyCandidate.cases.includes('cases/035-job-search-application-drafts.md'));
});

test('qualification audit maintains strict separation between catalog entries and verified cases', () => {
  const auditContent = fs.readFileSync(path.join(root, 'sources/qualification-audit-2026-10-16.md'), 'utf8');
  const latestAuditSection = auditContent.split(/^## /m)[1];
  assert(latestAuditSection, 'Audit file must contain a current batch section');
  const catalogCountMatch = latestAuditSection.match(/嚴格合格\s*\*\*(\d+)[／/]1,000，尚差\s*(\d+)/);
  assert(catalogCountMatch, 'Audit file must contain strict qualified and remaining counts');
  const qualifiedCount = parseInt(catalogCountMatch[1], 10);
  const remainingCount = parseInt(catalogCountMatch[2], 10);

  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md'));
  // Evidence review may lower the count. Validate the current audit's arithmetic,
  // corpus bound and displayed values, rather than imposing a historical minimum.
  assert(Number.isSafeInteger(qualifiedCount) && Number.isSafeInteger(remainingCount), 'Audit counts must be safe non-negative integers');
  assert(qualifiedCount > 0, 'This non-empty qualified corpus must have a positive audit count');
  assert.equal(qualifiedCount + remainingCount, 1000, 'Qualified and remaining counts must add up to the stated 1,000-case goal');
  assert(qualifiedCount <= caseFiles.length, `Qualified count (${qualifiedCount}) cannot exceed total cases (${caseFiles.length})`);

  const indexContent = fs.readFileSync(path.join(root, 'INDEX.md'), 'utf8');
  const indexSummaryMatch = indexContent.match(/\*\*(\d+)[／/]1,000[^*\n]*?尚差\s*(\d+)\*\*/);
  assert(indexSummaryMatch, 'INDEX.md must contain qualified and remaining counts');
  assert.equal(parseInt(indexSummaryMatch[1], 10), qualifiedCount, 'INDEX.md qualified count must match the current audit');
  assert.equal(parseInt(indexSummaryMatch[2], 10), remainingCount, 'INDEX.md remaining count must match the current audit');

  // Verify that index.html displays the exact qualified count from the audit file
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const indexCountMatch = indexHtml.match(/<div class="stat-card stat-card-audit">[\s\S]*?<div class="stat-figure">\s*<strong>(\d+)<\/strong>/);
  assert(indexCountMatch, 'index.html must display strict qualified count');
  assert.equal(parseInt(indexCountMatch[1], 10), qualifiedCount, `index.html audit count (${indexCountMatch[1]}) must match audit doc (${qualifiedCount})`);
});

test('INDEX.md maintains scenario consistency, working case links, and matches strict qualification audit count', () => {
  const indexContent = fs.readFileSync(path.join(root, 'INDEX.md'), 'utf8');
  const auditContent = fs.readFileSync(path.join(root, 'sources/qualification-audit-2026-10-16.md'), 'utf8');

  // Strict qualified count in INDEX.md header must match audit document
  const auditMatch = auditContent.match(/嚴格合格\s*\*\*(\d+)[／/]1,000/);
  assert(auditMatch, 'Audit file must contain strict qualified count');
  const expectedQualified = auditMatch[1];
  const indexMatch = indexContent.match(/截至\s*2026-10-18[^\n]*\*\*(\d+)[／/]1,000/);
  assert(indexMatch, 'INDEX.md must contain current qualified count');
  assert.equal(indexMatch[1], expectedQualified, `INDEX.md count (${indexMatch[1]}) must match audit doc (${expectedQualified})`);

  // Main cases count in INDEX.md header must match cases/ file count
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md'));
  const mainPagesMatch = indexContent.match(/主要頁\s*(?:\d+[＋+]\d+＝)?(\d+)/);
  assert(mainPagesMatch, 'INDEX.md must state total main pages count');
  assert.equal(parseInt(mainPagesMatch[1], 10), caseFiles.length, `INDEX.md main pages (${mainPagesMatch[1]}) must match cases/ count (${caseFiles.length})`);

  // Verify all case and evidence links in INDEX.md exist on disk
  const links = Array.from(indexContent.matchAll(/\[(?:[^\]]*)\]\(((?:cases|evidence)\/[^)]+\.md)\)/g));
  assert(links.length >= 322, `Expected at least 322 links in INDEX.md, found ${links.length}`);
  for (const match of links) {
    const relPath = match[1];
    assert(fs.existsSync(path.join(root, relPath)), `Link target does not exist: ${relPath}`);
  }

  // Verify all case rows in table 1 have valid canonical scenario
  const caseRows = indexContent.split('\n').filter(l => l.startsWith('| UC-') && l.includes('(cases/'));
  assert.equal(caseRows.length, caseFiles.length, `INDEX.md table case rows (${caseRows.length}) must match caseFiles (${caseFiles.length})`);
  for (const row of caseRows) {
    const cols = row.split('|').map(c => c.trim()).filter(Boolean);
    const catTag = cols[4];
    assert(catTag, `Row missing category/tag column: ${row}`);
    const scenario = catTag.split(/[｜|]/)[0].trim();
    assert(CANONICAL_SCENARIOS.includes(scenario), `Invalid scenario in INDEX.md: "${scenario}" in row: ${row}`);
  }
});

test('all cases and evidence files have plain-language title and purpose either in markdown or copy.json', () => {
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();
  const evidenceFiles = fs.readdirSync(path.join(root, 'evidence')).filter(f => f.endsWith('.md')).sort();
  const targets = [
    ...caseFiles.map(f => ({ dir: 'cases', file: f })),
    ...evidenceFiles.map(f => ({ dir: 'evidence', file: f }))
  ];
  const copy = JSON.parse(fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'));

  const missingTitleOrPurpose = [];
  const missingNativeMarkdown = [];

  for (const { dir, file } of targets) {
    const content = fs.readFileSync(path.join(root, dir, file), 'utf8');
    const lead = content.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];
    const idMatch = content.match(/^#\s*(UC-\d+)/m);
    const id = idMatch ? idMatch[1] : null;

    const hasNativeTitle = /^-\s*網站標題\s*[：:]\s*(.+)$/m.test(lead);
    const hasNativeWhat = /^-\s*一句話用途\s*[：:]\s*(.+)$/m.test(lead);

    if (!hasNativeTitle || !hasNativeWhat) {
      missingNativeMarkdown.push({ file: `${dir}/${file}`, id, hasNativeTitle, hasNativeWhat });
    }

    const hasTitle = hasNativeTitle || (id && copy[id]?.title);
    const hasWhat = hasNativeWhat || (id && copy[id]?.what);

    if (!hasTitle || !hasWhat) {
      missingTitleOrPurpose.push({ file: `${dir}/${file}`, id, hasTitle: !!hasTitle, hasWhat: !!hasWhat });
    }
  }

  assert.deepEqual(missingTitleOrPurpose, [], `Files missing plain-language title or purpose: ${JSON.stringify(missingTitleOrPurpose)}`);
  assert.deepEqual(missingNativeMarkdown, [], `Files missing native title/purpose in markdown: ${JSON.stringify(missingNativeMarkdown)}`);
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

test('app.js metadata accurately extracts verification date rather than historical publication date', () => {
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];
  class Node { constructor(tag) { this.tagName = tag; this.children = []; } append(...c) { this.children.push(...c); } }
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: { createElement: t => new Node(t), createTextNode: text => ({ textContent: text }) }
  });
  vm.runInContext(source + '\nthis.api={metadata,parseFile};', context);

  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();
  for (const file of caseFiles) {
    const raw = fs.readFileSync(path.join(root, 'cases', file), 'utf8');
    const entry = context.api.parseFile(`cases/${file}`, raw)[0];
    assert(entry.date && /20\d{2}-\d{2}-\d{2}/.test(entry.date), `Case ${file} must have a valid extracted date, got "${entry.date}"`);
  }

  // Verify specific cases where historical post date precedes verification date
  const uc330 = context.api.parseFile('cases/330-unsupported-home-device-commissioning-validation.md', fs.readFileSync(path.join(root, 'cases/330-unsupported-home-device-commissioning-validation.md'), 'utf8'))[0];
  assert.equal(uc330.date, '2026-10-18', 'UC-330 must extract verification date 2026-10-18 instead of post date 2026-08-31');

  const uc101 = context.api.parseFile('cases/101-procurement-capability-shortlist.md', fs.readFileSync(path.join(root, 'cases/101-procurement-capability-shortlist.md'), 'utf8'))[0];
  assert.equal(uc101.date, '2026-10-16', 'UC-101 must extract verification date 2026-10-16 instead of post date 2026-10-09');
});
