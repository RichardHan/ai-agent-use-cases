'use strict';
// The slow-load fallback is `index.html` -> `INDEX.html` -> `cases/*.html`.
// Those case pages are rendered by Jekyll, which does not turn a bare URL into
// a link. The SPA does, so without this check the same case can have a clickable
// source in the drawer and an unclickable one in the server-rendered page.
//
// `INDEX.html` also sends readers into `evidence/` (經驗與踩坑) and
// `sources/pending.html` (待查線索). Those are entries a reader arrives at
// directly, exactly like a case, so they carry the same way back and the same
// claimant/vendor note. A page whose only heading is the site name also loses
// its own title in heading navigation: the layout must not ship that <h1>.
//
// `sources/*.html` are the ledgers behind the trust claims: the statistics card
// links the counting audit, and case pages link the batch that reviewed them.
// They are published pages a reader lands on from those links, so they need the
// two ways back as well. They are not cases: they record what was counted or
// read, so they state that boundary instead of carrying the claimant legend.
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
  ['author-self-report', '作者報告／示範'],
  ['pending-verification', '尚待查證'],
];

// A reader who lands on a rendered case from search has no index context. The
// case page itself must say who made the claim, what the machine token means,
// and how to get back to the index or the searchable home page.
function caseNavigation(html) {
  const match = html.match(/<aside\b[^>]*data-fallback-case-nav[^>]*>([\s\S]*?)<\/aside>/i);
  return match ? {markup: match[0], inner: match[1]} : null;
}

// One nav per page: a second copy means the layout rendered the include twice, and
// a hidden one means a reader on a page that "has" the way back still cannot see it.
function navigationOccurrences(html) {
  return [...html.matchAll(/<aside\b[^>]*data-fallback-case-nav[^>]*>([\s\S]*?)<\/aside>/gi)]
    .map(match => ({markup: match[0], inner: match[1], opening: match[0].slice(0, match[0].indexOf('>') + 1)}));
}

