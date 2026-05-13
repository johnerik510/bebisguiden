/**
 * Verified generic tracker URLs per store/brand.
 *
 * Används som fallback när en specifik produkt INTE finns i feed-matches.ts.
 * Varje URL är hand-kopierad från Adtractions "Create link"-funktion (eller
 * motsvarande hos andra nätverk) och pekar på butikens startsida eller
 * huvudkategori.
 *
 * REGEL: hand-byggda tracker-URL:er får ALDRIG förekomma utanför den här
 * filen och feed-matches.ts. Quality-gate blockerar push om de hittas.
 */

export const VERIFIED_LINKS: Record<string, string> = {
  // Verifierad 2026-05-13 via Adtraction Create link → Xploras brand-startsida.
  // Ersätter felaktig hand-konstruerad URL (a=1954032102 var product-feed-ID, ej Create link-ID).
  'Xplora': 'https://to.xplora.se/t/t?a=1954032101&as=2065068845&t=2&tk=1',
};
