'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scenarioOf, discoveryPool, createDeck } = require('../assets/discovery.js');
const items = [
  {id:'UC-001',kind:'case',scenario:'生活',proof:'作者報告／示範'},
  {id:'UC-002',kind:'case',scenario:'創作',proof:'作者報告／示範'},
  {id:'UC-003',kind:'case',scenario:'省錢',proof:'官方自報'},
  {id:'UC-009',kind:'case',scenario:'工作',proof:'模板／文件核讀'},
  {id:'E-001',kind:'evidence',scenario:'生活'},
  {id:'P-001',kind:'pending',scenario:'生活'}
];
test('scenario comes from the declared lead metadata, never from later source prose', () => {
  assert.equal(scenarioOf('# UC-001\n\n- 情境：生活\n\n## 原文\n- 情境：開發'), '生活');
  assert.equal(scenarioOf('# UC-002\n\n- 核心目標：省錢\n\n## 情境\n- 情境：省錢'), '');
  assert.equal(scenarioOf('# UC-003\n\n- 情境：未定'), '');
});
test('discovery excludes pending leads, evidence supplements and untested templates', () => {
  assert.deepEqual(discoveryPool(items).map(x => x.id), ['UC-001','UC-002','UC-003']);
  assert.deepEqual(discoveryPool(items,'生活').map(x => x.id), ['UC-001']);
  assert.deepEqual(discoveryPool(items,'學習'), []);
  assert.deepEqual(discoveryPool([...items,items[0]]).map(x => x.id), ['UC-001','UC-002','UC-003']);
});
test('a deck visits every case once, avoids immediate repeats across rounds, and preserves input', () => {
  const pool=discoveryPool(items), original=pool.slice(), deck=createDeck(pool, () => 0.5);
  const first=[deck.next(),deck.next(),deck.next()];
  assert.equal(new Set(first.map(x=>x.item.id)).size,3);
  assert.equal(first[2].round,1);
  const next=deck.next();
  assert.equal(next.round,2);
  assert.notEqual(next.item.id,first[2].item.id);
  assert.deepEqual(pool,original);
});
test('empty and single-item decks have explicit states', () => {
  assert.equal(createDeck([]).next(),null);
  const deck=createDeck([items[0]]);
  assert.equal(deck.next().item.id,'UC-001');
  assert.equal(deck.next().round,2);
});
