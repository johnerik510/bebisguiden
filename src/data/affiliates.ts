// Tracker-länkar och display-data för retailers som används i RetailerCTAs-griden
// samt i URL-detektering (ProductCard/TopPick/StickyCTA/StickyTop3Bar/ComparisonTable).
//
// SANNINGSORDNING (sedan 2026-05-18-refactor):
//   - `name`, `commission`, `searchUrl` läses ALLTID från `AFFILIATE_STORES` (affiliate-stores.ts).
//   - `trackBase` är homepage-tracker per Adtractions Create link, verified i `verified-links.ts`.
//   - `color` och `domain` är display-data som ligger lokalt här.
//
// Detta garanterar att commission aldrig divergerar mellan affiliate-stores.ts och denna fil.

import { AFFILIATE_STORES, getStore, type AffiliateStore } from './affiliate-stores';
import { VERIFIED_LINKS } from './verified-links';

export type Retailer = 'jollyroom' | 'kopbarnvagn' | 'babyland' | 'storochliten' | 'babyv' | 'babysam';

/**
 * Display-och-tracking-data per retailer. Bara fält som INTE finns i AFFILIATE_STORES.
 * trackBase MÅSTE komma från VERIFIED_LINKS (Adtraction Create link) ,  aldrig handbyggd.
 */
const RETAILER_DISPLAY: Record<Retailer, { storeName: string; domain: string; color: string; verifiedKey: string }> = {
  jollyroom: {
    storeName: 'Jollyroom',
    domain: 'jollyroom.se',
    color: 'bg-pink-600 hover:bg-pink-700',
    verifiedKey: 'Jollyroom',
  },
  babyv: {
    storeName: 'Baby V',
    domain: 'babyv.se',
    color: 'bg-emerald-700 hover:bg-emerald-800',
    verifiedKey: 'Baby V',
  },
  babysam: {
    storeName: 'Babysam',
    domain: 'babysam.se',
    color: 'bg-blue-900 hover:bg-blue-950',
    verifiedKey: 'Babysam',
  },
  kopbarnvagn: {
    storeName: 'Köpbarnvagn',
    domain: 'kopbarnvagn.se',
    color: 'bg-violet-600 hover:bg-violet-700',
    verifiedKey: 'Köpbarnvagn',
  },
  babyland: {
    storeName: 'Babyland',
    domain: 'babyland.se',
    color: 'bg-sky-700 hover:bg-sky-800',
    verifiedKey: 'Babyland',
  },
  storochliten: {
    storeName: 'Stor och Liten',
    domain: 'storochliten.se',
    color: 'bg-amber-700 hover:bg-amber-800',
    verifiedKey: 'Stor och Liten',
  },
};

export interface RetailerMeta {
  name: string;
  domain: string;
  trackBase: string;
  color: string;
  /** Decimal-form (0.08 = 8%). Härledd från AFFILIATE_STORES vid modul-load. */
  commission: number;
  searchUrl: (q: string) => string;
}

function buildSearchUrl(store: AffiliateStore): (q: string) => string {
  const template = store.searchUrl;
  if (!template) return () => '';
  return (q: string) => template.replace('{q}', encodeURIComponent(q));
}

/**
 * retailerMeta härleds från AFFILIATE_STORES + VERIFIED_LINKS + RETAILER_DISPLAY.
 * Throw vid modul-load om en retailer saknar AFFILIATE_STORES- eller VERIFIED_LINKS-entry , 
 * då fångas det vid bygge, inte i runtime.
 */
export const retailerMeta: Record<Retailer, RetailerMeta> = (() => {
  const out = {} as Record<Retailer, RetailerMeta>;
  for (const [retailer, display] of Object.entries(RETAILER_DISPLAY) as [Retailer, typeof RETAILER_DISPLAY[Retailer]][]) {
    const store = getStore(display.storeName);
    if (!store) throw new Error(`retailerMeta: ${display.storeName} saknas i AFFILIATE_STORES (affiliate-stores.ts).`);
    const trackBase = VERIFIED_LINKS[display.verifiedKey];
    if (!trackBase) throw new Error(`retailerMeta: ${display.verifiedKey} saknas i VERIFIED_LINKS (verified-links.ts).`);
    out[retailer] = {
      name: store.name,
      domain: display.domain,
      trackBase,
      color: display.color,
      commission: store.commission,
      searchUrl: buildSearchUrl(store),
    };
  }
  return out;
})();

/**
 * Bygg en tracking-URL till en butik. Om en target-URL skickas med används deeplink.
 */
export function track(retailer: Retailer, targetUrl?: string): string {
  const base = retailerMeta[retailer].trackBase;
  if (!targetUrl) return base;
  return `${base}&url=${encodeURIComponent(targetUrl)}`;
}

/**
 * Resolva en deeplink-target från en path. Returnerar null om path saknas.
 * Komponenter ska använda denna istället för searchUrl-fallback , 
 * search-URL:er resulterar ofta i 0 träffar och är därmed brutna djuplänkar.
 */
export function resolveTarget(retailer: Retailer, path?: string): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const meta = retailerMeta[retailer];
  return `https://www.${meta.domain}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Kortfattad helper för Jollyroom, vanligaste butiken.
 *  Om path saknas: returnera tom sträng (komponent ska sedan dölja CTA). */
export const jolly = (path: string = '') => {
  if (!path) return '';
  const url = path.startsWith('http') ? path : `https://www.jollyroom.se${path.startsWith('/') ? '' : '/'}${path}`;
  return track('jollyroom', url);
};

/**
 * Default-lista över butiker i provisionsordning (högst först).
 * Sortering sker dynamiskt vid modul-load via sortByCommission, så att ordningen
 * automatiskt följer AFFILIATE_STORES när commissions ändras.
 */
export const defaultRetailers: Retailer[] = sortByCommissionStatic(
  Object.keys(RETAILER_DISPLAY) as Retailer[]
);

/** Sortera en retailer-lista efter provision (högst först). */
export function sortByCommission(retailers: Retailer[]): Retailer[] {
  return [...retailers].sort((a, b) => retailerMeta[b].commission - retailerMeta[a].commission);
}

/** Intern variant för bootstrap (samma funktion men anrops vid modul-load). */
function sortByCommissionStatic(retailers: Retailer[]): Retailer[] {
  return [...retailers].sort((a, b) => retailerMeta[b].commission - retailerMeta[a].commission);
}
