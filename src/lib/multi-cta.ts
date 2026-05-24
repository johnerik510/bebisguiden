/**
 * Multi-CTA-resolver: returnerar alla affiliatebutiker som säljer en produkt,
 * sorterade efter provision (högst först).
 *
 * Källor (samma som resten av systemet, ingen ny URL-konstruktion):
 *   - BRAND_TO_STORES: vilka butiker säljer märket (från feed-import)
 *   - resolveTrackedUrl: hämtar verifierad feed-URL per (store, produkt)
 *   - Fallback-URL: hand-verifierad URL som sidan skickar in (om feed missar)
 *
 * Primary CTA = högsta commission. Sekundära CTA:er visas som "Även hos"-länkar.
 */

import { BRAND_TO_STORES } from '../data/brand-stores';
import { getStore, getEffectiveCommission } from '../data/affiliate-stores';
import { resolveTrackedUrl, resolveBrandUrl } from './cta-resolver';

export interface CTAOption {
  store: string;
  url: string;
  commission: number;
}

export interface MultiCTAResult {
  primary: CTAOption;
  others: CTAOption[];
  all: CTAOption[];
}

interface ResolveOptions {
  /** Märket , om angivet används det för brand→stores-lookup. */
  brand?: string;
  /** Hand-verifierad URL från sidan (används om feed missar för dess butik). */
  fallback?: { store: string; url: string };
  /** Max antal CTA:er totalt (primary + others). Default 4. */
  max?: number;
}

/** Detektera märke från produktnamn genom att matcha första delen mot kända brands. */
function detectBrandFromName(productName: string): string | undefined {
  const lower = productName.toLowerCase().trim();
  // Sortera längsta brand först så "Polarn O. Pyret" vinner över "Polarn"
  const candidates = Object.keys(BRAND_TO_STORES).sort((a, b) => b.length - a.length);
  for (const brand of candidates) {
    if (brand.length < 3) continue;
    if (lower.startsWith(brand) || lower.includes(` ${brand} `) || lower.includes(` ${brand}`)) {
      return brand;
    }
  }
  return undefined;
}

export function resolveMultiCTA(
  productName: string,
  options: ResolveOptions = {}
): MultiCTAResult | undefined {
  const { fallback, max = 4 } = options;
  const brand = options.brand?.toLowerCase() || detectBrandFromName(productName);
  const seen = new Set<string>();
  const out: CTAOption[] = [];

  const tryAdd = (storeName: string, url: string | undefined) => {
    if (!url) return;
    const store = getStore(storeName);
    if (!store || store.network === 'direct') return;
    const key = store.name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const commission = getEffectiveCommission(store, brand);
    out.push({ store: store.name, url, commission });
  };

  // Fallback (explicit ctaHref från sidan) läggs in FÖRST, den är mer auktoritativ
  // än token-matching som inte kan skilja på storlekar (enkelsiffriga tal filtreras bort).
  if (fallback) {
    tryAdd(fallback.store, fallback.url);
  }

  if (brand) {
    const brandStores = BRAND_TO_STORES[brand] || [];
    for (const storeName of brandStores) {
      // Försök exakt produkt-match (token-overlap >= 2), sedan brand-fallback.
      // Om butiken redan lagts till via explicit fallback ovan hoppas den över.
      let url = resolveTrackedUrl(storeName, productName);
      if (!url) url = resolveBrandUrl(storeName, brand, productName);
      tryAdd(storeName, url);
    }
  }

  if (out.length === 0) return undefined;

  out.sort((a, b) => b.commission - a.commission);
  const limited = out.slice(0, max);

  return {
    primary: limited[0],
    others: limited.slice(1),
    all: limited,
  };
}
