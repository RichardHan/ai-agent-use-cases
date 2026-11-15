'use strict';
const assert = require('node:assert/strict');
const {ensureFiltersVisible} = require('./filter-controls.cjs');

// Real corpus fixtures exercise tools beyond the old two-name cutoff, including
// the longest current list. No filter-dependent ordering or new UI state.
module.exports = async ({browser, origin}) => {
  for (const [width, height] of [[1440, 900], [390, 844], [320, 740]]) {
    const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
    try {
      const page = await context.newPage();
      for (const id of ['UC-046', 'UC-067']) {
        await page.goto(origin + '?q=' + id + '&scope=topic&tool=Notion#explore', {waitUntil: 'networkidle'});
        await page.locator('#results .card').waitFor();
        const tools = await page.evaluate(id => entries.find(item => item.id === id).tools, id);
        assert(tools.includes('Notion'));
        for (const area of ['#results', '#drawn-case']) {
          const label = page.locator(area + ' .card-id-tool');
          const text = await label.innerText();
          for (const tool of tools) assert(text.includes(tool), `${width}px ${area} ${id}: missing ${tool}`);
          const bounds = await label.evaluate(node => {
            const text = document.createRange();
            text.selectNodeContents(node);
            const card = node.closest('.card').getBoundingClientRect();
            return {fits: [...text.getClientRects()].every(rect => rect.left >= card.left && rect.right <= card.right), clipped: node.scrollWidth > node.clientWidth};
          });
          assert(bounds.fits && !bounds.clipped, `${width}px ${area} ${id}: tools must wrap inside the card`);
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.locator('#results .card').screenshot({path: `qa-artifacts/card-tools-${id}-${width}.png`});
        // Removing a filter keeps the same case and complete tool list, including
        // the retained drawn card; it must not depend on the previous filter.
        await ensureFiltersVisible(page);
        await page.locator('#tool').selectOption('');
        assert((await page.locator('#drawn-case .card-id-tool').innerText()).includes('Notion'));
        await ensureFiltersVisible(page);
        await page.locator('#tool').selectOption('GitHub');
        const trigger = page.locator('#results h3 button');
        await trigger.focus();
        await page.keyboard.press('Enter');
        await page.locator('#detail[open]').waitFor();
        await page.keyboard.press('Escape');
        assert(await trigger.evaluate(node => document.activeElement === node));
        assert.equal(await page.locator('#tool').inputValue(), 'GitHub');
        for (const tool of tools) assert((await page.locator('#results .card-id-tool').innerText()).includes(tool));
      }
      console.log(`PASS CARD TOOLS: ${width}px, complete lists in results/draw, wrapping, filter changes and keyboard return`);
    } finally {
      await context.close();
    }
  }
};
