#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync(
  'grep -rl "ComparisonTable\\|ProductCard" src/pages/',
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

let injected = 0;
let skipped = 0;
let noProducts = 0;

for (const file of files) {
  let src = readFileSync(file, 'utf8');

  if (src.includes('TopPick')) { skipped++; continue; }
  if (!/const\s+products\s*=\s*\[/.test(src)) { noProducts++; continue; }

  const importLineMatch = src.match(/import\s+ComparisonTable\s+from\s+'([^']+)';/);
  if (!importLineMatch) { skipped++; continue; }

  const compPath = importLineMatch[1].replace(/ComparisonTable\.astro$/, 'TopPick.astro');
  const importStmt = `import TopPick from '${compPath}';`;

  if (!src.includes(importStmt)) {
    src = src.replace(
      /(import\s+ComparisonTable\s+from\s+'[^']+';)/,
      `$1\n${importStmt}`
    );
  }

  // Inject <TopPick product={products[0]} /> before the FIRST <ComparisonTable
  const injection = `<TopPick product={products[0]} />\n\n  `;
  const compTagRegex = /(<ComparisonTable\b)/;
  if (!compTagRegex.test(src)) { skipped++; continue; }
  src = src.replace(compTagRegex, `${injection}$1`);

  writeFileSync(file, src);
  injected++;
}

console.log(`Injected: ${injected}`);
console.log(`Skipped (already had / no ComparisonTable import): ${skipped}`);
console.log(`No products array: ${noProducts}`);
console.log(`Total scanned: ${files.length}`);
