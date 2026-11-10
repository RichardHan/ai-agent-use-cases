#!/usr/bin/env node
'use strict';
// The Pages artifact is what the Pages backend syncs to its CDN before a visitor
// can open a URL. Until this round it also carried the whole `docs/` tree: 3,845
// QA records and screenshots (326 MB of a 311 MB artifact, 98% of the bytes) that
// no page on the site links into. The deploy for main@99734627 spent its entire
// 600 s budget in `syncing_files` and timed out, so that merge never published.
//
// This gate does two things:
//   1. keeps the published tree to files a visitor can use, so an internal tree
//      cannot silently rejoin the artifact (the allowlist forces a decision when
//      a new top-level path appears);
//   2. refuses to let a published page link into a tree the build no longer
//      ships, which is the regression `exclude` would otherwise cause silently.
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Everything the site ships on purpose. A new top-level path must be added here
// (published) or to `_config.yml` exclude (not published) — never both, never
// neither. `docs/` is deliberately absent: those are maintenance records, and
// GitHub serves them from the repository.
const PUBLISHED_TOP_LEVEL = new Set([
  'assets',
  'cases',
  'evidence',
  'sources',
  'templates',
  'index.html',
  'README.md',
  'README-archive-2026-10-18.md',
  'INDEX.md',
  'catalog.json',
  'corpus.json',
  'audit-summary.json',
]);

// A backstop against artifact growth, not a target. The visitor-facing tree is
// ~6 MiB today; the tree this gate exists to keep out was 326 MiB.
const MAX_PUBLISHED_BYTES = 40 * 1024 * 1024;

// Jekyll copies a path only when it is not excluded, does not start with `.` or
// `_`, and is not a build artifact. Keep this list short and explain each entry.
const BUILD_ARTIFACTS = new Set(['_site']);

function configEntries(configText, key) {
  const lines = configText.split('\n');
  const start = lines.findIndex(line => new RegExp('^' + key + '\\s*:\\s*$').test(line));
  if (start === -1) return [];
  const entries = [];
  for (const line of lines.slice(start + 1)) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item) {
      entries.push(item[1].replace(/\s+#.*$/, '').trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }
    if (line.trim() && !/^\s/.test(line) && !/^#/.test(line)) break;
  }
  return entries.filter(Boolean);
}

function configValue(configText, key) {
  const line = configText.split('\n').find(candidate => new RegExp('^' + key + '\\s*:').test(candidate));
  return line ? line.replace(new RegExp('^' + key + '\\s*:\\s*'), '').replace(/\s+#.*$/, '').trim().replace(/^['"]|['"]$/g, '') : '';
}

function parseExclude(configText) {
  return configEntries(configText, 'exclude');
}

function isPublishedPath(filePath, exclude) {
  const top = filePath.split('/')[0];
  if (!top || top.startsWith('.') || top.startsWith('_')) return false;
  if (BUILD_ARTIFACTS.has(top)) return false;
  return !exclude.some(entry => filePath === entry || filePath.startsWith(entry + '/'));
}

// Markdown destinations and HTML attributes only. A bare mention of `docs/qa/…`
// in prose is not a link.
function linkTargets(text) {
  const targets = [];
  const patterns = [/\]\(\s*<?([^)\s>]+)/g, /(?:href|src)\s*=\s*["']([^"']+)["']/g];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[1].trim();
      if (raw) targets.push(raw);
    }
  }
  return targets;
}

function normaliseSitePath(raw) {
  const resolved = path.posix.normalize('/' + raw).replace(/^\/+/, '');
  return resolved.startsWith('..') ? '' : resolved.replace(/\/$/, '');
}

// A destination is only interesting when the reader would land on this site.
// Relative destinations resolve against the page that carries them (`../docs/x`
// from `cases/a.md` leaves the site's `cases/` tree), absolute ones only when the
// origin and base path are this site's — anything else is somebody else's docs.
function sitePathFor(target, pagePath, site = {}) {
  const clean = target.replace(/[?#].*$/, '');
  if (!clean) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean)) {
    const origin = (site.url || '').replace(/\/$/, '');
    if (!origin || !clean.startsWith(origin + '/')) return '';
    const rest = clean.slice(origin.length);
    const base = site.baseurl || '';
    if (base && !rest.startsWith(base + '/')) return '';
    return normaliseSitePath(base ? rest.slice(base.length) : rest);
  }
  if (clean.startsWith('//')) return '';
  if (clean.startsWith('/')) {
    const base = site.baseurl || '';
    if (base && (clean === base || clean.startsWith(base + '/'))) return normaliseSitePath(clean.slice(base.length));
    return normaliseSitePath(clean);
  }
  const dir = path.posix.dirname(pagePath);
  return normaliseSitePath((dir === '.' ? '' : dir + '/') + clean);
}

function excludedEntryFor(target, exclude) {
  return exclude.find(entry => target === entry || target.startsWith(entry + '/')) || '';
}

function listTrackedFiles(root, run = execFileSync) {
  const output = run('git', ['-c', 'core.quotePath=false', 'ls-files', '-z'], {cwd: root, encoding: 'utf8'});
  return output.split('\0').filter(Boolean);
}

function readTextFiles(root, files) {
  const readable = /\.(?:md|html|markdown)$/i;
  const out = [];
  for (const filePath of files) {
    if (!readable.test(filePath)) continue;
    out.push({path: filePath, text: fs.readFileSync(path.join(root, filePath), 'utf8')});
  }
  return out;
}

function surfaceOf(root, files) {
  let bytes = 0;
  for (const filePath of files) bytes += fs.statSync(path.join(root, filePath)).size;
  return {files: files.length, bytes};
}

