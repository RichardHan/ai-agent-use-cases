'use strict';
// Contract guard: the hero keeps every task link even though phones disclose
// the long directory in two steps. Removing links or the disclosure control
// would silently shrink the visitor's problem-first entry points.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const hero = html.match(/<section class="discovery-hero"[\s\S]*?<\/section>/)?.[0] || '';

test('hero keeps a labelled disclosure for the long task directory', () => {
  assert.match(hero, /<nav class="hero-problem-tags" id="hero-problem-tags"/);
  const toggle = hero.match(/<button id="problem-tags-toggle"[^>]*>/)?.[0] || '';
  assert.ok(toggle, 'hero must contain the problem tags disclosure button');
  assert.match(toggle, /aria-controls="hero-problem-tags"/);
  assert.match(toggle, /aria-expanded="false"/);
  assert.match(toggle, /\bhidden\b/, 'without JavaScript the button stays hidden and every link remains visible');
});

test('disclosure does not remove any task link from the hero', () => {
  const links = [...hero.matchAll(/<a class="problem-tag" href="\?q=([^"#]+)#explore">/g)].map(match => match[1]);
  assert.equal(links.length, 53, 'the full 53-task directory must stay in the hero');
  assert.equal(new Set(links).size, links.length, 'task links must not repeat');
  for (const task of ['日報', '會議', '代碼審查', '合約審核', '安全防護', '人工審批']) {
    assert.ok(links.includes(task), `task directory must keep ${task}`);
  }
});
