'use strict';
// The dead-end panel's task directory shows nine chips, at every width, and
// keeps the rest behind #empty-problem-toggle. Tests that reach a chip beyond
// the first nine (or read the directory's text) must open the disclosure first,
// exactly as a visitor would, instead of clicking a chip that is display:none.
// Dependency-free: it only uses the page object the test already owns.
async function expandEmptyTaskDirectory(page) {
  const toggle = page.locator('#empty-problem-toggle');
  if (!(await toggle.count())) return false;
  if (!(await toggle.isVisible())) return false;
  if ((await toggle.getAttribute('aria-expanded')) === 'true') return false;
  await toggle.click();
  return true;
}

module.exports = { expandEmptyTaskDirectory };
