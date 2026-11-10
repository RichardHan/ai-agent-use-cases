'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const gate = require('../scripts/check-published-surface.cjs');
const SITE = {url: 'https://richardhan.github.io', baseurl: '/ai-agent-use-cases'};

test('exclude list is read past comments, quotes and indentation', () => {
  const config = ['title: x', 'exclude:', '  - scripts', '  # a comment line', "  - 'quoted dir'", '  - docs', 'other: 1'].join('\n');
  assert.deepEqual(gate.parseExclude(config), ['scripts', 'quoted dir', 'docs']);
  assert.deepEqual(gate.parseExclude('title: x\n'), []);
});

test('a path is published unless Jekyll would drop or exclude it', () => {
  const exclude = ['docs', 'scripts', 'SITE.md'];
  assert.equal(gate.isPublishedPath('cases/005-example.md', exclude), true);
  assert.equal(gate.isPublishedPath('docs/qa/round/README.md', exclude), false);
  assert.equal(gate.isPublishedPath('docsomething/5.6MiB.png', exclude), true, 'a shared prefix is not an exclusion');
  assert.equal(gate.isPublishedPath('SITE.md', exclude), false);
  assert.equal(gate.isPublishedPath('.github/workflows/website-qa.yml', exclude), false);
  assert.equal(gate.isPublishedPath('_site/cases/005-example.md', exclude), false);
});

test('a destination resolves the way a browser reading that page would resolve it', () => {
  assert.equal(gate.sitePathFor('docs/qa/round/README.md', 'README.md', SITE), 'docs/qa/round/README.md');
  assert.equal(gate.sitePathFor('../docs/qa/round/README.md', 'cases/005-example.md', SITE), 'docs/qa/round/README.md');
  assert.equal(gate.sitePathFor('./cases/005-example.md', 'INDEX.md', SITE), 'cases/005-example.md');
  assert.equal(gate.sitePathFor('research-2026-11-08.md', 'sources/README.md', SITE), 'sources/research-2026-11-08.md');
  assert.equal(gate.sitePathFor('/ai-agent-use-cases/docs/qa/x.png', 'README.md', SITE), 'docs/qa/x.png');
  assert.equal(gate.sitePathFor('/docs/qa/x.png', 'README.md', SITE), 'docs/qa/x.png');
  assert.equal(gate.sitePathFor('https://richardhan.github.io/ai-agent-use-cases/docs/qa/x.png', 'README.md', SITE), 'docs/qa/x.png');
  assert.equal(gate.sitePathFor('https://learn.chatgpt.com/docs/dots/controls', 'cases/005-example.md', SITE), '');
  assert.equal(gate.sitePathFor('https://richardhan.github.io/other-site/docs/x.png', 'README.md', SITE), '');
  assert.equal(gate.sitePathFor('//example.org/docs/x', 'README.md', SITE), '');
  assert.equal(gate.sitePathFor('#explore', 'README.md', SITE), '');
  assert.equal(gate.sitePathFor('../../../docs/x.md', 'cases/005-example.md', SITE), 'docs/x.md');
});

test('a case page may mention its own docs/ subtree without being mistaken for the excluded tree', () => {
  const problems = gate.surfaceProblems({
    exclude: ['docs'],
    publishedPaths: ['cases/005-example.md'],
    texts: [{path: 'cases/005-example.md', text: '[檔案](docs/qa/x.md)'}],
    site: SITE,
  });
  assert.deepEqual(problems, [], 'the page lives in cases/, so the link points at cases/docs/qa/x.md');
});

test('only site-relative destinations become links', () => {
  const text = [
    '[內部紀錄](docs/qa/round/README.md)',
    '<a href="./docs/qa/round/README.md#top">x</a>',
    '[錨點](#explore)',
    'prose mentioning docs/qa/round without a link',
  ].join('\n');
  assert.deepEqual(gate.linkTargets(text), ['docs/qa/round/README.md', '#explore', './docs/qa/round/README.md#top']);
});

test('a published page that links into an excluded tree fails before the link breaks', () => {
  const problems = gate.surfaceProblems({
    exclude: ['docs', 'scripts'],
    publishedPaths: ['index.html', 'README.md', 'cases/005-example.md'],
    texts: [
      {path: 'README.md', text: '[驗收紀錄](docs/qa/round/README.md)'},
      {path: 'index.html', text: '<a href="scripts/preview.py">x</a>'},
      {path: 'cases/005-example.md', text: '[紀錄](../docs/qa/round/README.md)'},
    ],
    site: SITE,
  });
  assert.equal(problems.length, 3);
  assert.match(problems[0], /README\.md 連到已排除的「docs」/);
  assert.match(problems[1], /index\.html 連到已排除的「scripts」/);
  assert.match(problems[2], /cases\/005-example\.md 連到已排除的「docs」/);
});

