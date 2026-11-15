'use strict';
// The slow-load fallback is `index.html` -> `INDEX.html` -> `cases/*.html`.
// Those case pages are rendered by Jekyll, which does not turn a bare URL into
// a link. The SPA does, so without this check the same case can have a clickable
// source in the drawer and an unclickable one in the server-rendered page.
//
// This runs against the actual `_site` build in Website QA, not against the
// Markdown source: only the renderer can prove `[url](url)` became an anchor.
const fs = require('node:fs');
const path = require('node:path');

// Without the trailing slash: an absolute same-site link may be written either
// way, and neither form is an external source.
const SELF_ORIGIN = 'https://richardhan.github.io/ai-agent-use-cases';
const EVIDENCE_LABELS = [
  ['author-demo', '作者報告／示範'],
  ['official', '官方自報'],
  ['designed', '設計／未實跑'],
  ['unverified', '尚待查證'],
];

function externalSourceLinks(html) {
  return [...html.matchAll(/<a\s+[^>]*href="([^"]+)"/gi)]
    .map(match => match[1])
    .filter(href => /^https?:\/\//i.test(href) && href !== SELF_ORIGIN && !href.startsWith(SELF_ORIGIN + '/'));
}

function checkFallbackReading(root) {
  const failures = [];
  const indexPath = path.join(root, 'INDEX.html');
  if (!fs.existsSync(indexPath)) return {checked: 0, failures: ['INDEX.html is missing']};
  const index = fs.readFileSync(indexPath, 'utf8');

  if (!/怎麼讀這頁/.test(index)) failures.push('INDEX.html is missing the reading guide');
  if (!/誰提出主張/.test(index) || !/不是「誰驗證」/.test(index)) {
    failures.push('INDEX.html must distinguish the claimant from verification');
  }
  for (const [token, label] of EVIDENCE_LABELS) {
    if (!index.includes(token) || !index.includes(label)) {
      failures.push(`INDEX.html does not document ${token} as ${label}`);
    }
  }
  if (!/<a\s+[^>]*href="(?:[^"]*\/)?index\.html"/i.test(index)) {
    failures.push('INDEX.html does not link back to the searchable home page');
  }

  const pages = [];
  for (const folder of ['cases', 'evidence']) {
    const dir = path.join(root, folder);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter(name => name.endsWith('.html')).sort()) {
      pages.push(path.join(folder, name));
    }
  }
  if (pages.length === 0) return {checked: 0, failures: failures.concat('no rendered case pages found')};

  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    if (externalSourceLinks(html).length === 0) {
      failures.push(`${page}: no clickable source link`);
    }
  }

  // The catalog is the build's own list of corpus sources. Require a rendered
  // page for every entry, so a partial build cannot pass by checking only the
  // pages that happened to be emitted.
  const catalogPath = path.join(root, 'catalog.json');
  if (fs.existsSync(catalogPath)) {
    let files = [];
    try { files = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).files || []; }
    catch (error) { failures.push(`catalog.json cannot be read: ${error.message}`); }
    const expected = files
      .filter(file => /^(?:cases|evidence)\/.+\.md$/.test(file))
      .map(file => file.replace(/\.md$/, '.html'));
    const rendered = new Set(pages);
    for (const page of expected) {
      if (!rendered.has(page)) failures.push(`${page}: corpus entry has no rendered page`);
    }
  }

  return {checked: pages.length, failures};
}

module.exports = {checkFallbackReading, externalSourceLinks, SELF_ORIGIN};

if (require.main === module) {
  const root = process.argv[2];
  if (!root) throw new Error('Usage: node scripts/check-fallback-reading.cjs <built-site-directory>');
  const {checked, failures} = checkFallbackReading(root);
  if (failures.length) {
    console.error(`FAIL: fallback reading has ${failures.length} problem(s) across ${checked} rendered pages`);
    for (const failure of failures.slice(0, 20)) console.error(`- ${failure}`);
    if (failures.length > 20) console.error(`- … ${failures.length - 20} more`);
    process.exit(1);
  }
  console.log(`PASS: ${checked} rendered case pages expose a clickable source; INDEX explains the evidence codes`);
}
