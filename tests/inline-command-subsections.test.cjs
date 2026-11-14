'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { selectCopySections, promptSections } = require('../assets/reader.js');

const TARGET_CASES = [
  'cases/002-video-production.md',
  'cases/003-store-operations.md',
  'cases/005-cloud-pr-review.md',
  'cases/006-facebook-publication.md',
  'cases/023-launch-material-revision.md',
  'cases/024-missing-invoice-check.md',
  'cases/030-interactive-study-guide.md',
  'cases/041-routine-health-exception-ops.md',
  'cases/049-daily-inbox-report-graduated-trust.md',
  'cases/073-customer-journey-content-audit.md',
  'cases/089-digital-declutter-approval-plan.md',
  'cases/314-agent-sandbox-always-on-service-failure.md',
  'cases/340-tool-response-evidence-capture-acceptance.md'
];

test('all 13 target cases with structured actionable commands must have standalone H3 copyable prompt sections for each prompt', () => {
  // Expected minimum copyable sections per case after promotion of all 15 inline command prompts
  const EXPECTED_MIN_COPY_SECTIONS = {
    'cases/002-video-production.md': 5,
    'cases/003-store-operations.md': 3,
    'cases/005-cloud-pr-review.md': 6,
    'cases/006-facebook-publication.md': 4,
    'cases/023-launch-material-revision.md': 4,
    'cases/024-missing-invoice-check.md': 2,
    'cases/030-interactive-study-guide.md': 3,
    'cases/041-routine-health-exception-ops.md': 2,
    'cases/049-daily-inbox-report-graduated-trust.md': 3,
    'cases/073-customer-journey-content-audit.md': 5,
    'cases/089-digital-declutter-approval-plan.md': 2,
    'cases/314-agent-sandbox-always-on-service-failure.md': 2,
    'cases/340-tool-response-evidence-capture-acceptance.md': 2
  };

  for (const file of TARGET_CASES) {
    const content = fs.readFileSync(file, 'utf8');
    const sections = promptSections(content);
    const copyIndices = selectCopySections(sections, 'case');
    const expected = EXPECTED_MIN_COPY_SECTIONS[file];
    assert.ok(
      copyIndices.length >= expected,
      `${file} expected at least ${expected} copyable prompt sections, but found ${copyIndices.length}`
    );
  }
});

test('no target cases contain raw unpromoted inline command lines starting with 可貼指令：', () => {
  for (const file of TARGET_CASES) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      assert.ok(
        !/^[ \t]*可貼指令[：:]/.test(line),
        `${file}:L${idx + 1} still contains raw inline command without H3 promotion: ${line.slice(0, 40)}`
      );
    });
  }
});
