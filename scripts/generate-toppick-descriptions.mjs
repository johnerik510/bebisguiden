#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('grep -rl "<TopPick product={products\\[0\\]}" src/pages/', { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

// Extract category/topic from breadcrumbs label or page title
function extractTopic(src) {
  // Try last breadcrumb label
  const bc = src.match(/breadcrumbs\s*=\s*\[[\s\S]*?\];/);
  if (bc) {
    const labels = [...bc[0].matchAll(/label:\s*'([^']+)'/g)].map(m => m[1]);
    if (labels.length > 1) return labels[labels.length - 1].toLowerCase();
  }
  // Fall back to ArticleLayout title
  const t = src.match(/title="([^"]+)"/);
  if (t) return t[1].split(/[,:]/)[0].trim().toLowerCase();
  return null;
}

// Extract first product object as JS-ish text and parse out fields manually
function extractFirstProduct(src) {
  const arrStart = src.indexOf('const products');
  if (arrStart < 0) return null;
  const openBracket = src.indexOf('[', arrStart);
  const firstObjStart = src.indexOf('{', openBracket);
  // Find matching closing brace
  let depth = 0, end = firstObjStart;
  for (let i = firstObjStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  const obj = src.slice(firstObjStart, end + 1);

  const get = (key) => {
    const re = new RegExp(`['"]?${key}['"]?\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*?)\\1`);
    const m = obj.match(re);
    return m ? m[2] : null;
  };
  // Extract features object as map
  const featuresMatch = obj.match(/features\s*:\s*\{([\s\S]*?)\}/);
  const features = {};
  if (featuresMatch) {
    const re = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = re.exec(featuresMatch[1])) !== null) features[m[1]] = m[2];
  }
  return { name: get('name'), badge: get('badge'), price: get('price'), rating: get('rating'), features };
}

// Pick 2 most descriptive feature pairs (prefer non-price, non-rating)
function pickFeatures(features) {
  if (!features) return [];
  const skipKeys = /^(pris|price|betyg|rating|vikt|storlek)$/i;
  const entries = Object.entries(features).filter(([k]) => !skipKeys.test(k));
  return entries.slice(0, 2).map(([k, v]) => `${k.toLowerCase()}: ${v}`);
}

function pickFeatureValues(features) {
  if (!features) return [];
  const skipKeys = /^(pris|price|betyg|rating|ekologisk|certifierad)$/i;
  const skipValues = /^(ja|nej|n\/a|saknas|-)$/i;
  return Object.entries(features)
    .filter(([k, v]) => !skipKeys.test(k) && typeof v === 'string' && v.length > 3 && !skipValues.test(v.trim()))
    .slice(0, 2)
    .map(([, v]) => v);
}

function buildDescription({ name, badge, features }, topic) {
  const fv = pickFeatureValues(features);
  const topicLabel = topic || 'kategorin';
  const badgeLabel = badge ? badge.toLowerCase() : 'topprankade val';

  if (fv.length >= 2) {
    return `${name} är vårt ${badgeLabel} bland ${topicLabel}: ${fv[0]} och ${fv[1]} ger en stark helhet. Ett tryggt val om du vill minimera risken för felköp.`;
  }
  if (fv.length === 1) {
    return `${name} är vårt ${badgeLabel} bland ${topicLabel}, främst tack vare ${fv[0]}. Bra balans mellan kvalitet, prestanda och pris.`;
  }
  return `${name} är vårt ${badgeLabel} bland ${topicLabel}. Bra balans mellan kvalitet, prestanda och pris i jämförelsen.`;
}

let updated = 0, skipped = 0;
for (const file of files) {
  let src = readFileSync(file, 'utf8');
  if (src.includes('TOPPICK_KEEP')) { skipped++; continue; }
  const product = extractFirstProduct(src);
  if (!product || !product.name) { skipped++; continue; }
  const topic = extractTopic(src);
  let desc = buildDescription(product, topic);
  // Escape double quotes for JSX attribute
  desc = desc.replace(/"/g, '&quot;');

  const newTag = `<TopPick product={products[0]} description="${desc}" />`;
  src = src.replace(/<TopPick product=\{products\[0\]\}(?:\s+description="[^"]*")?\s*\/>/, newTag);
  writeFileSync(file, src);
  updated++;
}

console.log(`Updated: ${updated}`);
console.log(`Skipped: ${skipped}`);
