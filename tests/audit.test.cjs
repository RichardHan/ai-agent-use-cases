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
    if (host.startsWith('www.') && host !== 'www.youtube.com') host = host.slice(4);
    if (host === 'twitter.com' || host === 'mobile.twitter.com' || host === 'mobile.x.com' || host === 'm.x.com') host = 'x.com';
    if (host === 'old.reddit.com' || host === 'm.reddit.com' || host === 'new.reddit.com') host = 'reddit.com';
    if (host === 'm.facebook.com' || host === 'web.facebook.com') host = 'facebook.com';
    if (host === 'm.meta.com') host = 'meta.com';
    if (host === 'm.youtube.com' || host === 'youtube.com') host = 'www.youtube.com';
    if (host === 'youtu.be') {
      host = 'www.youtube.com';
      const id = u.pathname.slice(1);
      u.pathname = '/watch';
      u.searchParams.set('v', id);
    }
    const tracking = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ref', 's', 't', 'feature', 'open', 'context', 'hl', 'mobile-help', 'track', 'raw_json', 'si', 'igsh', 'trk', 'spm_id_from', 'spm', 'ref_src', 'ref_url', 'from', 'source', 'co', 'tabs', 'view', 'platform', 'see-all', 'payment-ui', 'provider', 'provider_info', 'fit', 'tag', 'query'];
    tracking.forEach(p => u.searchParams.delete(p));
    u.hash = '';
    if (host === 'reddit.com') u.pathname = u.pathname.replace(/\.json$/, '');
    const pathNoSlash = u.pathname.replace(/\/+$/, '');
    const protocol = u.protocol === 'http:' ? 'https:' : u.protocol;
    return (protocol + '//' + host + pathNoSlash + (u.search ? u.search : '')).toLowerCase();
  } catch {
    return null;
  }
}

