'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../assets/style.css'), 'utf8');


test('homepage hero exposes clear value proposition cards for first-time visitors', () => {
  const hero = html.match(/<section class="discovery-hero"[\s\S]*?<\/section>/)?.[0] || '';
  assert.ok(hero, 'discovery hero section must exist');
  
  // Value props container
  assert.match(hero, /<div class="hero-value-props"/, 'hero should contain value props container');
  assert.match(hero, /公開案例與研究筆記/);
  assert.match(hero, /清楚標記憑據/);
  assert.match(hero, /依痛點找解法/);
});

test('homepage hero offers beginner three-step guidance', () => {
  const hero = html.match(/<section class="discovery-hero"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(hero, /<div class="hero-guide-steps"/, 'hero should contain guide steps');
  const steps = [...hero.matchAll(/<span class="guide-step"><span class="step-num">(\d+)<\/span>\s*([^<]+)<\/span>/g)];
  assert.equal(steps.length, 3, 'hero guide should have 3 clear steps');
  
  assert.equal(steps[0][1], '1');
  assert.equal(steps[0][2].trim(), '依情境選方向');
  assert.equal(steps[1][1], '2');
  assert.equal(steps[1][2].trim(), '抽卡或搜任務');
  assert.equal(steps[2][1], '3');
  assert.equal(steps[2][2].trim(), '看做法與限制');
});

test('homepage hero exposes problem-oriented pain-point shortcuts', () => {
  const hero = html.match(/<section class="discovery-hero"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(hero, /<nav class="hero-problem-tags"/, 'hero should contain problem tags navigation');
  const problemLinks = [...hero.matchAll(/<a\b(?=[^>]*\bclass="[^"]*problem-tag[^"]*")(?=[^>]*\bhref="([^"]+)")[^>]*>([\s\S]*?)<\/a>/g)];
  assert.ok(problemLinks.length >= 4, 'hero should provide at least 4 problem-oriented shortcuts');
  
  for (const [, href, label] of problemLinks) {
    const url = new URL(href, 'https://example.test/ai-agent-use-cases/');
    assert.equal(url.hash, '#explore', 'problem links must navigate to #explore');
    assert.ok(url.searchParams.get('q'), 'problem links must set a query parameter');
    assert.ok(label.trim().length >= 2, 'problem links must have readable labels');
  }
});

test('assets/style.css defines responsive and touch-accessible rules for hero value elements', () => {
  assert.match(css, /\.hero-value-props\s*\{/, 'style.css must define .hero-value-props');
  assert.match(css, /\.value-prop-title\s*\{/, 'style.css must define .value-prop-title');
  assert.match(css, /\.hero-guide-steps\s*\{/, 'style.css must define .hero-guide-steps');
  assert.match(css, /\.hero-problem-tags\s*\{/, 'style.css must define .hero-problem-tags');
  assert.match(css, /\.problem-tag\s*\{[^}]*min-height:\s*44px/, '.problem-tag must have at least 44px touch target');
  assert.match(css, /\.problem-tag:focus-visible\s*\{/, '.problem-tag must have focus-visible styling');
});
