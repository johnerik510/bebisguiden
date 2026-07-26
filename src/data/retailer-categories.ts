// Verifierade kategori-URL:er per butik, for RetailerCTAs-griden.
//
// HARD REGEL: ingen URL har konstrueras for hand eller gissats fram.
// Varje path nedan kommer ur en av tva primarkallor och ar HTTP-verifierad
// (200 + landar inte pa butikens startsida) 2026-07-26:
//
//   - jollyroom: harledd ur produktfeedens `productUrl` (src/data/feed-matches/jollyroom.json).
//     Jollyroom ar enda butiken med hierarkiska produkt-URL:er, sa kategoristigen
//     ar bokstavligen foraldrapathen till riktiga produkter i feeden.
//   - babysam / babyland / storochliten / babyv: hamtade ur butikens EGEN
//     kategori-sitemap (sitemap-1-productgroups.xml, sitemap/files/sitemap-categories,
//     sitemap-groups.xml). Flat produkt-URL-struktur gor feed-harledning omojlig dar.
//
// En butik som saknar entry for en kategori utelamnas medvetet ur griden for den
// kategorin. Hellre farre knappar an en gissad URL som ger 404 eller startsidan.
//
// Nar en butik lagger om sin URL-struktur: kor om verifieringen innan du andrar har.

import type { Retailer } from './affiliates';

export type CategoryKey =
  | 'barnvagnar'
  | 'bilbarnstolar'
  | 'babyvakter'
  | 'barselar'
  | 'matstolar'
  | 'spjalsangar'
  | 'blojor'
  | 'amning'
  | 'babyklader'
  | 'sterilisering';

/** Path per butik. Alltid absolut path utan domän, exakt som verifierad. */
export const RETAILER_CATEGORY_PATHS: Record<CategoryKey, Partial<Record<Retailer, string>>> = {
  barnvagnar: {
    jollyroom: '/barnvagnar',
    babysam: '/barnvagnar',
    babyland: '/barnvagnar',
    storochliten: '/barnvagnar-2',
    babyv: '/sv/articles/4/barnvagnar',
  },
  bilbarnstolar: {
    jollyroom: '/bilstolar/bilbarnstolar',
    babysam: '/bilbarnstolar',
    babyland: '/bilbarnstolar',
    storochliten: '/bilbarnstolar-2',
    babyv: '/sv/articles/6/bilbarnstolar',
  },
  babyvakter: {
    jollyroom: '/babyprodukter/barnsakerhet/babyvakter',
    babyland: '/babyvakter',
    babyv: '/sv/articles/96/babyvakter',
  },
  barselar: {
    jollyroom: '/babyprodukter/barselar-barsjalar',
    babyland: '/barselar',
    babyv: '/sv/articles/73/barsele',
  },
  matstolar: {
    jollyroom: '/babyprodukter/barnstolar-tillbehor',
    babyland: '/matstolar',
    storochliten: '/matstolar-1',
    babyv: '/sv/articles/39/matstolar',
  },
  spjalsangar: {
    jollyroom: '/barnrummet/barnsangar-tillbehor',
    babyland: '/barnsangar',
    storochliten: '/resesangar',
    babyv: '/sv/articles/112/resesangar',
  },
  blojor: {
    jollyroom: '/babyprodukter/halsa-hygien/blojor',
    babyland: '/blojor',
    storochliten: '/blojor-och-tvattlappar',
  },
  amning: {
    jollyroom: '/mamma/amningsprodukter',
    babysam: '/graviditet-amning',
    babyland: '/graviditet-och-amning',
  },
  babyklader: {
    jollyroom: '/barnklader',
    babysam: '/barnklaeder-sparkdraekter-bodys',
    babyland: '/barnklader',
    storochliten: '/barnklader-och-skor',
  },
  sterilisering: {
    jollyroom: '/babyprodukter/ata-dricka/nappflaskor-tillbehor/sterilisering-uppvarmning',
  },
};

/** Butiker som har en verifierad path for kategorin, i angiven ordning. */
export function retailersForCategory(category: CategoryKey): Retailer[] {
  return Object.keys(RETAILER_CATEGORY_PATHS[category] ?? {}) as Retailer[];
}

/** Verifierad path for (kategori, butik), eller null om vi inte har nagon. */
export function categoryPath(category: CategoryKey, retailer: Retailer): string | null {
  return RETAILER_CATEGORY_PATHS[category]?.[retailer] ?? null;
}
