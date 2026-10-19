'use strict';
// Independent review probe. Reads the checkout; never edits repository files.
// Usage: node /tmp/review-combined-oracle.cjs /tmp/ai-search-clear
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const root = path.resolve(process.argv[2] || '/tmp/ai-search-clear');
const context = vm.createContext({Discovery: require(path.join(root, 'assets/discovery.js'))});
vm.runInContext(fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* Browser event bindings. */')[0] + '\nthis.api={combinedRelaxationOptions,parseFile};', context);
const {combinedRelaxationOptions: actual, parseFile} = context.api;
const keys = ['kind', 'tool', 'category', 'proof', 'scenario'];
let seed = 1259;
const rand = n => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) % n;
};
// Fixtures contain only travel/code, so no alias expansion is needed here.
// This matcher does not call the product's filterEntries or relaxationOptions.
function countMatches(items, terms, filters) {
  return items.filter(item => terms.every(term => item.search.includes(term)) &&
    keys.every(key => !filters[key] || (key === 'tool' ? item.tools.includes(filters[key]) : item[key] === filters[key]))).length;
}
const normalize = options => Array.from(options, option => ({
  keys: Array.from(option.conditions, condition => condition.key).sort().join(','),
  count: option.count
})).sort((a, b) => a.keys.localeCompare(b.keys));
const classifications = {existingResult: 0, singleRecovery: 0, combinedRecovery: 0, noRecovery: 0};
for (let trial = 0; trial < 500; trial++) {
  const items = Array.from({length: 1 + rand(12)}, () => ({
    search: rand(2) ? 'travel' : 'code', kind: 'v' + rand(3),
    tools: ['v' + rand(3), 'v' + rand(3)], category: 'v' + rand(3),
    proof: 'v' + rand(3), scenario: 'v' + rand(3)
  }));
  const filters = Object.fromEntries(keys.map(key => [key, rand(4) ? 'v' + rand(3) : '']));
  const terms = rand(2) ? [] : ['travel'];
  const active = keys.filter(key => filters[key]);
  let expected = [];
  if (countMatches(items, terms, filters)) {
    classifications.existingResult++;
  } else {
    // Enumerate every subset independently, then choose its global minimum size.
    for (let mask = 1; mask < (1 << active.length); mask++) {
      const removed = active.filter((_, index) => (mask >> index) & 1);
      const kept = {...filters};
      removed.forEach(key => { kept[key] = ''; });
      const count = countMatches(items, terms, kept);
      if (count) expected.push({conditions: removed.map(key => ({key, value: filters[key]})), count});
    }
    const minimum = Math.min(...expected.map(option => option.conditions.length));
    classifications[minimum === 1 ? 'singleRecovery' : Number.isFinite(minimum) ? 'combinedRecovery' : 'noRecovery']++;
    expected = minimum === 1 ? [] : expected.filter(option => option.conditions.length === minimum);
  }
  assert.deepEqual(normalize(actual(items, terms, filters)), normalize(expected), 'oracle mismatch in trial ' + trial);
}
const files = ['cases', 'evidence'].flatMap(dir => fs.readdirSync(path.join(root, dir))
  .filter(file => file.endsWith('.md')).map(file => dir + '/' + file)).concat('sources/pending.md');
const corpus = files.flatMap(file => Array.from(parseFile(file, fs.readFileSync(path.join(root, file), 'utf8'))));
const allBad = Object.fromEntries(keys.map(key => [key, 'unknown']));
const samples = [];
for (let i = 0; i < 30; i++) {
  const started = performance.now();
  const result = actual(corpus, [], allBad);
  samples.push(performance.now() - started);
  assert.equal(result.length, 1);
  assert.equal(result[0].conditions.length, 5);
  assert.equal(result[0].count, corpus.length);
}
samples.sort((a, b) => a - b);
console.log(JSON.stringify({
  independentExhaustiveOracleCasesPassed: 500, classifications,
  corpusEntries: corpus.length,
  worstFacetSearchMedianMs: samples[15], worstFacetSearchMaxMs: samples[29],
  runtime: process.version, note: 'Local Node pure-function measurements; not browser end-to-end performance.'
}, null, 2));
