const fs = require('node:fs');
const path = require('node:path');

const pages = ['index.html', 'INDEX.html', 'cases/001-travel-checkout.html', 'sources/qualification-audit-2026-10-16.html'];

function checkPageLanguage(page, html) {
  if (!/<html\b[^>]*\blang=["']zh-Hant["']/i.test(html)) {
    throw new Error(`${page}: expected html lang="zh-Hant"`);
  }
  if (page !== 'index.html' && !/<meta\b[^>]*property=["']og:locale["'][^>]*content=["']zh_TW["']/i.test(html)) {
    throw new Error(`${page}: expected og:locale="zh_TW"`);
  }
}

module.exports = { pages, checkPageLanguage };

if (require.main === module) {
  const root = process.argv[2];
  if (!root) throw new Error('Usage: node scripts/check-page-language.cjs <built-site-directory>');
  for (const page of pages) {
    checkPageLanguage(page, fs.readFileSync(path.join(root, page), 'utf8'));
    console.log(`PASS: ${page} declares zh-Hant`);
  }
}
