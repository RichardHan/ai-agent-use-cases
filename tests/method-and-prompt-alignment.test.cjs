'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { selectMethodShortcut, selectCopySections, promptSections } = require('../assets/reader.js');

test('UC-278 has 方法與步驟 shortcut and copyable prompt section', () => {
  const md = fs.readFileSync(path.join(__dirname, '../cases/278-machining-center-configuration-concept.md'), 'utf8');
  const sections = promptSections(md);
  const method = selectMethodShortcut(sections.map(s => s.title), 'case');
  assert.ok(method, 'UC-278 must have a method shortcut');
  assert.equal(method.title, '可借鑑流程（本庫設計，未實跑）');

  const copies = selectCopySections(sections, 'case');
  assert.equal(copies.length, 1, 'UC-278 must have exactly 1 copy section');
  assert.equal(sections[copies[0]].title, '可貼指令（本庫原創，未實測）');
});

test('methodHeading recognizes 可借鑑流程 without matching non-method headings', () => {
  assert.ok(selectMethodShortcut(['可借鑑流程'], 'case'));
  assert.ok(selectMethodShortcut(['可借鑑流程（本庫設計，未實跑）'], 'case'));
  assert.ok(selectMethodShortcut(['可借鑑流程（驗收部分為本庫設計）'], 'case'));
});

test('all (>=520) cases in corpus have 方法與步驟 shortcut and at least one copyable section', () => {
  const casesDir = path.join(__dirname, '../cases');
  const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.md')).sort();
  assert.ok(files.length >= 520, `Corpus must have at least 520 cases, got ${files.length}`);

  let missingMethod = [];
  let missingCopy = [];

  for (const f of files) {
    const md = fs.readFileSync(path.join(casesDir, f), 'utf8');
    const sections = promptSections(md);
    const method = selectMethodShortcut(sections.map(s => s.title), 'case');
    if (!method) missingMethod.push(f);
    const copies = selectCopySections(sections, 'case');
    if (!copies.length) missingCopy.push(f);
  }

  assert.deepEqual(missingMethod, [], 'Every case must have a method shortcut');
  assert.deepEqual(missingCopy, [], 'Every case must have at least one copyable prompt section');
});
