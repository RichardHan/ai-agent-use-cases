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

function parseExclude(configText) {
  const lines = configText.split('\n');
  const start = lines.findIndex(line => /^exclude\s*:\s*$/.test(line));
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

function isPublishedPath(filePath, exclude) {
  const top = filePath.split('/')[0];
  if (!top || top.startsWith('.') || top.startsWith('_')) return false;
  if (BUILD_ARTIFACTS.has(top)) return false;
  return !exclude.some(entry => filePath === entry || filePath.startsWith(entry + '/'));
}

// Markdown destinations and HTML attributes only. A bare mention of `docs/qa/…`
// in prose is not a link, and neither is an absolute URL to somebody else's docs.
function siteRelativeLinks(text) {
  const targets = [];
  const patterns = [/\]\(\s*<?([^)\s>]+)/g, /(?:href|src)\s*=\s*["']([^"']+)["']/g];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[1].trim();
      if (!raw || raw.startsWith('#') || raw.startsWith('//')) continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) continue;
      targets.push(raw.replace(/[?#].*$/, '').replace(/^\.\//, ''));
    }
  }
  return targets;
}

function excludedEntryFor(target, exclude) {
  const normalised = target.replace(/^\/+/, '').replace(/^ai-agent-use-cases\//, '');
  return exclude.find(entry => normalised === entry || normalised.startsWith(entry + '/')) || '';
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

// Pure: everything below is what the gate decides, so the tests can describe a
// repository without building one.
function surfaceProblems({exclude, publishedPaths, texts = [], bytes = 0}) {
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
    for (const target of siteRelativeLinks(text)) {
      const entry = excludedEntryFor(target, exclude);
      if (entry) problems.push(`${filePath} 連到已排除的「${entry}」：${target}（網站上會是 404）`);
    }
  }

  if (bytes > MAX_PUBLISHED_BYTES) {
    problems.push(`發布面 ${(bytes / 1048576).toFixed(1)} MiB 超過 ${MAX_PUBLISHED_BYTES / 1048576} MiB 上限`);
  }
  return problems;
}

function checkRepoSurface(root = path.resolve(__dirname, '..')) {
  const exclude = parseExclude(fs.readFileSync(path.join(root, '_config.yml'), 'utf8'));
  const published = listTrackedFiles(root).filter(filePath => isPublishedPath(filePath, exclude));
  const surface = surfaceOf(root, published);
  const problems = surfaceProblems({
    exclude,
    publishedPaths: published,
    texts: readTextFiles(root, published),
    bytes: surface.bytes,
  });
  return {exclude, published, surface, problems};
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

function checkBuiltSite(siteDir, exclude) {
  const problems = [];
  for (const entry of exclude) {
    if (fs.existsSync(path.join(siteDir, entry))) {
      problems.push(`建置產物仍含已排除的「${entry}」：_config.yml 的 exclude 沒有生效`);
    }
  }
  for (const required of REQUIRED_BUILT_FILES) {
    if (!fs.existsSync(path.join(siteDir, required))) problems.push(`建置產物缺少訪客需要的檔案：${required}`);
  }
  return problems;
}

function main(argv) {
  const target = argv[2];
  const root = path.resolve(__dirname, '..');
  const {exclude, surface, problems} = checkRepoSurface(root);
  const failures = [...problems];
  if (target) failures.push(...checkBuiltSite(path.resolve(target), exclude));
  const summary = `發布面 ${surface.files} 個檔案、${(surface.bytes / 1048576).toFixed(2)} MiB；排除 ${exclude.length} 項`;
  if (failures.length) {
    for (const failure of failures) console.error('FAIL: ' + failure);
    console.error(`${summary}；${failures.length} 項問題`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS: ${summary}${target ? '；建置產物不含已排除的目錄' : ''}`);
}

module.exports = {
  PUBLISHED_TOP_LEVEL,
  MAX_PUBLISHED_BYTES,
  parseExclude,
  isPublishedPath,
  siteRelativeLinks,
  excludedEntryFor,
  surfaceProblems,
  checkRepoSurface,
  checkBuiltSite,
  REQUIRED_BUILT_FILES,
};

if (require.main === module) main(process.argv);
