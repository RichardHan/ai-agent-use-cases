'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const installer = fs.readFileSync(path.join(root, 'scripts/install-browser-tools.sh'), 'utf8');
const sourceGuide = fs.readFileSync(path.join(root, '.github/workflows/source-guide-qa.yml'), 'utf8');

test('CJK font install does not terminate a progressing download at a fixed elapsed limit', () => {
  assert.doesNotMatch(installer, /INSTALL_ATTEMPT_SECONDS|ATTEMPT_SECONDS|status=capped/);
  assert.match(installer, /while kill -0 "\$pid"/);
  assert.match(installer, /wait "\$pid"/);
});

test('font install keeps its stalled-download watchdog and bounded CI job', () => {
  assert.match(installer, /INSTALL_STALL_SECONDS:-180/);
  assert.match(installer, /stagnant.*-ge.*STALL_SECONDS/);
  assert.match(installer, /status=stalled/);
  assert.match(installer, /stop_install "\$pid"/);
  assert.match(installer, /INSTALL_FONT_ATTEMPTS:-3/);
  assert.match(sourceGuide, /timeout-minutes:\s*55/);
  assert.match(sourceGuide, /bash scripts\/install-browser-tools\.sh/);
});
