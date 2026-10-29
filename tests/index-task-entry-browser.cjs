const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, javaScriptEnabled: false });
      const indexURL = process.env.INDEX_URL || 'https://richardhan.github.io/ai-agent-use-cases/INDEX.html';
      for (const [slug, id] of [
        ['001-travel-checkout', 'UC-001'],
        ['049-daily-inbox-report-graduated-trust', 'UC-049'],
        ['154-contract-review-wait-time-analysis', 'UC-154'],
        ['293-draft-ai-audit-ai-notion-audit-record', 'UC-293']
      ]) {
        await page.goto(indexURL);
        const entry = page.locator(`#task-entry a[href$="cases/${slug}.html"]`);
        assert.equal(await entry.count(), 1, `${id} task entry exists without JavaScript`);
        await entry.focus();
        await page.keyboard.press('Enter');
        await page.waitForURL(`**/cases/${slug}.html`);
        assert.match(await page.locator('body').innerText(), new RegExp(id));
      }
      await page.close();
    }
    console.log('Static task entry: desktop and mobile keyboard navigation passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
