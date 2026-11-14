'use strict';
const path = require('path');
module.paths.push('/Users/richard_han/orca/ai-agent-use-cases/node_modules');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const origin = process.env.TEST_URL || 'http://127.0.0.1:8100/ai-agent-use-cases/';
const axe = page => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
const overflow = page => page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

async function boot(page) {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof discoveryReady !== 'undefined' && discoveryReady === true, null, { timeout: 30000 });
}

async function inspectCase(page, caseId) {
  await page.goto(`${origin}?case=${encodeURIComponent(caseId)}#explore`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#detail[open]', { timeout: 10000 });
  return await page.evaluate(() => {
    const summary = document.querySelector('.guidance-summary')?.textContent.trim() || '';
    const how = document.querySelector('.guidance-how p')?.textContent.trim() || '';
    const caution = document.querySelector('.guidance-caution p')?.textContent.trim() || '';
    const isGenericHow = how === '先閱讀原始報告與限制，再用小範圍、去敏資料設計自己的測試。';
    const isGenericCaution = caution === '本庫尚未獨立重現；先確認權限與驗收方式，不把案例報告當成成效保證。';
    return { summary, how, caution, isGenericHow, isGenericCaution };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'small', width: 320, height: 740 }
  ];
  const targetCases = ['UC-181', 'UC-072', 'UC-278', 'UC-430'];
  const results = {};

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await boot(page);

    results[vp.name] = {};
    for (const cid of targetCases) {
      const data = await inspectCase(page, cid);
      const isOverflow = await overflow(page);
      const axeResult = await axe(page);

      // Verify no horizontal overflow, no axe violations
      assert.equal(isOverflow, false, `${vp.name} ${cid} has horizontal overflow`);
      assert.equal(axeResult.violations.length, 0, `${vp.name} ${cid} has axe violations`);

      // Verify none of them return generic fallbacks anymore!
      assert.equal(data.isGenericHow, false, `${vp.name} ${cid} how is still generic`);
      assert.equal(data.isGenericCaution, false, `${vp.name} ${cid} caution is still generic`);

      // Save screenshot
      const shotPath = `docs/qa/2026-11-15-actionable-guidance-subsections/after-${vp.name}-${cid.toLowerCase()}.png`;
      await page.screenshot({ path: shotPath, fullPage: false });

      results[vp.name][cid] = {
        ...data,
        overflow: isOverflow,
        axeViolations: axeResult.violations.length,
        screenshot: shotPath
      };
      console.log(`[PASS] ${vp.name} ${cid}: how=${data.how.slice(0, 30)}... caution=${data.caution.slice(0, 30)}...`);
    }
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(
    'docs/qa/2026-11-15-actionable-guidance-subsections/after-measurements.json',
    JSON.stringify(results, null, 2)
  );
  console.log('Browser tests completed successfully!');
})();
