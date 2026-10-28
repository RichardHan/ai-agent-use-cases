'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, javaScriptEnabled: false });
      await page.goto(process.env.INDEX_URL || 'https://richardhan.github.io/ai-agent-use-cases/INDEX.html');
      for (const [name, target] of [['直接看案例列表', 'case-list'], ['查看驗證與模板補充', 'supplement-list'], ['查看待查來源', 'pending-sources']]) {
        const link = page.getByRole('link', { name, exact: true });
        await link.focus();
        assert.equal(await link.evaluate(node => document.activeElement === node), true);
        await page.keyboard.press('Enter');
        assert.equal(new URL(page.url()).hash, `#${target}`);
        assert.equal(await page.locator(`#${target}`).count(), 1);
        assert.ok(await page.locator(`#${target}`).evaluate(node => Math.abs(node.getBoundingClientRect().top)) < 100);
      }
      await page.close();
    }
    console.log('Index navigation: JS-disabled mobile/desktop keyboard anchors passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