test('all cases and evidence files have valid scenario, non-empty tags, and verification date', () => {
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md')).sort();
  const evidenceFiles = fs.readdirSync(path.join(root, 'evidence')).filter(f => f.endsWith('.md')).sort();
  assert(caseFiles.length >= 330, `Expected at least 330 cases, found ${caseFiles.length}`);
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

    // Ensure raw URLs in markdown are properly bracketed and do not attach unclosed fullwidth closing punctuation or CJK characters
    const unbracketedPunctuationUrls = content.match(/https?:\/\/[^\s)\]\"'<>]+[）〕』，。：；」”》】、！]/g) || [];
    for (const rawUrl of unbracketedPunctuationUrls) {
      suspiciousPlaceholders.push({ file: `${dir}/${file}`, url: rawUrl, reason: 'leaked trailing fullwidth punctuation' });
    }
  }

  assert.deepEqual(missingExternalSource, [], `Files missing external source: ${missingExternalSource.join(', ')}`);
  assert.deepEqual(suspiciousPlaceholders, [], `Files with placeholder or malformed URLs: ${JSON.stringify(suspiciousPlaceholders)}`);

  // Verify specific cases where leaked CJK punctuation was resolved
  const uc071Content = fs.readFileSync(path.join(root, 'cases/071-obsidian-dots-visible-memory.md'), 'utf8');
  assert(!/https?:\/\/[^\s)\]\"'<>]+[，。：；]/.test(uc071Content), 'UC-071 must not have leaked CJK punctuation attached to raw URLs');
  const uc079Content = fs.readFileSync(path.join(root, 'cases/079-business-email-alias-diagnosis.md'), 'utf8');
  assert(!/https?:\/\/[^\s)\]\"'<>]+[，。：；]/.test(uc079Content), 'UC-079 must not have leaked CJK punctuation attached to raw URLs');
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
  assert.equal(duplicates.length, 49, `Candidate duplicate detector must identify exactly 49 candidate clusters across corpus, found ${duplicates.length}`);
  assert.deepEqual(duplicates.find(d=>d.url==='https://learn.chatgpt.com/docs/dots/tasks-and-memory')?.cases,
    ['cases/005-cloud-pr-review.md','cases/365-scheduled-task-inplace-edit-readback.md','cases/369-existing-task-view-route-reconciliation.md']);
  assert.deepEqual(duplicates.find(d=>d.url==='https://reddit.com/r/grokbot/comments/1x9kmc4/groq_bot_use_cases_compilation_i_complied_from_10')?.cases,
    ['cases/030-interactive-study-guide.md','cases/360-paint-stage-quantity-spec-cart.md']);
  const newSharedSource=duplicates.find(d=>d.url==='https://note.com/sustainamate_ai/n/n26d37039c129');
  assert.deepEqual(newSharedSource?.cases,['cases/225-receipt-transaction-evidence-matching.md','cases/234-proposal-attachment-consistency-send-gate.md'],'new shared source is a candidate only; both original cases remain');
  // Confirm that candidate duplicates are purely listed as candidates and all original cases remain intact
  assert(caseFiles.length >= 330, `Corpus case count must remain intact (no automatic deletion of candidates); got ${caseFiles.length}`);

  // Specifically verify known shared discussion thread candidates are identified
  const redditDiscussion = duplicates.find(d => d.url.includes('1wa57uk/comment/p8gwy2e'));
  assert(redditDiscussion, 'Must detect shared Reddit comment thread candidate');
  assert.equal(redditDiscussion.cases.length, 4, 'Shared thread candidate has 4 cases');
  assert(redditDiscussion.cases.includes('cases/003-store-operations.md'), 'Shared thread candidate includes UC-003');
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

  const toolchainPrCandidate = duplicates.find(d => d.url.includes('github.com/toolchainjp/toolchainjp-lp/pull/1'));
  assert(toolchainPrCandidate, 'Must detect shared Toolchain JP pull request between UC-006 and UC-042');
  assert(toolchainPrCandidate.cases.includes('cases/006-facebook-publication.md'));
  assert(toolchainPrCandidate.cases.includes('cases/042-dots-credential-multibot-return.md'));

  const secureTunnelsCandidate = duplicates.find(d => d.url.includes('guides/secure-mcp-tunnels'));
  assert(secureTunnelsCandidate, 'Must detect shared Secure MCP Tunnels guide between UC-074 and UC-239');
  assert(secureTunnelsCandidate.cases.includes('cases/074-event-trigger-readback.md'));
  assert(secureTunnelsCandidate.cases.includes('cases/239-wearable-conversation-delivery-state-validation.md'));

  const dotsControlsCandidate = duplicates.find(d => d.url.includes('learn.chatgpt.com/docs/dots/controls'));
  assert(dotsControlsCandidate, 'Must detect shared ChatGPT dots controls documentation across UC-005, UC-023, UC-073, and UC-218');
  assert(dotsControlsCandidate.cases.includes('cases/005-cloud-pr-review.md'));
  assert(dotsControlsCandidate.cases.includes('cases/023-launch-material-revision.md'));
  assert(dotsControlsCandidate.cases.includes('cases/073-customer-journey-content-audit.md'));
  assert(dotsControlsCandidate.cases.includes('cases/218-third-party-skill-install-trust-review.md'));

  const dotsComputersCandidate = duplicates.find(d => d.url.includes('learn.chatgpt.com/docs/dots/computers-and-apps'));
  assert(dotsComputersCandidate, 'Must detect shared ChatGPT dots computers-and-apps documentation across UC-005, UC-006, and UC-025');
  assert(dotsComputersCandidate.cases.includes('cases/005-cloud-pr-review.md'));
  assert(dotsComputersCandidate.cases.includes('cases/006-facebook-publication.md'));
  assert(dotsComputersCandidate.cases.includes('cases/025-team-event-follow-through.md'));

  const devToDotsCandidate = duplicates.find(d => d.url.includes('dev.to/uehara'));
  assert(devToDotsCandidate, 'Must detect shared Dev.to ChatGPT Dots article between UC-283 and evidence/008');
  assert(devToDotsCandidate.cases.includes('cases/283-dots-connected-apps-permission-pitfalls.md'));
  assert(devToDotsCandidate.cases.includes('evidence/008-morning-brief-validation.md'));

  const grokGtmCandidate = duplicates.find(d => d.url.includes('x.ai/bot/guides/grok-bot-for-gtm'));
  assert(grokGtmCandidate, 'Must detect shared Grok Bot for GTM guide between UC-017 and UC-019');
  assert(grokGtmCandidate.cases.includes('cases/017-prospect-research-drafts.md'));
  assert(grokGtmCandidate.cases.includes('cases/019-call-to-customer-deck.md'));

  const grokLegalOpsCandidate = duplicates.find(d => d.url.includes('x.ai/bot/guides/grok-bot-for-legal-ops'));
  assert(grokLegalOpsCandidate, 'Must detect shared Grok Bot for Legal Ops guide between UC-021 and UC-154');
  assert(grokLegalOpsCandidate.cases.includes('cases/021-legal-request-handoff.md'));
  assert(grokLegalOpsCandidate.cases.includes('cases/154-contract-review-wait-time-analysis.md'));

  const openaiDotsCandidate = duplicates.find(d => d.url.includes('openai.com/index/introducing-dots'));
  assert(openaiDotsCandidate, 'Must detect shared OpenAI Introducing Dots announcement between UC-023 and UC-024');
  assert(openaiDotsCandidate.cases.includes('cases/023-launch-material-revision.md'));
  assert(openaiDotsCandidate.cases.includes('cases/024-missing-invoice-check.md'));

  const semicolonCandidate = duplicates.find(d => d.url.includes('semicolonexpected.substack.com/p/i-tried-meta-muse-ai-specific-things'));
  assert(semicolonCandidate, 'Must detect shared Semicolon Expected newsletter between UC-043 and UC-241');
  assert(semicolonCandidate.cases.includes('cases/043-public-events-calendar.md'));
  assert(semicolonCandidate.cases.includes('cases/241-community-participation-spam-review.md'));

  const aiAgentsLibraryCandidate = duplicates.find(d => d.url.includes('aiagentslibrary.com/blog/meta-muse-review'));
  assert(aiAgentsLibraryCandidate, 'Must detect shared AI Agents Library review between UC-039 and UC-049');
  assert(aiAgentsLibraryCandidate.cases.includes('cases/039-competitor-positioning-review.md'));
  assert(aiAgentsLibraryCandidate.cases.includes('cases/049-daily-inbox-report-graduated-trust.md'));

  const toolchainBlogCandidate = duplicates.find(d => d.url.includes('toolchain.jp/blog/2026-10-01/grok-bot-feature-verification'));
  assert(toolchainBlogCandidate, 'Must detect shared Toolchain blog verification between UC-006 and UC-042');
  assert(toolchainBlogCandidate.cases.includes('cases/006-facebook-publication.md'));
  assert(toolchainBlogCandidate.cases.includes('cases/042-dots-credential-multibot-return.md'));

  const museSmallBusinessCandidate = duplicates.find(d => d.url.includes('introducing-muse-small-business'));
  assert(museSmallBusinessCandidate, 'Must detect shared Muse Small Business announcement across UC-022, UC-033, UC-034, and UC-179');
  assert(museSmallBusinessCandidate.cases.includes('cases/022-ad-spend-conversion-check.md'));
  assert(museSmallBusinessCandidate.cases.includes('cases/033-business-experiment-plan.md'));
  assert(museSmallBusinessCandidate.cases.includes('cases/034-expense-anomaly-review.md'));
  assert(museSmallBusinessCandidate.cases.includes('cases/179-duplicate-customer-email-flow-repair.md'));

  const introducingMuseCandidate = duplicates.find(d => d.url.includes('introducing.muse.ai'));
  assert(introducingMuseCandidate, 'Must detect shared Introducing Muse site across UC-026, UC-030, UC-031, and UC-032');
  assert(introducingMuseCandidate.cases.includes('cases/026-school-deadline-list.md'));
  assert(introducingMuseCandidate.cases.includes('cases/030-interactive-study-guide.md'));
  assert(introducingMuseCandidate.cases.includes('cases/031-spending-dashboard.md'));
  assert(introducingMuseCandidate.cases.includes('cases/032-sleep-record-chart.md'));

  const designingGrokCandidate = duplicates.find(d => d.url.includes('designing-grok-bot-with-grok-bot'));
  assert(designingGrokCandidate, 'Must detect shared Designing Grok Bot guide between UC-002 and UC-020');
  assert(designingGrokCandidate.cases.includes('cases/002-video-production.md'));
  assert(designingGrokCandidate.cases.includes('cases/020-figma-batch-cards.md'));

  const dotsPrivacyFaqCandidate = duplicates.find(d => d.url.includes('20001529-dots-privacy-security-and-safety-faqs'));
  assert(dotsPrivacyFaqCandidate, 'Must detect shared Dots Privacy FAQs between UC-006 and UC-071');
  assert(dotsPrivacyFaqCandidate.cases.includes('cases/006-facebook-publication.md'));
  assert(dotsPrivacyFaqCandidate.cases.includes('cases/071-obsidian-dots-visible-memory.md'));

  const redditProcureCandidate2 = duplicates.find(d => d.url.includes('peuhvej'));
  assert(redditProcureCandidate2, 'Must detect shared Reddit procurement discussion comment between UC-101 and UC-102');
  assert(redditProcureCandidate2.cases.includes('cases/101-procurement-capability-shortlist.md'));
  assert(redditProcureCandidate2.cases.includes('cases/102-regulatory-change-safety-form-draft.md'));

  const toolchainPr12Candidate = duplicates.find(d => d.url.includes('github.com/toolchainjp/toolchainjp-lp/pull/12'));
  assert(toolchainPr12Candidate, 'Must detect shared Toolchain JP pull request 12 between UC-006 and UC-042');
  assert(toolchainPr12Candidate.cases.includes('cases/006-facebook-publication.md'));
  assert(toolchainPr12Candidate.cases.includes('cases/042-dots-credential-multibot-return.md'));

  const toolchainPr13Candidate = duplicates.find(d => d.url.includes('github.com/toolchainjp/toolchainjp-lp/pull/13'));
  assert(toolchainPr13Candidate, 'Must detect shared Toolchain JP pull request 13 between UC-006 and UC-042');
  assert(toolchainPr13Candidate.cases.includes('cases/006-facebook-publication.md'));
  assert(toolchainPr13Candidate.cases.includes('cases/042-dots-credential-multibot-return.md'));

  const grokBotComputersCandidate = duplicates.find(d => d.url.includes('docs.x.ai/grok-bot/computer-and-apps'));
  assert(grokBotComputersCandidate, 'Must detect shared Grok Bot computers-and-apps across 19 cases');
  assert.equal(grokBotComputersCandidate.cases.length, 19);
  assert(grokBotComputersCandidate.cases.includes('cases/005-cloud-pr-review.md'));
  assert(grokBotComputersCandidate.cases.includes('cases/006-facebook-publication.md'));
  assert(grokBotComputersCandidate.cases.includes('cases/027-recipe-shopping-plan.md'));
  assert(grokBotComputersCandidate.cases.includes('cases/046-followed-accounts-daily-digest.md'));
  assert(grokBotComputersCandidate.cases.includes('evidence/009-background-transfer-template.md'));

  const metaHelpSubscriptionsCandidate = duplicates.find(d => d.url.includes('meta.com/help/subscriptions/1021145227643680'));
  assert(metaHelpSubscriptionsCandidate, 'Must detect shared Meta Help subscriptions page across 10 cases');
  assert.equal(metaHelpSubscriptionsCandidate.cases.length, 10);
  assert(metaHelpSubscriptionsCandidate.cases.includes('cases/016-marketplace-selling-buyer-messages.md'));
  assert(metaHelpSubscriptionsCandidate.cases.includes('cases/026-school-deadline-list.md'));
  assert(metaHelpSubscriptionsCandidate.cases.includes('cases/027-recipe-shopping-plan.md'));
  assert(metaHelpSubscriptionsCandidate.cases.includes('cases/028-bill-comparison-preparation.md'));
  assert(metaHelpSubscriptionsCandidate.cases.includes('cases/029-exercise-time-replan.md'));
  assert(metaHelpSubscriptionsCandidate.cases.includes('cases/030-interactive-study-guide.md'));
  assert(metaHelpSubscriptionsCandidate.cases.includes('cases/031-spending-dashboard.md'));
  assert(metaHelpSubscriptionsCandidate.cases.includes('cases/032-sleep-record-chart.md'));
  assert(metaHelpSubscriptionsCandidate.cases.includes('cases/033-business-experiment-plan.md'));
  assert(metaHelpSubscriptionsCandidate.cases.includes('cases/034-expense-anomaly-review.md'));

  const grokBotAutomationsCandidate = duplicates.find(d => d.url.includes('docs.x.ai/grok-bot/skills-routines-and-automations'));
  assert(grokBotAutomationsCandidate, 'Must detect shared Grok Bot skills-routines-and-automations across 9 cases');
  assert.equal(grokBotAutomationsCandidate.cases.length, 9);
  assert(grokBotAutomationsCandidate.cases.includes('cases/006-facebook-publication.md'));
  assert(grokBotAutomationsCandidate.cases.includes('cases/015-public-page-change-watch.md'));
  assert(grokBotAutomationsCandidate.cases.includes('cases/039-competitor-positioning-review.md'));
  assert(grokBotAutomationsCandidate.cases.includes('cases/046-followed-accounts-daily-digest.md'));
  assert(grokBotAutomationsCandidate.cases.includes('cases/060-x-mention-sourced-answer-bot.md'));
  assert(grokBotAutomationsCandidate.cases.includes('cases/061-dispatcher-bot-typed-commands-ledger.md'));
  assert(grokBotAutomationsCandidate.cases.includes('cases/208-portable-skill-binding-approval-check.md'));
  assert(grokBotAutomationsCandidate.cases.includes('cases/268-agency-campaign-bundle-approval.md'));
  assert(grokBotAutomationsCandidate.cases.includes('cases/269-single-vps-sysadmin-bot.md'));

  const musePersonalAgentCandidate = duplicates.find(d => d.url.includes('about.fb.com/news/2026/09/introducing-muse-personal-ai-agent'));
  assert(musePersonalAgentCandidate, 'Must detect shared Introducing Muse personal AI agent announcement across 9 cases');
  assert.equal(musePersonalAgentCandidate.cases.length, 9);
  assert(musePersonalAgentCandidate.cases.includes('cases/016-marketplace-selling-buyer-messages.md'));
  assert(musePersonalAgentCandidate.cases.includes('cases/027-recipe-shopping-plan.md'));
  assert(musePersonalAgentCandidate.cases.includes('cases/028-bill-comparison-preparation.md'));
  assert(musePersonalAgentCandidate.cases.includes('cases/029-exercise-time-replan.md'));
  assert(musePersonalAgentCandidate.cases.includes('cases/067-agent-app-rebuild-manual.md'));
  assert(musePersonalAgentCandidate.cases.includes('cases/104-genealogy-animation-print.md'));
  assert(musePersonalAgentCandidate.cases.includes('cases/105-gift-card-balance-inventory.md'));
  assert(musePersonalAgentCandidate.cases.includes('cases/107-old-blog-private-audio-archive.md'));
  assert(musePersonalAgentCandidate.cases.includes('cases/108-golf-round-practice-data-review.md'));

  const grokBotBotsCandidate = duplicates.find(d => d.url === 'https://docs.x.ai/grok-bot/bots');
  assert(grokBotBotsCandidate, 'Must detect shared Grok Bot bots docs across 7 cases');
  assert.equal(grokBotBotsCandidate.cases.length, 7);
  assert(grokBotBotsCandidate.cases.includes('cases/003-store-operations.md'));
  assert(grokBotBotsCandidate.cases.includes('evidence/009-background-transfer-template.md'));
  assert(grokBotBotsCandidate.cases.includes('cases/055-tweet-project-intake-research-monitor.md'));
  assert(grokBotBotsCandidate.cases.includes('cases/061-dispatcher-bot-typed-commands-ledger.md'));
  assert(grokBotBotsCandidate.cases.includes('cases/255-active-memory-version-consolidation-review.md'));
  assert(grokBotBotsCandidate.cases.includes('cases/268-agency-campaign-bundle-approval.md'));
  assert(grokBotBotsCandidate.cases.includes('cases/270-subscription-replacement-blind-eval.md'));


  const dotsLearnCandidate = duplicates.find(d => d.url === 'https://learn.chatgpt.com/docs/dots');
  assert(dotsLearnCandidate, 'Must detect shared ChatGPT dots base documentation across 6 cases');
  assert.equal(dotsLearnCandidate.cases.length, 6);
  assert(dotsLearnCandidate.cases.includes('cases/023-launch-material-revision.md'));
  assert(dotsLearnCandidate.cases.includes('cases/024-missing-invoice-check.md'));
  assert(dotsLearnCandidate.cases.includes('cases/025-team-event-follow-through.md'));
  assert(dotsLearnCandidate.cases.includes('cases/030-interactive-study-guide.md'));
  assert(dotsLearnCandidate.cases.includes('cases/035-job-search-application-drafts.md'));
  assert(dotsLearnCandidate.cases.includes('cases/073-customer-journey-content-audit.md'));

  const grokBotFaqCandidate = duplicates.find(d => d.url.includes('docs.x.ai/grok-bot/faq'));
  assert(grokBotFaqCandidate, 'Must detect shared Grok Bot FAQ docs across 5 cases');
  assert.equal(grokBotFaqCandidate.cases.length, 5);
  assert(grokBotFaqCandidate.cases.includes('cases/027-recipe-shopping-plan.md'));
  assert(grokBotFaqCandidate.cases.includes('cases/054-music-video-multi-tool-pipeline.md'));
  assert(grokBotFaqCandidate.cases.includes('cases/073-customer-journey-content-audit.md'));
  assert(grokBotFaqCandidate.cases.includes('cases/225-receipt-transaction-evidence-matching.md'));
  assert(grokBotFaqCandidate.cases.includes('cases/234-proposal-attachment-consistency-send-gate.md'));

  const aiForMortalsCandidate = duplicates.find(d => d.url.includes('aiformortals.co/blog/grok-bot-vs-meta-muse-vs-chatgpt-dots'));
  assert(aiForMortalsCandidate, 'Must detect shared AI for Mortals comparison across UC-001, UC-002, and UC-003');
  assert.equal(aiForMortalsCandidate.cases.length, 3);
  assert(aiForMortalsCandidate.cases.includes('cases/001-travel-checkout.md'));
  assert(aiForMortalsCandidate.cases.includes('cases/002-video-production.md'));
  assert(aiForMortalsCandidate.cases.includes('cases/003-store-operations.md'));

  const steveFebbraroCandidate = duplicates.find(d => d.url.includes('2101333135879242062'));
  assert(steveFebbraroCandidate, 'Must detect shared SteveFebbraro1 source between cases/028 and sources/pending.md');
  assert(steveFebbraroCandidate.cases.includes('cases/028-bill-comparison-preparation.md'));
  assert(steveFebbraroCandidate.cases.includes('sources/pending.md'));

  const billyStickerCandidate = duplicates.find(d => d.url.includes('2104003676612567182'));
  assert(billyStickerCandidate, 'Must detect shared billysticker source between cases/028 and sources/pending.md');
  assert(billyStickerCandidate.cases.includes('cases/028-bill-comparison-preparation.md'));
  assert(billyStickerCandidate.cases.includes('sources/pending.md'));

  const museBusinessCandidate = duplicates.find(d => d.url === 'https://muse.ai/business');
  assert(museBusinessCandidate, 'Must detect shared Muse Business official page across 11 cases');
  assert.equal(museBusinessCandidate.cases.length, 11);
  assert(museBusinessCandidate.cases.includes('cases/003-store-operations.md'));
  assert(museBusinessCandidate.cases.includes('cases/016-marketplace-selling-buyer-messages.md'));
  assert(museBusinessCandidate.cases.includes('cases/026-school-deadline-list.md'));
  assert(museBusinessCandidate.cases.includes('cases/034-expense-anomaly-review.md'));

  const metaAiHelpCandidate = duplicates.find(d => d.url.includes('meta.com/en-gb/help/artificial-intelligence/1687253048996149'));
  assert(metaAiHelpCandidate, 'Must detect shared Meta AI help page across 11 cases');
  assert.equal(metaAiHelpCandidate.cases.length, 11);
  assert(metaAiHelpCandidate.cases.includes('cases/016-marketplace-selling-buyer-messages.md'));
  assert(metaAiHelpCandidate.cases.includes('cases/026-school-deadline-list.md'));
  assert(metaAiHelpCandidate.cases.includes('cases/267-nfc-points-redemption-ledger.md'));

  const grokBotApprovalsCandidate = duplicates.find(d => d.url === 'https://docs.x.ai/grok-bot/approvals-security-and-privacy');
  assert(grokBotApprovalsCandidate, 'Must detect shared Grok Bot approvals-security-and-privacy docs across 11 files');
  assert.equal(grokBotApprovalsCandidate.cases.length, 11);
  assert(grokBotApprovalsCandidate.cases.includes('cases/101-procurement-capability-shortlist.md'));
  assert(grokBotApprovalsCandidate.cases.includes('cases/156-mail-system-migration-verification.md'));
  assert(grokBotApprovalsCandidate.cases.includes('cases/318-approved-account-form-shopify-customer-flow.md'));
  assert(grokBotApprovalsCandidate.cases.includes('evidence/009-background-transfer-template.md'));

  const grokLegalOpsGuideCandidate = duplicates.find(d => d.url === 'https://x.ai/bot/guides/grok-bot-for-legal-ops');
  assert(grokLegalOpsGuideCandidate, 'Must detect shared Grok Bot Legal Ops guide between UC-021 and UC-154 via hash normalization');
  assert(grokLegalOpsGuideCandidate.cases.includes('cases/021-legal-request-handoff.md'));
  assert(grokLegalOpsGuideCandidate.cases.includes('cases/154-contract-review-wait-time-analysis.md'));

  // Verify YouTube normalization of pending lead URL
  assert.equal(normalizeSourceUrl('https://youtube.com/watch?v=ARMaDt5JBUg'), 'https://www.youtube.com/watch?v=armadt5jbug');
  assert.equal(normalizeSourceUrl('http://www.linkedin.com/in/test?ref_src=1'), 'https://linkedin.com/in/test');
  assert.equal(normalizeSourceUrl('https://www.github.com/foo/bar/'), 'https://github.com/foo/bar');
  assert.equal(normalizeSourceUrl('http://www.chatprd.ai/how-i-ai/alex-cornell-meta-muse-workflows?source=share'), 'https://chatprd.ai/how-i-ai/alex-cornell-meta-muse-workflows');
  assert.equal(normalizeSourceUrl('https://www.reddit.com/r/MetaAI/comments/1wydk5b/what_do_you_use_muse_for/.json?raw_json=1'), 'https://reddit.com/r/metaai/comments/1wydk5b/what_do_you_use_muse_for');
  assert.equal(normalizeSourceUrl('https://support.google.com/maps/answer/7280933?co=GENIE.Platform%3DDesktop&hl=en-en'), 'https://support.google.com/maps/answer/7280933');
  assert.equal(normalizeSourceUrl('https://learn.microsoft.com/en-us/power-automate/modern-approvals?tabs=new-designer'), 'https://learn.microsoft.com/en-us/power-automate/modern-approvals');
  assert.equal(normalizeSourceUrl('https://learn.microsoft.com/en-us/microsoft-365/admin/get-help-with-domains/create-dns-records-at-any-dns-hosting-provider?view=o365-worldwide'), 'https://learn.microsoft.com/en-us/microsoft-365/admin/get-help-with-domains/create-dns-records-at-any-dns-hosting-provider');
  assert.equal(normalizeSourceUrl('https://apps.apple.com/us/app/grok-bot/id6794501026?platform=iphone&see-all=reviews'), 'https://apps.apple.com/us/app/grok-bot/id6794501026');
  assert.equal(normalizeSourceUrl('https://docs.stripe.com/checkout/fulfillment.md?payment-ui=stripe-hosted'), 'https://docs.stripe.com/checkout/fulfillment.md');
  assert.equal(normalizeSourceUrl('https://biz.moneyforward.com/expense/function/?provider=ac_basic&provider_info=cv.76684.part.article'), 'https://biz.moneyforward.com/expense/function');
  assert.equal(normalizeSourceUrl('https://about.fb.com/wp-content/uploads/2026/09/02_inline_quote_01.jpg?fit=1920%2C1672'), 'https://about.fb.com/wp-content/uploads/2026/09/02_inline_quote_01.jpg');
  assert.equal(normalizeSourceUrl('https://video.twimg.com/amplify_video/2090401111203291136/vid/avc1/1280x720/qrir1QJtjy7X5_k6.mp4?tag=29'), 'https://video.twimg.com/amplify_video/2090401111203291136/vid/avc1/1280x720/qrir1qjtjy7x5_k6.mp4');
  assert.equal(normalizeSourceUrl('https://www.canva.com/help/bulk-create/?query=Bulk+Create'), 'https://canva.com/help/bulk-create');
  assert.equal(normalizeSourceUrl('https://www.shipai.club/programs/zero-to-launch/growth-engineering/deck?track=grok-bot'), 'https://shipai.club/programs/zero-to-launch/growth-engineering/deck');
  assert.equal(normalizeSourceUrl('https://support.ynab.com/en_us/reconciling-accounts-a-guide-BJFE3fHys?mobile-help=true'), 'https://support.ynab.com/en_us/reconciling-accounts-a-guide-bjfe3fhys');
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
  const indexMatch = indexContent.match(/截至\s*2026-10-\d{2}[^\n]*\*\*(\d+)[／/]1,000/);
  assert(indexMatch, 'INDEX.md must contain current qualified count');
  assert.equal(indexMatch[1], expectedQualified, `INDEX.md count (${indexMatch[1]}) must match audit doc (${expectedQualified})`);

  // Verify cases UC-342 through UC-359 are explicitly audited in qualification audit
  for (let id = 342; id <= 359; id++) {
    const ucRegex = new RegExp(`UC-${id}|\\b${id}\\b[^\n]*\\[\\.\\./cases/`);
    assert(ucRegex.test(auditContent), `UC-${id} must be explicitly evaluated in qualification audit document`);
  }

  // Specifically verify UC-357, UC-358, and UC-359 evaluations
  assert(/UC-357[^\n]*納入[^\n]*B/.test(auditContent), 'UC-357 must be audited as B-grade qualified in audit document');
  assert(/UC-358[^\n]*納入[^\n]*B/.test(auditContent), 'UC-358 must be audited as B-grade qualified in audit document');
  assert(/UC-359[^\n]*待定/.test(auditContent), 'UC-359 must be audited as pending (待定) in audit document');

  // Main cases count in INDEX.md header must match cases/ file count
  const caseFiles = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.md'));
  const mainPagesMatch = indexContent.match(/主要頁\s*(?:\d+[＋+]\d+＝)?(\d+)/);
  assert(mainPagesMatch, 'INDEX.md must state total main pages count');
  assert.equal(parseInt(mainPagesMatch[1], 10), caseFiles.length, `INDEX.md main pages (${mainPagesMatch[1]}) must match cases/ count (${caseFiles.length})`);

  // Verify all case and evidence links in INDEX.md exist on disk
  const links = Array.from(indexContent.matchAll(/\[(?:[^\]]*)\]\(((?:cases|evidence)\/[^)]+\.md)\)/g));
  assert(links.length >= 330, `Expected at least 330 links in INDEX.md, found ${links.length}`);
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

  const uc221 = context.api.parseFile('cases/221-human-signature-completed-copy-handoff.md', fs.readFileSync(path.join(root, 'cases/221-human-signature-completed-copy-handoff.md'), 'utf8'))[0];
  assert.equal(uc221.date, '2026-10-16', 'UC-221 must extract verification date 2026-10-16 instead of post date 2026-09-24');

  const uc222 = context.api.parseFile('cases/222-legacy-business-rule-test-oracle-review.md', fs.readFileSync(path.join(root, 'cases/222-legacy-business-rule-test-oracle-review.md'), 'utf8'))[0];
  assert.equal(uc222.date, '2026-10-16', 'UC-222 must extract verification date 2026-10-16 instead of post date 2026-09-28');

  const uc224 = context.api.parseFile('cases/224-multi-shadow-shared-geometry-inverse-design.md', fs.readFileSync(path.join(root, 'cases/224-multi-shadow-shared-geometry-inverse-design.md'), 'utf8'))[0];
  assert.equal(uc224.date, '2026-10-16', 'UC-224 must extract verification date 2026-10-16 instead of post date 2026-10-08');

  const uc239 = context.api.parseFile('cases/239-wearable-conversation-delivery-state-validation.md', fs.readFileSync(path.join(root, 'cases/239-wearable-conversation-delivery-state-validation.md'), 'utf8'))[0];
  assert.equal(uc239.date, '2026-10-16', 'UC-239 must extract verification date 2026-10-16 instead of header date 2026-10-18');

  const uc256 = context.api.parseFile('cases/256-interactive-mystery-knowledge-unlock-audit.md', fs.readFileSync(path.join(root, 'cases/256-interactive-mystery-knowledge-unlock-audit.md'), 'utf8'))[0];
  assert.equal(uc256.date, '2026-10-16', 'UC-256 must extract verification date 2026-10-16 instead of post date 2026-09-26');

  const uc257 = context.api.parseFile('cases/257-inbound-call-coverage-message-reconciliation.md', fs.readFileSync(path.join(root, 'cases/257-inbound-call-coverage-message-reconciliation.md'), 'utf8'))[0];
  assert.equal(uc257.date, '2026-10-16', 'UC-257 must extract verification date 2026-10-16 instead of post date 2026-09-29');

  const uc258 = context.api.parseFile('cases/258-scan-reconstruction-scale-topology-audit.md', fs.readFileSync(path.join(root, 'cases/258-scan-reconstruction-scale-topology-audit.md'), 'utf8'))[0];
  assert.equal(uc258.date, '2026-10-16', 'UC-258 must extract verification date 2026-10-16 instead of post date 2026-10-15');

  const uc259 = context.api.parseFile('cases/259-multistation-observation-control-robustness.md', fs.readFileSync(path.join(root, 'cases/259-multistation-observation-control-robustness.md'), 'utf8'))[0];
  assert.equal(uc259.date, '2026-10-16', 'UC-259 must extract verification date 2026-10-16 instead of post date 2026-10-11');

  const uc260 = context.api.parseFile('cases/260-vendor-master-gap-quotation-grouping.md', fs.readFileSync(path.join(root, 'cases/260-vendor-master-gap-quotation-grouping.md'), 'utf8'))[0];
  assert.equal(uc260.date, '2026-10-16', 'UC-260 must extract verification date 2026-10-16 instead of post date 2026-08-23');

  const uc278 = context.api.parseFile('cases/278-machining-center-configuration-concept.md', fs.readFileSync(path.join(root, 'cases/278-machining-center-configuration-concept.md'), 'utf8'))[0];
  assert.equal(uc278.date, '2026-10-17', 'UC-278 must extract verification date 2026-10-17 instead of post date 2026-10-11');
});
