'use strict';
// The fallback reader is the only server-rendered path into a case. These checks
// keep the source line clickable there after a future case is added in the old
// `原文：https://…` form, and keep the index's evidence-code legend honest.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const corpusFiles = [
  ...fs.readdirSync(path.join(root, 'cases')).filter(name => name.endsWith('.md')).map(name => `cases/${name}`),
  ...fs.readdirSync(path.join(root, 'evidence')).filter(name => name.endsWith('.md')).map(name => `evidence/${name}`),
  'sources/pending.md',
];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadApp() {
  const source = read('assets/app.js').split('/* Browser event bindings. */')[0];
  class Node { constructor(tag) { this.tagName = tag; this.children = []; } append(...children) { this.children.push(...children); } }
  const context = vm.createContext({
    URL,
    Discovery: require('../assets/discovery.js'),
    document: {createElement: tag => new Node(tag), createTextNode: text => ({textContent: text})},
  });
  vm.runInContext(source + '\nthis.api={PROOF_DEFINITIONS,withoutSourceUrls,unwrapUrlLabels};', context);
  return context.api;
}

test('every published corpus page keeps at least one clickable source', () => {
  const missing = corpusFiles.filter(file => !/\]\(https?:\/\//.test(read(file)));
  assert.deepEqual(missing, [], 'these pages have no Markdown source link: ' + missing.join(', '));
});

test('source bullets never leave a bare URL for the Jekyll fallback', () => {
  const bare = [];
  for (const file of corpusFiles) {
    for (const [index, line] of read(file).split('\n').entries()) {
      if (/^- [^：:\n]{1,16}[：:]\s*https?:\/\//.test(line)) bare.push(`${file}:${index + 1}`);
    }
  }
  assert.deepEqual(bare, [], 'Jekyll does not link bare URLs: ' + bare.join(', '));
});

test('the SPA still treats a URL-labelled source as a source, not as prose', () => {
  const {withoutSourceUrls, unwrapUrlLabels} = loadApp();
  const bare = withoutSourceUrls('網址：https://x.test/a 後續');
  const linked = withoutSourceUrls('網址：[https://x.test/a](https://x.test/a) 後續');
  assert.equal(linked.replace(/\s+/g, ' '), bare.replace(/\s+/g, ' '));
  assert.doesNotMatch(linked, /\[|\]|https?:/);
  assert.match(withoutSourceUrls('見[官方說明](https://x.test/a)'), /官方說明/);
  assert.equal(unwrapUrlLabels('網址：[https://x.test/a](https://x.test/a)'), '網址：https://x.test/a');
  assert.equal(unwrapUrlLabels('見[官方說明](https://x.test/a)'), '見[官方說明](https://x.test/a)');
});

test('INDEX documents every evidence token used by a case header with the SPA label', () => {
  const {PROOF_DEFINITIONS} = loadApp();
  const tokens = new Set();
  for (const file of corpusFiles.filter(file => file.startsWith('cases/'))) {
    for (const line of read(file).split('\n')) {
      if (!/^-\s*(?:證據狀態|來源證據|證據等級|證據)[：:]/.test(line)) continue;
      for (const match of line.matchAll(/`(author-demo|official|designed|unverified|author-self-report|pending-verification)`/g)) tokens.add(match[1]);
    }
  }
  assert.ok(tokens.size >= 6, 'the corpus should use all six documented machine tokens');
  const index = read('INDEX.md');
  for (const token of tokens) {
    const row = index.match(new RegExp('\\|\\s*`' + token + '`\\s*\\|\\s*([^|]+?)\\s*\\|'));
    assert.ok(row, 'INDEX must document the machine token ' + token);
    assert.ok(PROOF_DEFINITIONS[row[1]], `${token} is documented as "${row[1]}", which the SPA does not define`);
  }
});

test('the per-case fallback legend uses the same labels as the SPA', () => {
  const {PROOF_DEFINITIONS} = loadApp();
  const include = read('_includes/case-fallback-nav.html');
  const rows = [...include.matchAll(/<code>([a-z-]+)<\/code>\s*<strong>([^<]+)<\/strong>/g)];
  assert.deepEqual(rows.map(row => row[1]).sort(), ['author-demo', 'author-self-report', 'designed', 'official', 'pending-verification', 'unverified']);
  for (const [, token, label] of rows) {
    assert.ok(PROOF_DEFINITIONS[label], `${token} is explained as "${label}", which the SPA does not define`);
  }
});

test('the layout override keeps the Primer contract and only adds the case aid', () => {
  const layout = read('_layouts/default.html');
  for (const required of ['{% seo %}', 'assets/css/style.css', 'head-custom.html', 'anchor-js', '{{ content }}']) {
    assert.ok(layout.includes(required), 'layout must keep ' + required);
  }
  assert.match(layout, /\{% include case-fallback-nav.html %\}/);
  // A dropped trailing "=" makes the browser refuse the CDN script silently.
  assert.match(layout, /integrity="sha256-lZaRhKri35AyJSypXXs4o6OPFTbTmUoltBbDCbdzegg="/);
  const include = read('_includes/case-fallback-nav.html');
  assert.match(include, /case_path contains 'cases\/'/, 'the aid must not appear on INDEX or source pages');
  assert.match(include, /\?case=UC-/, 'a rendered case should offer its interactive view');
});

test('case evidence tokens use the documented author synonyms', () => {
  const known = new Set(['author-demo', 'author-self-report']);
  const unknown = [];
  for (const file of corpusFiles.filter(file => file.startsWith('cases/'))) {
    for (const match of read(file).matchAll(/`(author-[a-z-]+)`/g)) {
      if (!known.has(match[1])) unknown.push(`${file}: ${match[1]}`);
    }
  }
  assert.deepEqual(unknown, [], 'undocumented author evidence tokens: ' + unknown.join(', '));
});
