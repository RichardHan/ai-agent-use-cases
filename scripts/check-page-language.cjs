const fs = require('node:fs');
const path = require('node:path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node scripts/check-page-language.cjs <built-site-directory>');

for (const page of ['index.html', 'INDEX.html', 'cases/001-travel-checkout.html', 'sources/qualification-audit-2026-10-16.html']) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  if (!/<html\b[^>]*\blang=["']zh-Hant["']/i.test(html)) {
    throw new Error(`${page}: expected html lang="zh-Hant"`);
  }
  console.log(`PASS: ${page} declares zh-Hant`);
}
