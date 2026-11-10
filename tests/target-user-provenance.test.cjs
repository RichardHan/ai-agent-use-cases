'use strict';
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

vm.runInContext(source + '\nthis.api={parseFile,targetUserView,SCENARIO_TARGET_USERS};', context);
const api = context.api;
vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);

const files = ['cases', 'evidence']
  .flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => dir + '/' + name))
  .concat('sources/pending.md');
const entries = files.flatMap(file => Array.from(api.parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));
const leadDeclaresAudience = markdown => /^-\s*目標使用者\s*[：:]\s*\S/m.test(markdown);

test('every page declaring - 目標使用者 keeps that sentence as a declared audience', () => {
  const offenders = entries
    .filter(entry => leadDeclaresAudience(entry.markdown))
    .map(entry => ({ entry, view: api.targetUserView(entry) }))
    .filter(({ entry, view }) => !view || view.source !== 'declared' || view.text !== entry.targetUser || view.heading !== '適合對象')
    .map(({ entry, view }) => `${entry.id} → ${view && view.source} / ${view && view.heading}`);

  assert.deepEqual(offenders, [], 'a declared audience must render as 適合對象 with its own wording');
});

test('pages without - 目標使用者 never present the library persona as their audience', () => {
  const offenders = [];
  for (const entry of entries) {
    if (leadDeclaresAudience(entry.markdown)) continue;
    const view = api.targetUserView(entry);
    if (!api.SCENARIO_TARGET_USERS[entry.scenario]) {
      assert.equal(view, null, `${entry.id} has no scenario persona to show`);
      continue;
    }
    const problems = [];
    if (!view) problems.push('no view');
    else {
      if (view.source !== 'scenario') problems.push('source=' + view.source);
      if (view.heading !== '情境常見讀者' || view.label.includes('適合對象')) problems.push('wording=' + view.heading);
      if (!view.note.includes('案例頁未宣告適合對象')) problems.push('note missing disclosure');
      if (!view.note.includes('「' + entry.scenario + '」')) problems.push('note missing scenario name');
      if (view.text !== api.SCENARIO_TARGET_USERS[entry.scenario]) problems.push('text is not the scenario persona');
    }
    if (problems.length) offenders.push(`${entry.id} → ${problems.join(', ')}`);
  }

  assert.deepEqual(offenders, [], 'an undeclared audience must be labelled as the library scenario default');
});

test('the corpus splits cleanly: every entry is either declared or disclosed as a scenario default', () => {
  const declared = entries.filter(entry => leadDeclaresAudience(entry.markdown)).length;
  const scenario = entries.filter(entry => !leadDeclaresAudience(entry.markdown) && api.targetUserView(entry)).length;
  const silent = entries.filter(entry => !leadDeclaresAudience(entry.markdown) && !api.targetUserView(entry));

  assert.deepEqual(silent.map(entry => entry.id), [], 'no entry may drop the audience section silently when a persona exists');
  assert.equal(declared + scenario + silent.length, entries.length);
  assert.ok(declared > 0 && scenario > 0, `corpus should keep both provenance classes (declared ${declared}, scenario ${scenario})`);
});

test('the declared count matches the pages that actually carry the field', () => {
  const declaredFiles = files.filter(file => leadDeclaresAudience(fs.readFileSync(path.join(root, file), 'utf8'))).length;
  const declaredEntries = entries.filter(entry => leadDeclaresAudience(entry.markdown)).length;
  assert.equal(declaredEntries, declaredFiles, 'a half-width colon or spacing must not silently turn a declaration into a fallback');
});
