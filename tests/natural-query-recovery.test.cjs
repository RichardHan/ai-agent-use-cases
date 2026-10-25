const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/app.js', 'utf8').split('/* Browser event bindings. */')[0];
const context = vm.createContext({});
vm.runInContext(source + '\nthis.api={prioritizeProblemTags};', context);

test('a conversational empty query suggests its matching task before unrelated tasks', () => {
  const tags = [{term:'郵件'}, {term:'會議'}, {term:'旅遊'}];
  assert.deepEqual(Array.from(context.api.prioritizeProblemTags(tags, '我想整理會議記錄'), x => x.term), ['會議','郵件','旅遊']);
  assert.deepEqual(Array.from(context.api.prioritizeProblemTags(tags, '找不存在的內容'), x => x.term), ['郵件','會議','旅遊']);
  assert.deepEqual(Array.from(tags, x => x.term), ['郵件','會議','旅遊']);
});
