'use strict';
// A lead that was merged into cases must hand the reader to every case its source
// file names. P-004 says "已併入 UC-101…，另記 UC-102…" and INDEX.md lists both, but
// the site read only the first match: the badge, the card, the closure note, the
// print footer and the in-site handoff all pointed at UC-101 alone. These tests pin
// the whole handoff, plus the honest wording for a handled lead with no recorded
// destination ("已併入 null" used to be rendered as-is).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

class Node {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.textContent = '';
  }
  append(...children) {
    this.children.push(...children);
  }
  setAttribute(name, value) {
    this[name] = value;
  }
}

const context = vm.createContext({
  URL,
  Discovery: require('../assets/discovery.js'),
  document: {
    createElement: tag => new Node(tag),
    createTextNode: text => ({ textContent: text })
  }
});
vm.runInContext(
  fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0] +
    '\nthis.api={metadata,parseFile,parseMergedDestinations,mergedLabel,pendingStateBadge,cardKindBadge,resolvedPendingNote,mergeHandoffSentence,resolvedPendingTally};',
  context
);
const api = context.api;
vm.runInContext('displayCopy=' + fs.readFileSync(path.join(root, 'assets/copy.json'), 'utf8'), context);

const pendingMarkdown = fs.readFileSync(path.join(root, 'sources/pending.md'), 'utf8');
const pendingEntries = Array.from(api.parseFile('sources/pending.md', pendingMarkdown));
const pending = id => pendingEntries.find(entry => entry.id === id);

// Case ids come from the files themselves, so a destination that points at nothing
// fails here instead of becoming a handoff button that opens an empty dialog.
function caseIdsOnDisk() {
  const ids = new Set();
  for (const folder of ['cases', 'evidence']) {
    for (const file of fs.readdirSync(path.join(root, folder))) {
      const match = file.match(/^(\d{3})-/);
      if (match) ids.add('UC-' + match[1]);
    }
  }
  return ids;
}

test('every destination the source file names is carried into the page model', () => {
  const p004 = pending('P-004');
  assert.ok(p004, 'P-004 is parsed from sources/pending.md');
  assert.equal(p004.resolved, true, 'P-004 declares a dated 已處理 status');
  assert.deepEqual(Array.from(p004.mergedInto), ['UC-101', 'UC-102'], 'both destinations inside the status line survive, in source order');

  const p002 = pending('P-002');
  assert.deepEqual(Array.from(p002.mergedInto), ['UC-028'], 'a single destination stays a one-item list');
  assert.deepEqual(Array.from(pending('P-001').mergedInto), [], 'an open lead has no destinations');
});

test('each destination resolves to a case page the site can actually open', () => {
  const ids = caseIdsOnDisk();
  for (const entry of pendingEntries) {
    for (const id of entry.mergedInto) {
      assert.ok(ids.has(id), `${entry.id} points at ${id}, which must exist as a case page`);
    }
  }
  // INDEX.md is the static surface a reader may meet before the site loads: the two
  // surfaces must not disagree about where a lead went.
  const index = fs.readFileSync(path.join(root, 'INDEX.md'), 'utf8');
  assert.match(index, /P-004）已併入 UC-101／UC-102/, 'INDEX.md still lists both destinations for P-004');
});

