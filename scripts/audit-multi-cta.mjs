#!/usr/bin/env node
/**
 * Audit multi-CTA coverage on bebisguiden.
 *
 * 1. Extract all product names from ProductCard / ComparisonTable / CTABox usages.
 * 2. For each, run the same brand-detection + feed-match logic as lib/multi-cta.ts.
 * 3. Report:
 *    - Total unique products
 *    - Products with 0/1/2+ store matches
 *    - Brand-detection failures (suggest missing entries to BRAND_TO_STORES)
 *    - Top brands by usage with multi-store coverage stats
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// 1. Load BRAND_TO_STORES from src/data/brand-stores.ts (parse the JSON-like literal)
const brandStoresSrc = fs.readFileSync(path.join(ROOT, 'src/data/brand-stores.ts'), 'utf8');
const brandMap = {};
{
  const m = brandStoresSrc.match(/export const BRAND_TO_STORES[^=]*=\s*({[\s\S]*?});/);
  if (!m) throw new Error('BRAND_TO_STORES not found');
  const obj = (new Function('return ' + m[1]))();
  Object.assign(brandMap, obj);
}
console.error(`Loaded ${Object.keys(brandMap).length} brands in BRAND_TO_STORES`);

// 2. Load all feed JSON files
const feedDir = path.join(ROOT, 'src/data/feed-matches');
const storeFiles = fs.readdirSync(feedDir).filter((f) => f.endsWith('.json'));
const feeds = {};
const allFeedEntries = []; // flat array of {store, title, brand, key}
const brandToStoresFromFeed = {}; // brand → Set<store>

const storeFromFile = (fname) => {
  const base = fname.replace('.json', '');
  // Map filename to display store name (matches affiliate-stores.ts keys)
  const map = {
    'jollyroom': 'Jollyroom', 'baby_v': 'Baby V', 'babyland': 'Babyland',
    'stor_liten': 'Storliten', 'polarn_o_pyret': 'Polarn O. Pyret',
    'babysam': 'Babysam', 'bookbeat': 'Bookbeat', 'partykungen': 'Partykungen.se',
    'leksaksaff_ren': 'Leksaksaffaren', 'xplora': 'Xplora', 'addrevenue': '(addrevenue-multi)',
  };
  return map[base] || base;
};

for (const f of storeFiles) {
  const storeKey = f.replace('.json', '');
  const display = storeFromFile(f);
  const data = JSON.parse(fs.readFileSync(path.join(feedDir, f), 'utf8'));
  feeds[storeKey] = data;
  for (const [key, entry] of Object.entries(data)) {
    const brand = (entry.brand || '').trim();
    const title = (entry.title || '').trim();
    allFeedEntries.push({ store: display, brand, title, key });
    if (brand) {
      const blow = brand.toLowerCase();
      if (!brandToStoresFromFeed[blow]) brandToStoresFromFeed[blow] = new Set();
      brandToStoresFromFeed[blow].add(display);
    }
  }
}
console.error(`Loaded ${allFeedEntries.length} feed entries, ${Object.keys(brandToStoresFromFeed).length} unique brands in feed`);

// 3. Replicate brand detection from src/lib/multi-cta.ts
function detectBrandFromName(productName) {
  const lower = productName.toLowerCase().trim();
  const candidates = Object.keys(brandMap).sort((a, b) => b.length - a.length);
  for (const brand of candidates) {
    if (brand.length < 3) continue;
    if (lower.startsWith(brand) || lower.includes(` ${brand} `) || lower.includes(` ${brand}`)) {
      return brand;
    }
  }
  return undefined;
}

// 4. Replicate feed-match logic from src/lib/cta-resolver.ts (token overlap >= 2)
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9åäö]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokenOverlap(a, b) {
  const aT = new Set(normalize(a).split(' ').filter((t) => t.length > 2));
  const bT = new Set(normalize(b).split(' ').filter((t) => t.length > 2));
  let n = 0;
  for (const t of aT) if (bT.has(t)) n++;
  return n;
}

// 5. Find store entries for a brand (proxy: anywhere brand appears in feed entries)
function getStoresForBrand(brand) {
  return brandMap[brand.toLowerCase()] || [];
}

function feedEntriesForStore(storeName) {
  // Filter allFeedEntries by store name match (case insensitive)
  return allFeedEntries.filter((e) => e.store.toLowerCase() === storeName.toLowerCase());
}

function resolveStoreForProduct(storeName, productName) {
  const entries = feedEntriesForStore(storeName);
  if (entries.length === 0) return false;
  let bestScore = 0;
  for (const e of entries) {
    const s = tokenOverlap(productName, e.title);
    if (s >= 2) return true;
    if (s > bestScore) bestScore = s;
  }
  return false;
}

// 6. Extract product names from pages: ProductCard name="..." / ComparisonTable products=[{name:...}] / CTABox productName="..."
function* walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) yield* walk(full);
    else if (f.name.endsWith('.astro') || f.name.endsWith('.tsx') || f.name.endsWith('.ts')) yield full;
  }
}

const productNames = new Map(); // name → { pages: Set<file>, source: kind }
const seenAtFile = new Map(); // file → Set<name>

function addProduct(name, file, source) {
  name = name.trim();
  if (!name) return;
  if (!productNames.has(name)) productNames.set(name, { pages: new Set(), source });
  productNames.get(name).pages.add(file);
  if (!seenAtFile.has(file)) seenAtFile.set(file, new Set());
  seenAtFile.get(file).add(name);
}

const pagesDir = path.join(ROOT, 'src/pages');
for (const file of walk(pagesDir)) {
  const t = fs.readFileSync(file, 'utf8');
  // ProductCard name="..."
  for (const m of t.matchAll(/<ProductCard[\s\S]*?\bname\s*=\s*["']([^"']+)["']/g)) addProduct(m[1], file, 'ProductCard');
  // CTABox productName="..."
  for (const m of t.matchAll(/<CTABox[\s\S]*?\bproductName\s*=\s*["']([^"']+)["']/g)) addProduct(m[1], file, 'CTABox');
  // ComparisonTable: { name: "..." } or name: '...'
  if (/<ComparisonTable\b/.test(t)) {
    // Crude: grab name: "..." values within the file (may over-collect but OK for audit)
    for (const m of t.matchAll(/\bname\s*:\s*["']([^"']+)["']/g)) addProduct(m[1], file, 'ComparisonTable');
  }
}

console.error(`Extracted ${productNames.size} unique product names from ${seenAtFile.size} pages`);

// 7. For each product: run the audit
const results = [];
for (const [name, info] of productNames) {
  const brand = detectBrandFromName(name);
  const brandStores = brand ? getStoresForBrand(brand) : [];
  let matchedStores = [];
  if (brand) {
    for (const s of brandStores) {
      if (resolveStoreForProduct(s, name)) matchedStores.push(s);
    }
  }
  // Also try: which feed-brands match the product name (even if not in BRAND_TO_STORES)?
  const feedBrandsInName = [];
  for (const fb of Object.keys(brandToStoresFromFeed)) {
    if (fb.length < 3) continue;
    const lower = name.toLowerCase();
    if (lower.startsWith(fb) || lower.includes(` ${fb} `) || lower.includes(` ${fb}`)) {
      feedBrandsInName.push(fb);
    }
  }
  feedBrandsInName.sort((a, b) => b.length - a.length);
  const topFeedBrand = feedBrandsInName[0];
  const feedBrandStores = topFeedBrand ? [...(brandToStoresFromFeed[topFeedBrand] || [])] : [];
  results.push({
    name,
    pages: info.pages.size,
    source: info.source,
    detectedBrand: brand || null,
    brandInMap: !!brand,
    brandStoresInMap: brandStores,
    matchedStoresViaMap: matchedStores,
    feedBrandDetected: topFeedBrand || null,
    feedBrandStoreCount: feedBrandStores.length,
    feedBrandStores,
  });
}

// 8. Aggregate report
const summary = {
  totalUnique: results.length,
  brandDetected: results.filter((r) => r.brandInMap).length,
  multiStoreSuccess: results.filter((r) => r.matchedStoresViaMap.length >= 1).length,
  zeroMatches: results.filter((r) => r.matchedStoresViaMap.length === 0).length,
  fixableViaFeedBrand: results.filter((r) => !r.brandInMap && r.feedBrandDetected && r.feedBrandStoreCount >= 2).length,
};

// 9. Find missing brands to add: feed-brands present in pages but missing from BRAND_TO_STORES
const missingBrands = new Map(); // brand → { usage: count, stores: Set, sampleProducts: [] }
for (const r of results) {
  if (r.brandInMap) continue;
  if (!r.feedBrandDetected) continue;
  if (r.feedBrandStoreCount < 2) continue;
  const fb = r.feedBrandDetected;
  if (!missingBrands.has(fb)) missingBrands.set(fb, { usage: 0, stores: new Set(), sampleProducts: [] });
  const entry = missingBrands.get(fb);
  entry.usage += r.pages;
  for (const s of r.feedBrandStores) entry.stores.add(s);
  if (entry.sampleProducts.length < 3) entry.sampleProducts.push(r.name);
}

// 10. Output
const out = {
  summary,
  missingBrandsRanked: [...missingBrands.entries()]
    .map(([brand, v]) => ({ brand, usage: v.usage, stores: [...v.stores], sampleProducts: v.sampleProducts }))
    .sort((a, b) => b.usage - a.usage),
  zeroMatchProducts: results
    .filter((r) => r.matchedStoresViaMap.length === 0)
    .map((r) => ({ name: r.name, pages: r.pages, detectedBrand: r.detectedBrand, feedBrandDetected: r.feedBrandDetected, feedBrandStoreCount: r.feedBrandStoreCount }))
    .slice(0, 50),
};

console.log(JSON.stringify(out, null, 2));