// A symlink is published under its link path but Jekyll copies the target's
// bytes, so `cases/qa.png -> ../docs/qa/big.png` would smuggle an excluded file
// into the artifact while `_site/docs` stays absent.
function symlinkProblems(root, published, exclude) {
  const problems = [];
  const realRoot = fs.realpathSync(root);
  for (const filePath of published) {
    const absolute = path.join(root, filePath);
    if (!fs.lstatSync(absolute).isSymbolicLink()) continue;
    const target = path.relative(realRoot, fs.realpathSync(absolute)).split(path.sep).join('/');
    if (!isPublishedPath(target, exclude)) {
      problems.push(`${filePath} 是指向排除範圍的符號連結（${target}）：目標的位元組會被複製進發布產物`);
    }
  }
  return problems;
}

// Pure: everything below is what the gate decides, so the tests can describe a
// repository without building one.
function surfaceProblems({exclude, publishedPaths, texts = [], bytes = 0, site = {}, symlinks = []}) {
  const problems = [];
  if (!exclude.length) problems.push('_config.yml 沒有排除清單：所有維護目錄都會被發布');

  for (const top of new Set(publishedPaths.map(filePath => filePath.split('/')[0]))) {
    if (!PUBLISHED_TOP_LEVEL.has(top)) {
      problems.push(`「${top}」會發布到網站，但不在允許清單內：請確認它該公開，或加進 _config.yml 的 exclude`);
    }
  }

  for (const entry of exclude) {
    if (PUBLISHED_TOP_LEVEL.has(entry)) problems.push(`「${entry}」同時在排除清單與允許清單，兩邊只能選一個`);
  }

  for (const {path: filePath, text} of texts) {
    for (const target of linkTargets(text)) {
      const entry = excludedEntryFor(sitePathFor(target, filePath, site), exclude);
      if (entry) problems.push(`${filePath} 連到已排除的「${entry}」：${target}（網站上會是 404）`);
    }
  }

  problems.push(...symlinks);

  if (bytes > MAX_PUBLISHED_BYTES) {
    problems.push(`發布面 ${(bytes / 1048576).toFixed(1)} MiB 超過 ${MAX_PUBLISHED_BYTES / 1048576} MiB 上限`);
  }
  return problems;
}

function checkRepoSurface(root = path.resolve(__dirname, '..')) {
  const config = fs.readFileSync(path.join(root, '_config.yml'), 'utf8');
  const exclude = parseExclude(config);
  const site = {url: configValue(config, 'url'), baseurl: configValue(config, 'baseurl')};
  const published = listTrackedFiles(root).filter(filePath => isPublishedPath(filePath, exclude));
  const surface = surfaceOf(root, published);
  const problems = surfaceProblems({
    exclude,
    publishedPaths: published,
    texts: readTextFiles(root, published),
    bytes: surface.bytes,
    site,
    symlinks: symlinkProblems(root, published, exclude),
  });
  return {exclude, site, published, surface, problems};
}

const REQUIRED_BUILT_FILES = [
  'index.html',
  'assets/app.js',
  'assets/style.css',
  'catalog.json',
  'corpus.json',
  'audit-summary.json',
  'README.md',
  'INDEX.md',
  'templates/case.md',
  'sources/pending.md',
];

// The index and the app both address case pages by their source path, so a build
// that keeps the required files but drops `cases/*.md` would leave every case
// link dead. Require the transport of every published source file.
function sourceTransport(files) {
  return files.filter(filePath => /^(?:cases|evidence)\/[^/]+\.md$/.test(filePath) || filePath === 'sources/pending.md');
}

function checkBuiltSite(siteDir, {exclude = [], published = []} = {}) {
  const problems = [];
  for (const entry of exclude) {
    if (fs.existsSync(path.join(siteDir, entry))) {
      problems.push(`建置產物仍含已排除的「${entry}」：_config.yml 的 exclude 沒有生效`);
    }
  }
  for (const required of REQUIRED_BUILT_FILES) {
    if (!fs.existsSync(path.join(siteDir, required))) problems.push(`建置產物缺少訪客需要的檔案：${required}`);
  }
  const missing = sourceTransport(published).filter(filePath => !fs.existsSync(path.join(siteDir, filePath)));
  if (missing.length) {
    problems.push(`建置產物缺少 ${missing.length} 個來源檔（例：${missing.slice(0, 3).join('、')}）：案例頁與來源連結會是 404`);
  }
  return problems;
}

function main(argv) {
  const target = argv[2];
  const root = path.resolve(__dirname, '..');
  const {exclude, published, surface, problems} = checkRepoSurface(root);
  const failures = [...problems];
  if (target) failures.push(...checkBuiltSite(path.resolve(target), {exclude, published}));
  const summary = `發布面 ${surface.files} 個檔案、${(surface.bytes / 1048576).toFixed(2)} MiB；排除 ${exclude.length} 項`;
  if (failures.length) {
    for (const failure of failures) console.error('FAIL: ' + failure);
    console.error(`${summary}；${failures.length} 項問題`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS: ${summary}${target ? '；建置產物不含已排除的目錄，且來源檔齊全' : ''}`);
}

module.exports = {
  PUBLISHED_TOP_LEVEL,
  MAX_PUBLISHED_BYTES,
  parseExclude,
  isPublishedPath,
  linkTargets,
  sitePathFor,
  excludedEntryFor,
  surfaceProblems,
  symlinkProblems,
  checkRepoSurface,
  checkBuiltSite,
  sourceTransport,
  REQUIRED_BUILT_FILES,
};

if (require.main === module) main(process.argv);
