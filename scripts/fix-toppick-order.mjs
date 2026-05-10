#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('grep -rl "TopPick" src/pages/', { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

let moved = 0;
for (const file of files) {
  let src = readFileSync(file, 'utf8');

  // Pattern: <h2 ...>Jämförelse...</h2>\n  <TopPick ... />\n\n  <ComparisonTable
  // Reorder to: <TopPick ... />\n\n  <h2 ...>Jämförelse...</h2>\n  <ComparisonTable
  const re = /(<h2\b[^>]*>[^<]*[Jj]ämförelse[^<]*<\/h2>)\s*(<TopPick[^>]*\/>)\s*\n*\s*(<ComparisonTable\b)/;
  if (re.test(src)) {
    src = src.replace(re, '$2\n\n  $1\n  $3');
    writeFileSync(file, src);
    moved++;
  }
}
console.log(`Reordered: ${moved}`);
