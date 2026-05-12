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
  // Lägg till brands utan feed-täckning här. Format:
  //   '<store-name>': '<verified-tracker-url-till-startsidan>',
};
