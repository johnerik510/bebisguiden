/**
 * Resolve a verified tracker URL for (store, product) or null.
 *
 * AUTO-GENERATED av scripts/regen-cta-resolver.mjs.
 * Datakällor: /tmp/adtraction-channel-exports/bebisguiden.csv
 *              /tmp/lookups/bebis_addrevenue.json
 *
 * Slå-upp-kedja:
 *   1. Exakt/fuzzy match i feed-matches.ts → returnerar feedens trackedUrl
 *   2. Generisk fallback från verified-links.ts (store-startsida)
 *   3. undefined → ingen CTA renderas
 *
 * Hand-byggda URL:er förekommer ALDRIG som output.
 */

import { FEED_MATCHES, type FeedMatch } from '../data/feed-matches';
import { VERIFIED_LINKS } from '../data/verified-links';

/**
 * Store-name → regex som matchar feed-entries vars trackedUrl tillhör butiken.
 * Advertiser-id-rangen tillåter +0..+5 från config-värdet eftersom feeden
 * ibland har annan tracking-id-version än Adtraction-config (vi har sett
 * +1, +2, +3 i naturen).
 */
const STORE_PATTERNS: Record<string, RegExp> = {
  'Xplora': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1954032100|1954032101|1954032102|1954032103|1954032104|1954032105)\b/,
  'Toyspace': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1984734027|1984734028|1984734029|1984734030|1984734031|1984734032)\b/,
  'Bookbeat': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1529694433|1529694434|1529694435|1529694436|1529694437|1529694438)\b/,
  'Babysam': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1945556820|1945556821|1945556822|1945556823|1945556824|1945556825)\b/,
  'Baby V': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1327902112|1327902113|1327902114|1327902115|1327902116|1327902117)\b/,
  'Polarn O. Pyret': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1126522826|1126522827|1126522828|1126522829|1126522830|1126522831)\b/,
  'Partykungen.se': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1954022340|1954022341|1954022342|1954022343|1954022344|1954022345)\b/,
  'Jollyroom': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1222362815|1222362816|1222362817|1222362818|1222362819|1222362820)\b/,
  'Leksaksaffären.com': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1954033083|1954033084|1954033085|1954033086|1954033087|1954033088)\b/,
  'Babyland': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1066444609|1066444610|1066444611|1066444612|1066444613|1066444614)\b/,
  'Stor&Liten': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1060728461|1060728462|1060728463|1060728464|1060728465|1060728466)\b/,
  'Köpbarnvagn': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(2056646900|2056646901|2056646902|2056646903|2056646904|2056646905)\b/,
  'Emmaljunga': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(2011244536|2011244537|2011244538|2011244539|2011244540|2011244541)\b/,
  'Lappeliten': /(?:track\.adtraction\.com|go\.adt\d+\.\w+|[a-z0-9-]+\.[a-z0-9-]+\.[a-z]+)\/t\/t\?[^"]*a=(1870931645|1870931646|1870931647|1870931648|1870931649|1870931650)\b/,
  'Wooden Story': /addrevenue\.io\/t\?[^"]*a=987780\b/,
  'Lugna Föräldrar': /addrevenue\.io\/t\?[^"]*a=987631\b/,
  'Ingenuity': /addrevenue\.io\/t\?[^"]*a=987628\b/,
  'Ergobaby': /addrevenue\.io\/t\?[^"]*a=987575\b/,
  'osma': /addrevenue\.io\/t\?[^"]*a=987547\b/,
  'Rollerblade': /addrevenue\.io\/t\?[^"]*a=987341\b/,
  'Kunert': /addrevenue\.io\/t\?[^"]*a=987081\b/,
  'Babblarna': /addrevenue\.io\/t\?[^"]*a=987009\b/,
  'KNATTIS': /addrevenue\.io\/t\?[^"]*a=986599\b/,
  'Min Lilla Sotnos': /addrevenue\.io\/t\?[^"]*a=986377\b/,
  'inovi': /addrevenue\.io\/t\?[^"]*a=986153\b/,
  'bumprider': /addrevenue\.io\/t\?[^"]*a=986151\b/,
  'Crescent': /addrevenue\.io\/t\?[^"]*a=986149\b/,
  'Summerville': /addrevenue\.io\/t\?[^"]*a=985585\b/,
  'Lealillebror': /addrevenue\.io\/t\?[^"]*a=985469\b/,
  'nanobébé': /addrevenue\.io\/t\?[^"]*a=985384\b/,
  'Greta Gris': /addrevenue\.io\/t\?[^"]*a=985346\b/,
  'Levenhuk': /addrevenue\.io\/t\?[^"]*a=985276\b/,
  'Kores': /addrevenue\.io\/t\?[^"]*a=985234\b/,
  'Najell': /addrevenue\.io\/t\?[^"]*a=984973\b/,
  'MICKI': /addrevenue\.io\/t\?[^"]*a=984911\b/,
};

const storeEntriesCache = new Map<string, FeedMatch[]>();

function getStoreEntries(storeName: string): FeedMatch[] {
  if (storeEntriesCache.has(storeName)) return storeEntriesCache.get(storeName)!;
  const pat = STORE_PATTERNS[storeName];
  const out: FeedMatch[] = [];
  if (pat) {
    for (const entry of Object.values(FEED_MATCHES)) {
      if (pat.test(entry.trackedUrl)) out.push(entry);
    }
  }
  storeEntriesCache.set(storeName, out);
  return out;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9åäö]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(normalize(a).split(' ').filter((t) => t.length > 2));
  const bTokens = new Set(normalize(b).split(' ').filter((t) => t.length > 2));
  let n = 0;
  for (const t of aTokens) if (bTokens.has(t)) n++;
  return n;
}

/**
 * Resolva tracker-URL för (storeName, productName?).
 * Returnerar undefined om ingen verifierad källa finns.
 */
export function resolveTrackedUrl(storeName: string, productName?: string): string | undefined {
  if (productName) {
    const entries = getStoreEntries(storeName);
    if (entries.length > 0) {
      let best: FeedMatch | undefined;
      let bestScore = 0;
      for (const entry of entries) {
        const score = tokenOverlap(productName, entry.title);
        if (score > bestScore) {
          bestScore = score;
          best = entry;
        }
      }
      if (best && bestScore >= 2) return best.trackedUrl;
    }
  }
  if (VERIFIED_LINKS[storeName]) return VERIFIED_LINKS[storeName];
  return undefined;
}

/**
 * Brand-fallback: returnera en verifierad feed-URL för EN produkt av samma märke
 * hos butiken, även om exakt produkt-match saknas. Används för "Även hos"-CTA
 * där vi vet att butiken säljer märket men inte den exakta SKU:n.
 * Returnerar entry med högst token-overlap mot produktnamnet (om productHint ges),
 * annars första entry med matchande brand.
 */
export function resolveBrandUrl(storeName: string, brand: string, productHint?: string): string | undefined {
  const entries = getStoreEntries(storeName);
  if (entries.length === 0) return undefined;
  const brandLower = brand.toLowerCase();
  const brandEntries = entries.filter((e) => (e.brand || '').toLowerCase().trim() === brandLower);
  if (brandEntries.length === 0) return undefined;
  if (productHint) {
    let best: FeedMatch | undefined;
    let bestScore = -1;
    for (const e of brandEntries) {
      const s = tokenOverlap(productHint, e.title);
      if (s > bestScore) { bestScore = s; best = e; }
    }
    return best?.trackedUrl;
  }
  return brandEntries[0].trackedUrl;
}

/** Kompatibilitets-API. */
export function buildSearchDeeplink(storeName: string, query: string): string | undefined {
  return resolveTrackedUrl(storeName, query);
}

/** Kompatibilitets-API. */
export function buildProductDeeplink(storeName: string, productUrl: string): string | undefined {
  const slug = productUrl.split('/').filter(Boolean).pop() || '';
  const productName = slug.replace(/[-_]/g, ' ');
  return resolveTrackedUrl(storeName, productName);
}
