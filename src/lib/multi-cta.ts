/**
 * Multi-CTA: returnerar bara explicit skickade URL:er.
 * Ingen auto-resolution, ingen token-matchning, ingen gissning.
 * Primär CTA kommer alltid från explicit ctaHref på sidan.
 */

import { getStore, getEffectiveCommission } from '../data/affiliate-stores';

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

export function resolveMultiCTA(
  _productName: string,
  options: { fallback?: { store: string; url: string } } = {}
): MultiCTAResult | undefined {
  const { fallback } = options;
  if (!fallback) return undefined;

  const store = getStore(fallback.store);
  if (!store || store.network === 'direct') return undefined;

  const primary: CTAOption = {
    store: store.name,
    url: fallback.url,
    commission: getEffectiveCommission(store, undefined),
  };

  return { primary, others: [], all: [primary] };
}
