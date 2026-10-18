'use strict';
// Use the same visible disclosure a reader uses, including tests of old baselines.
exports.ensureFiltersVisible=async page=>{
 const panel=page.locator('#filter-options');
 if(await panel.count() && !(await panel.evaluate(n=>n.open)))
  await page.locator('#filter-summary').click();
};