// The reader must see the code and its label together. A label hidden with
// `hidden`, inline `display:none`, `aria-hidden`, or a screen-reader utility
// class does not decode anything, and pairing the wrong label is worse than no
// legend at all.
function hiddenTag(tag) {
  return /\shidden(?:\s|=|>)/i.test(tag)
    || /display\s*:\s*none/i.test(tag)
    || /aria-hidden\s*=\s*["']true/i.test(tag)
    || /\b(?:sr-only|visually-hidden)\b/i.test(tag);
}

function legendEntries(navHtml) {
  const entries = new Map();
  for (const match of navHtml.matchAll(/<span\b[^>]*class="[^"]*\bcase-fallback-code\b[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)) {
    const opening = match[0].slice(0, match[0].indexOf('>') + 1);
    const codeTag = match[1].match(/<code\b[^>]*>/i)?.[0] || '';
    const labelTag = match[1].match(/<strong\b[^>]*>/i)?.[0] || '';
    if (hiddenTag(opening) || hiddenTag(codeTag) || hiddenTag(labelTag)) continue;
    const code = match[1].match(/<code\b[^>]*>\s*([^<]+?)\s*<\/code>/i)?.[1]?.trim();
    const label = match[1].match(/<strong\b[^>]*>\s*([^<]+?)\s*<\/strong>/i)?.[1]?.trim();
    if (code && label) entries.set(code, label);
  }
  return entries;
}

// The site name is navigation. When the layout rendered it as <h1>, every
// rendered page shipped two h1s and heading navigation announced the site
// before the case. One h1, and it must be the page's own title.
function headingCount(html) {
  const matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  return {count: matches.length, texts: matches.map(match => match[1].replace(/<[^>]*>/g, '').trim())};
}

function externalSourceLinks(html) {
  return [...html.matchAll(/<a\s+[^>]*href="([^"]+)"/gi)]
    .map(match => match[1])
    .filter(href => /^https?:\/\//i.test(href) && href !== SELF_ORIGIN && !href.startsWith(SELF_ORIGIN + '/'));
}

// `sources/README.md` is published as the directory index, every other ledger keeps
// its name. A ledger that produced no page cannot be caught by walking `_site`, so
// the CLI compares the checkout's ledgers with the pages the build emitted.
function renderedPageForSource(file) {
  return file === 'sources/README.md' ? 'sources/index.html' : file.replace(/\.md$/, '.html');
}

function checkFallbackReading(root, options = {}) {
  const sourceLedgers = options.sourceLedgers || null;
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
  const indexHeadings = headingCount(index);
  if (indexHeadings.count !== 1) {
    failures.push(`INDEX.html: expected exactly one h1, found ${indexHeadings.count} (${indexHeadings.texts.join(' / ') || 'none'})`);
  }

  const pages = [];
  const sourcePages = [];
  for (const folder of ['cases', 'evidence']) {
    const dir = path.join(root, folder);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter(name => name.endsWith('.html')).sort()) {
      pages.push(path.join(folder, name));
    }
  }
  const sourcesDir = path.join(root, 'sources');
  if (fs.existsSync(sourcesDir)) {
    for (const name of fs.readdirSync(sourcesDir).filter(name => name.endsWith('.html')).sort()) {
      pages.push(path.join('sources', name));
      if (name !== 'pending.html') sourcePages.push(path.join('sources', name));
    }
  }
  if (pages.length === 0) return {checked: 0, failures: failures.concat('no rendered pages found')};

  const sourcePageSet = new Set(sourcePages);
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const isSourcePage = sourcePageSet.has(page);
    // A research batch that found nothing legitimately links no outside source.
    // A case always has one: it is the claim's origin.
    if (!isSourcePage && externalSourceLinks(html).length === 0) {
      failures.push(`${page}: no clickable source link`);
    }
    const headings = headingCount(html);
    if (headings.count !== 1) {
      failures.push(`${page}: expected exactly one h1, found ${headings.count} (${headings.texts.join(' / ') || 'none'})`);
    }

    const navs = navigationOccurrences(html);
    if (navs.length === 0) {
      failures.push(isSourcePage
        ? `${page}: missing the source-page fallback navigation`
        : `${page}: missing the case fallback navigation and evidence legend`);
      continue;
    }
    if (navs.length > 1) failures.push(`${page}: expected one fallback navigation, found ${navs.length}`);
    if (hiddenTag(navs[0].opening)) failures.push(`${page}: fallback navigation is hidden`);
    const nav = navs[0];
    if (!/<a\s+[^>]*href="[^"]*INDEX\.html"[^>]*>\s*←?\s*完整案例索引/.test(nav.markup)) {
      failures.push(`${page}: fallback navigation does not link to INDEX.html as 完整案例索引`);
    }
    if (!/<a\s+[^>]*href="[^"]*\/"[^>]*>\s*搜尋首頁/.test(nav.markup)) {
      failures.push(`${page}: fallback navigation does not link to the searchable home page`);
    }
    if (isSourcePage) {
      // A ledger must not be read as the case's result. The boundary is stated in
      // the navigation, where the reader arrives, not only somewhere in the body.
      // "look at the case page" is not a next step for a batch that added no case,
      // so the note must also say where the record itself is authoritative.
      if (!/不是案例成果/.test(nav.inner) || !/案例頁/.test(nav.inner) || !/待查線索/.test(nav.inner)) {
        failures.push(`${page}: source navigation must say the ledger is not the case's result and what stands when the batch added none`);
      }
      continue;
    }
    if (!/誰提出主張/.test(nav.inner) || !/不等於誰驗證/.test(nav.inner)) {
      failures.push(`${page}: fallback navigation must distinguish the claimant from verification`);
    }
    const body = html.replace(nav.markup, '');
    const legend = legendEntries(nav.inner);
    for (const [token, label] of EVIDENCE_LABELS) {
      // Only rendered code spans count. Source URLs and slugs (for example
      // `fan-watch-official-news`) are not evidence declarations.
      if (!new RegExp(`<code\\b[^>]*>\\s*${token}\\s*</code>`, 'i').test(body)) continue;
      if (legend.get(token) !== label) {
        failures.push(`${page}: body uses ${token} but the legend does not pair it visibly with ${label}`);
      }
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
      .filter(file => /^(?:cases|evidence)\/.+\.md$/.test(file) || file === 'sources/pending.md')
      .map(file => file.replace(/\.md$/, '.html'));
    const rendered = new Set(pages);
    for (const page of expected) {
      if (!rendered.has(page)) failures.push(`${page}: corpus entry has no rendered page`);
    }
  }

  if (sourceLedgers) {
    const rendered = new Set(pages);
    for (const file of sourceLedgers) {
      const expected = renderedPageForSource(file);
      if (!rendered.has(expected)) failures.push(`${file}: source ledger has no rendered page (${expected})`);
    }
  }

  return {checked: pages.length, failures};
}

module.exports = {checkFallbackReading, externalSourceLinks, caseNavigation, navigationOccurrences, renderedPageForSource, legendEntries, SELF_ORIGIN};

if (require.main === module) {
  const root = process.argv[2];
  if (!root) throw new Error('Usage: node scripts/check-fallback-reading.cjs <built-site-directory>');
  const ledgersDir = path.join(__dirname, '..', 'sources');
  const sourceLedgers = fs.existsSync(ledgersDir)
    ? fs.readdirSync(ledgersDir).filter(name => name.endsWith('.md')).map(name => 'sources/' + name)
    : null;
  const {checked, failures} = checkFallbackReading(root, {sourceLedgers});
  if (failures.length) {
    console.error(`FAIL: fallback reading has ${failures.length} problem(s) across ${checked} rendered pages`);
    for (const failure of failures.slice(0, 20)) console.error(`- ${failure}`);
    if (failures.length > 20) console.error(`- … ${failures.length - 20} more`);
    process.exit(1);
  }
  console.log(`PASS: ${checked} rendered pages keep a way back (cases expose a clickable source; source ledgers say they are not the case result); INDEX explains the evidence codes`);
}
