#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('grep -rl "<TopPick product={products\\[0\\]}" src/pages/', { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

let injected = 0;
let already = 0;
let skipped = 0;

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  if (src.includes('StickyTop3Bar')) { already++; continue; }

  const importMatch = src.match(/import\s+TopPick\s+from\s+'([^']+)';/);
  if (!importMatch) { skipped++; continue; }
  const path = importMatch[1].replace(/TopPick\.astro$/, 'StickyTop3Bar.astro');
  const importStmt = `import StickyTop3Bar from '${path}';`;

  src = src.replace(/(import\s+TopPick\s+from\s+'[^']+';)/, `$1\n${importStmt}`);

  const stickyCTAUsage = /<StickyCTA\s[^>]*\/>\s*/;
  if (stickyCTAUsage.test(src)) {
    src = src.replace(stickyCTAUsage, `<StickyTop3Bar products={products} />\n`);
  } else {
    const closingTag = /(<\/ArticleLayout>)/;
    if (closingTag.test(src)) {
      src = src.replace(closingTag, `<StickyTop3Bar products={products} />\n$1`);
    } else { skipped++; continue; }
  }

  writeFileSync(file, src);
  injected++;
}

console.log(`Injected: ${injected}`);
console.log(`Already had: ${already}`);
console.log(`Skipped: ${skipped}`);
