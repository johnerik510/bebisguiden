/**
 * Resolve a verified tracker URL for a store.
 * Returnerar VERIFIED_LINKS[storeName] eller undefined.
 * Ingen token-matchning, ingen gissning.
 */

import { VERIFIED_LINKS } from '../data/verified-links';

export function resolveTrackedUrl(storeName: string): string | undefined {
  return VERIFIED_LINKS[storeName] ?? undefined;
}
