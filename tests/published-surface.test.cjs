'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const gate = require('../scripts/check-published-surface.cjs');

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

test('only site-relative destinations count as links a visitor could follow', () => {
  const text = [
    '[內部紀錄](docs/qa/round/README.md)',
    '[外部文件](https://learn.chatgpt.com/docs/dots/controls)',
    '<a href="./docs/qa/round/README.md#top">x</a>',
    '[錨點](#explore)',
    '[協議相對](//example.org/docs/x)',
    'prose mentioning docs/qa/round without a link',
  ].join('\n');
  assert.deepEqual(gate.siteRelativeLinks(text), ['docs/qa/round/README.md', 'docs/qa/round/README.md']);
});

test('an excluded tree is recognised under the Pages base path too', () => {
  const exclude = ['docs'];
  assert.equal(gate.excludedEntryFor('docs/qa/x.png', exclude), 'docs');
  assert.equal(gate.excludedEntryFor('/ai-agent-use-cases/docs/qa/x.png', exclude), 'docs');
  assert.equal(gate.excludedEntryFor('cases/005.md', exclude), '');
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

test('a newly added top-level tree cannot join the artifact unnoticed', () => {
  const problems = gate.surfaceProblems({
    exclude: ['docs'],
    publishedPaths: ['cases/005-example.md', 'index.html', 'qa-shots/after.png'],
  });
  assert.deepEqual(problems, ['「qa-shots」會發布到網站，但不在允許清單內：請確認它該公開，或加進 _config.yml 的 exclude']);

  assert.deepEqual(gate.surfaceProblems({exclude: [], publishedPaths: ['index.html']}), [
    '_config.yml 沒有排除清單：所有維護目錄都會被發布',
  ]);

  const clash = gate.surfaceProblems({exclude: ['docs'], publishedPaths: ['cases/005-example.md']});
  assert.deepEqual(clash, []);
  assert.deepEqual(gate.surfaceProblems({exclude: ['cases'], publishedPaths: []}), [
    '「cases」同時在排除清單與允許清單，兩邊只能選一個',
  ]);
});

test('a published page that links into an excluded tree fails before the link breaks', () => {
  const problems = gate.surfaceProblems({
    exclude: ['docs', 'scripts'],
    publishedPaths: ['index.html', 'README.md'],
    texts: [
      {path: 'README.md', text: '[驗收紀錄](docs/qa/round/README.md)'},
      {path: 'index.html', text: '<a href="scripts/preview.py">x</a>'},
    ],
  });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /README\.md 連到已排除的「docs」/);
  assert.match(problems[1], /index\.html 連到已排除的「scripts」/);
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

test('a built site that still carries an excluded tree fails the check', () => {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'published-surface-'));
  try {
    for (const required of gate.REQUIRED_BUILT_FILES) {
      fs.mkdirSync(path.dirname(path.join(site, required)), {recursive: true});
      fs.writeFileSync(path.join(site, required), 'x');
    }
    assert.deepEqual(gate.checkBuiltSite(site, ['docs', 'scripts']), []);

    fs.mkdirSync(path.join(site, 'docs', 'qa'), {recursive: true});
    const leaked = gate.checkBuiltSite(site, ['docs', 'scripts']);
    assert.equal(leaked.length, 1);
    assert.match(leaked[0], /仍含已排除的「docs」/);

    fs.rmSync(path.join(site, 'sources', 'pending.md'));
    const missing = gate.checkBuiltSite(site, ['docs', 'scripts']);
    assert.equal(missing.length, 2);
    assert.ok(missing.some(problem => problem.includes('sources/pending.md')));
  } finally {
    fs.rmSync(site, {recursive: true, force: true});
  }
});
