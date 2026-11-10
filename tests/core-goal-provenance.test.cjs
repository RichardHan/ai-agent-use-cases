'use strict';
// The reader saw a 核心目標 block only when a page wrote "- 核心目標：". Pages that
// declared the same sentence as "- 目標：" or "- 問題：" lost it everywhere: no
// card line, no reader section, no note. Pages that declared nothing looked
// identical to pages with nothing to solve. This check holds the corpus to three
// named states and refuses a goal sentence the page never wrote.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0];

const context = vm.createContext({
  URL,
  Discovery: require('../assets/discovery.js'),
  document: {
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(), className: '', textContent: '', children: [], dataset: {},
        append(...nodes) { for (const n of nodes) if (n) this.children.push(n); },
        setAttribute(k, v) { this.attributes = this.attributes || {}; this.attributes[k] = String(v); },
        addEventListener() {}, replaceChildren(...nodes) { this.children = []; this.append(...nodes); },
        querySelector() { return null; }
      };
    },
    createTextNode(text) { return { textContent: String(text) }; }
  }
});

vm.runInContext(source + '\nthis.api={parseFile,coreGoalView};', context);
const api = context.api;
vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);

const files = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .concat('sources/pending.md');
const entries = files.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));

const leadOf = markdown => markdown.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];
// A lead-only declaration, exactly as the reader sees the front block.
const leadDeclaresGoal = markdown => /^-\s*(?:核心目標|目標|問題)\s*[：:]\s*\S/m.test(leadOf(markdown));
const problemSection = markdown => markdown.match(/^##+\s+(問題[^\n]*?)\s*$/m)?.[1] || '';

test('every page that declares a goal keeps its own sentence under 核心目標', () => {
  const offenders = [];
  for (const entry of entries) {
    if (!leadDeclaresGoal(entry.markdown)) continue;
    const view = api.coreGoalView(entry);
    const problems = [];
    if (view.source !== 'declared') problems.push('source=' + view.source);
    if (view.heading !== '核心目標') problems.push('heading=' + view.heading);
    if (!view.text) problems.push('empty text');
    // The sentence must already exist in the page's own front block: a declared
    // goal is never written by the library.
    else if (!leadOf(entry.markdown).includes(view.text)) problems.push('text not in lead');
    if (view.note) problems.push('unexpected provenance note');
    if (problems.length) offenders.push(`${entry.id} → ${problems.join(', ')}`);
  }
  assert.deepEqual(offenders, [], 'a declared goal must render as its own sentence');
});

test('older labels 目標 and 問題 are read, a body-only 問題 line is not', () => {
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  for (const id of ['UC-004', 'UC-005', 'UC-006', 'UC-007', 'UC-010', 'UC-011', 'UC-012', 'UC-008', 'UC-009']) {
    const entry = byId.get(id);
    assert.ok(entry, `${id} must exist in the corpus`);
    assert.equal(api.coreGoalView(entry).source, 'declared', `${id} declares its goal in the lead`);
  }
  // UC-045 writes "- 問題：" inside the source report, not in the front block; it
  // is not a goal declaration and must not be promoted to one.
  const bodyOnly = byId.get('UC-045');
  assert.ok(bodyOnly, 'UC-045 must exist in the corpus');
  assert.match(bodyOnly.markdown, /^- 問題：/m, 'fixture assumption: UC-045 has a body 問題 line');
  assert.notEqual(api.coreGoalView(bodyOnly).source, 'declared', 'a body 問題 line is not a goal declaration');
});

test('a page that only writes the problem as a section gets a pointer, not a sentence', () => {
  const offenders = [];
  for (const entry of entries) {
    if (leadDeclaresGoal(entry.markdown)) continue;
    const heading = problemSection(entry.markdown);
    const view = api.coreGoalView(entry);
    if (!heading) continue;
    const problems = [];
    if (view.source !== 'section') problems.push('source=' + view.source);
    if (view.text !== '') problems.push('invented text');
    if (!view.note.includes('〈' + heading + '〉')) problems.push('note omits the section title');
    if (!view.note.includes('未在頁首宣告核心目標')) problems.push('note does not say the page declares none');
    if (problems.length) offenders.push(`${entry.id} → ${problems.join(', ')}`);
  }
  assert.ok(offenders.length === 0, offenders.join('; '));
});

test('a page with neither declaration says so instead of dropping the block', () => {
  const offenders = [];
  for (const entry of entries) {
    if (leadDeclaresGoal(entry.markdown) || problemSection(entry.markdown)) continue;
    const view = api.coreGoalView(entry);
    const problems = [];
    if (view.source !== 'missing') problems.push('source=' + view.source);
    if (view.text !== '') problems.push('invented text');
    if (!view.note.includes('未宣告核心目標')) problems.push('note does not name the gap');
    if (problems.length) offenders.push(`${entry.id} → ${problems.join(', ')}`);
  }
  assert.deepEqual(offenders, [], 'an undeclared goal must be named as a gap');
});

test('the corpus splits cleanly into declared, section and missing', () => {
  const counts = { declared: 0, section: 0, missing: 0 };
  for (const entry of entries) counts[api.coreGoalView(entry).source] += 1;
  assert.equal(counts.declared + counts.section + counts.missing, entries.length);
  assert.ok(counts.declared > 0 && counts.section > 0 && counts.missing > 0,
    `all three states must exist (declared ${counts.declared}, section ${counts.section}, missing ${counts.missing})`);
  // The card only prints a goal for a declared page, so this state must not be
  // reachable with an empty sentence.
  for (const entry of entries) {
    const view = api.coreGoalView(entry);
    assert.equal(view.source === 'declared', Boolean(entry.coreGoal), `${entry.id} declares without a sentence`);
  }
});