test('a newly added top-level tree cannot join the artifact unnoticed', () => {
  const problems = gate.surfaceProblems({
    exclude: ['docs'],
    publishedPaths: ['cases/005-example.md', 'index.html', 'qa-shots/after.png'],
  });
  assert.deepEqual(problems, ['「qa-shots」會發布到網站，但不在允許清單內：請確認它該公開，或加進 _config.yml 的 exclude']);

  assert.deepEqual(gate.surfaceProblems({exclude: [], publishedPaths: ['index.html']}), [
    '_config.yml 沒有排除清單：所有維護目錄都會被發布',
  ]);
  assert.deepEqual(gate.surfaceProblems({exclude: ['cases'], publishedPaths: []}), [
    '「cases」同時在排除清單與允許清單，兩邊只能選一個',
  ]);
});

test('the artifact budget fails on a payload the visitor cannot use', () => {
  const problems = gate.surfaceProblems({
    exclude: ['docs'],
    publishedPaths: ['index.html'],
    bytes: gate.MAX_PUBLISHED_BYTES + 1,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /超過 40 MiB 上限/);
});

test('a published symlink into an excluded tree is refused', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'published-surface-link-'));
  try {
    fs.mkdirSync(path.join(tmp, 'docs', 'qa'), {recursive: true});
    fs.writeFileSync(path.join(tmp, 'docs', 'qa', 'big.png'), 'x');
    fs.mkdirSync(path.join(tmp, 'cases'), {recursive: true});
    fs.writeFileSync(path.join(tmp, 'cases', 'ok.png'), 'x');
    fs.symlinkSync('../docs/qa/big.png', path.join(tmp, 'cases', 'qa.png'));
    const problems = gate.symlinkProblems(tmp, ['cases/ok.png', 'cases/qa.png'], ['docs']);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /cases\/qa\.png 是指向排除範圍的符號連結（docs\/qa\/big\.png）/);
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
});

test('a built site that still carries an excluded tree or lost its sources fails the check', () => {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'published-surface-'));
  const published = ['index.html', 'cases/005-example.md', 'evidence/008-supplement.md', 'sources/pending.md'];
  try {
    for (const required of gate.REQUIRED_BUILT_FILES) {
      fs.mkdirSync(path.dirname(path.join(site, required)), {recursive: true});
      fs.writeFileSync(path.join(site, required), 'x');
    }
    for (const source of gate.sourceTransport(published)) {
      fs.mkdirSync(path.dirname(path.join(site, source)), {recursive: true});
      fs.writeFileSync(path.join(site, source), 'x');
    }
    assert.deepEqual(gate.checkBuiltSite(site, {exclude: ['docs', 'scripts'], published}), []);

    fs.mkdirSync(path.join(site, 'docs', 'qa'), {recursive: true});
    assert.equal(gate.checkBuiltSite(site, {exclude: ['docs', 'scripts'], published}).length, 1);

    fs.rmSync(path.join(site, 'cases', '005-example.md'));
    const lost = gate.checkBuiltSite(site, {exclude: ['docs', 'scripts'], published});
    assert.equal(lost.length, 2);
    assert.ok(lost.some(problem => /缺少 1 個來源檔.*cases\/005-example\.md/.test(problem)));
  } finally {
    fs.rmSync(site, {recursive: true, force: true});
  }
});

test('source transport covers every case and evidence page plus the pending list', () => {
  const transport = gate.sourceTransport([
    'index.html',
    'cases/005-example.md',
    'assets/app.js',
    'evidence/008-supplement.md',
    'sources/pending.md',
    'sources/research-2026-11-08.md',
  ]);
  assert.deepEqual(transport, ['cases/005-example.md', 'evidence/008-supplement.md', 'sources/pending.md']);
});

test('the repository publishes only the visitor-facing tree', () => {
  const {exclude, published, surface, problems} = gate.checkRepoSurface(root);
  assert.deepEqual(problems, [], problems.join('\n'));
  assert.ok(exclude.includes('docs'), 'QA records must stay out of the Pages artifact');
  assert.equal(published.some(filePath => filePath.startsWith('docs/')), false);
  assert.ok(published.includes('cases/005-cloud-pr-review.md'));
  assert.ok(published.includes('sources/pending.md'));
  assert.ok(published.includes('index.html'));
  assert.ok(surface.bytes <= gate.MAX_PUBLISHED_BYTES, `published surface ${surface.bytes} bytes`);
});