test('the source prose and the parsed destinations never drift apart', () => {
  for (const entry of pendingEntries.filter(item => item.mergedInto.length)) {
    const clause = entry.markdown.split(/\n##\s/)[0];
    for (const id of entry.mergedInto) {
      assert.ok(
        clause.includes(id),
        `${entry.id} hands the reader to ${id}, so its own resolution clause must name ${id}`
      );
    }
  }
});

test('the badge, the card, the closure note and the handoff all name both destinations', () => {
  const p004 = pending('P-004');
  for (const [surface, text] of [
    ['detail badge', api.pendingStateBadge(p004)],
    ['card badge', api.cardKindBadge(p004)],
    ['closure note', api.resolvedPendingNote(p004)],
    ['handoff sentence', api.mergeHandoffSentence(p004)]
  ]) {
    assert.match(text, /UC-101、UC-102/, `${surface} must not drop the second destination: ${text}`);
  }
  const p002 = pending('P-002');
  assert.match(api.pendingStateBadge(p002), /已併入 UC-028/);
  assert.doesNotMatch(api.pendingStateBadge(p002), /、/, 'one destination is not printed with a separator');
});

test('a handled lead without a recorded destination says so instead of printing null', () => {
  const unrecorded = { id: 'P-009', kind: 'pending', resolved: true, mergedInto: [] };
  const badge = api.pendingStateBadge(unrecorded);
  const card = api.cardKindBadge(unrecorded);
  const note = api.resolvedPendingNote(unrecorded);
  const handoff = api.mergeHandoffSentence(unrecorded);
  for (const text of [badge, card, note, handoff]) {
    assert.doesNotMatch(text, /null|undefined|NaN/, `no placeholder may reach the reader: ${text}`);
    assert.doesNotMatch(text, /已併入\s*[。，、]/, `nothing may claim a merge without a destination: ${text}`);
  }
  assert.match(badge, /已處理/);
  assert.match(badge, /未記錄併入案例/);
  assert.match(card, /不另計數/, 'the card badge still explains why the entry is not counted');
  assert.match(note, /已結束/);
  assert.match(handoff, /未記錄併入的主案例/);
});

test('the statistics only count recorded merges as merges', () => {
  const tally = api.resolvedPendingTally(pendingEntries);
  assert.deepEqual({ ...tally }, { resolved: 2, merged: 2, unrecorded: 0 });
  const mixed = api.resolvedPendingTally([
    ...pendingEntries,
    { kind: 'pending', resolved: true, mergedInto: [] }
  ]);
  assert.deepEqual({ ...mixed }, { resolved: 3, merged: 2, unrecorded: 1 });
});

test('only a merge verb inside the resolution clause creates a destination', () => {
  const body = '# UC-998：測試案例\n\n- 一句話用途：只在正文提到另一個案例。\n- 情境：工作\n- 來源證據：`author-demo`。\n\n## 方法\n\n本文提到已合併 UC-999 與併入 UC-997，但這不是本頁的目的地。\n';
  assert.deepEqual(Array.from(api.parseFile('cases/998-test.md', body)[0].mergedInto), [], 'body prose is not a resolution clause');

  const heading = '# UC-996：主案例（已合併 UC-995，不另計）\n\n- 情境：工作\n';
  assert.deepEqual(Array.from(api.parseFile('cases/996-test.md', heading)[0].mergedInto), ['UC-995'], 'the heading form still resolves');

  assert.deepEqual(Array.from(api.parseMergedDestinations('已併入 UC-101，另記 UC-102，另記 UC-101。', 'P-009')), ['UC-101', 'UC-102'], 'duplicates collapse');
  assert.deepEqual(Array.from(api.parseMergedDestinations('已併入 UC-101。', 'UC-101')), [], 'a page never points at itself');
  assert.deepEqual(Array.from(api.parseMergedDestinations('參考 UC-103 的做法。', 'P-009')), [], 'a bare reference is not a destination');

  // A title that merely contains "合併" while describing the task is not a merge
  // declaration; the evidence line may use "合併UC-nnn", as UC-250 does.
  const looseTitle = '# UC-994：合併 UC-993 重複資料的檢查\n\n- 情境：工作\n- 來源證據：`author-demo`。\n';
  assert.deepEqual(Array.from(api.parseFile('cases/994-test.md', looseTitle)[0].mergedInto), [], 'a title only merges when it says 已合併');
  const evidenceLine = '# UC-995：來源補充\n\n- 情境：工作\n- 來源證據：重複流程；合併UC-993，不另計。\n';
  assert.deepEqual(Array.from(api.parseFile('cases/995-test.md', evidenceLine)[0].mergedInto), ['UC-993'], 'the evidence line keeps its 合併 form');
});
