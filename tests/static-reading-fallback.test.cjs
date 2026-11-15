'use strict';
// The search page is delivered by Jekyll before any script runs. If `app.js`
// never executes, the only recovery used to be inside `#error`, which is hidden
// until that script runs: a visitor landed on "正在讀取案例…" with no way to the
// server-rendered index. This check holds the delivered HTML, not the running app.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/style.css'), 'utf8');

const exploreStart = html.indexOf('<section id="explore"');
const resultsStart = html.indexOf('<div class="results-heading"');
const explore = html.slice(exploreStart, resultsStart);

test('the delivered search section carries an in-site index link without JavaScript', () => {
  assert.ok(exploreStart >= 0 && resultsStart > exploreStart, 'index.html must keep #explore before its results');
  const match = explore.match(/<p id="static-reading-fallback"[^>]*>([\s\S]*?)<\/p>/);
  assert.ok(match, '#explore must carry a static reading fallback');
  assert.doesNotMatch(match[0], /\shidden(?:\s|=|>)/, 'the fallback must be visible before scripts run');
  assert.match(match[1], /href="INDEX\.html"/, 'the fallback must open the server-rendered index');
  assert.match(match[1], /JavaScript/, 'the fallback must explain why the results are not loading');
});

test('the fallback sits above the filter panel, not below a long collapsed list', () => {
  const fallback = explore.indexOf('static-reading-fallback');
  const form = explore.indexOf('<form id="filters"');
  assert.ok(fallback >= 0 && form > fallback, 'a reader must see the way out before the filter controls');
});

test('app.js hides the fallback as soon as the script runs', () => {
  const hides = app.match(/\$\('static-reading-fallback'\)\)\$\('static-reading-fallback'\)\.hidden=true/g) || [];
  assert.ok(hides.length >= 1, 'a working script must not leave a false JavaScript warning on screen');
  assert.ok(app.indexOf("$('static-reading-fallback').hidden=true") < app.lastIndexOf('load();'),
    'the note must be hidden before the corpus request starts, not after a slow load');
});

test('the fallback has a readable style and does not print', () => {
  assert.match(css, /\.reading-fallback\{[^}]*border-left/);
  assert.match(css, /@media print\{\.reading-fallback\{display:none\}\}/);
});
