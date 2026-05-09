/**
 * Multi-CTA helpers for bebisguiden.
 */
import { AFFILIATE_STORES, getStore, buildSearchDeeplink } from '../data/affiliate-stores';
import { getStoresForBrand, BRAND_TO_STORES, DEFAULT_STORES } from '../data/brand-stores';

export function detectBrandFromProductName(productName?: string): string | undefined {
  if (!productName) return undefined;
  const lower = productName.toLowerCase().trim();
  const candidates = Object.keys(BRAND_TO_STORES).sort((a, b) => b.length - a.length);
  for (const brand of candidates) {
    if (lower.startsWith(brand) || lower.includes(brand)) return brand;
  }
  return undefined;
}

export interface StoreCTA { name: string; url: string; }

export function enrichStores(input: any) { return []; }

export function buildSearchQuery(brand?: string, productName?: string): string {
  const parts = [];
  if (brand) parts.push(brand);
  if (productName) {
    const cleaned = productName
      .replace(/\s*\d+\s*ml\b/gi, '')
      .replace(/\s*\d+\s*g\b/gi, '')
      .trim();
    parts.push(cleaned);
  }
  return parts.join(' ').trim();
}

export function getCommission(storeName: string): number {
  return getStore(storeName)?.commission ?? 0;
}
