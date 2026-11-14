'use strict';
const path = require('node:path');
module.paths.push('/Users/richard_han/orca/ai-agent-use-cases/node_modules');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const origin = process.env.ROUND_URL || process.env.TEST_URL || 'http://127.0.0.1:8124/ai-agent-use-cases/';
const axe = page => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
const overflow = page => page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'small', width: 320, height: 740 }
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(`${origin}?case=UC-278#explore`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#detail[open]', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const jumps = [...document.querySelectorAll('.reader-jump')].map(b => b.textContent.trim());
      const copyBtns = [...document.querySelectorAll('.reader-copy-button')].map(b => b.getAttribute('aria-label'));
      const methodBtn = [...document.querySelectorAll('.reader-jump')].find(b => b.textContent.includes('方法與步驟'));
      return { jumps, copyBtns, hasMethodBtn: !!methodBtn };
    });

    const isOverflow = await overflow(page);
    const axeResult = await axe(page);

    assert.equal(isOverflow, false, `${vp.name} UC-278 has horizontal overflow`);
    assert.equal(axeResult.violations.length, 0, `${vp.name} UC-278 has axe violations`);
    assert.equal(data.hasMethodBtn, true, `${vp.name} UC-278 must have method shortcut`);
    assert.ok(data.copyBtns.length >= 1, `${vp.name} UC-278 must have at least 1 copy button`);

    await context.close();
  }

  await browser.close();
  console.log('tests/method-and-prompt-browser.cjs passed successfully!');
})();
