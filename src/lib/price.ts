/**
 * Priser på sidan kommer härifrån och ingen annanstans. Beloppen ligger i
 * prices.generated.json, som byggs ur butikernas produktfeeds vid varje bygge
 * (scripts/fetch-prices.mjs). Inget kronbelopp får hårdkodas i en datafil,
 * komponent eller brödtext.
 *
 * Saknas produkten i feeden returneras null och sidan visar ingen siffra.
 */
import prices from '../data/prices.generated.json';

const table = prices as {
  hamtad: string | null;
  bySku: Record<string, number>;
  byUrl: Record<string, number>;
  bySkuFrom: Record<string, number>;
  byUrlFrom: Record<string, number>;
  sidorMedPris: Record<string, true>;
};

/**
 * Ett upplöst pris. `fran` betyder att butiken säljer produkten i flera
 * varianter (storlek, färg, förpackning) med olika pris och att vår länk inte
 * pekar på en variant som finns i feeden just nu. Då visas den billigaste
 * varianten med "Från".
 */
export interface Pris {
  sek: number;
  fran: boolean;
}

const unpct = (s: string): string => {
  let p = s;
  for (let i = 0; i < 3; i++) {
    try { const d = decodeURIComponent(p); if (d === p) break; p = d; } catch { break; }
  }
  return p;
};

// Exakt nyckel först: butiker lägger produktvarianten i query-strängen
// och två storlekar av samma produkt kan skilja tiofalt i babynischen. Den
// query-lösa nyckeln finns bara i tabellen när varianterna bakom den kostar
// lika mycket.
const urlKeyExact = (u: string): string =>
  (u || '').replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
const urlKeyLoose = (u: string): string =>
  (u || '').split('?')[0].replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();

// Sku-nyckeln bär butiken, härledd ur länkens url=-parameter. Butikernas
// löpnummer krockar: 52 sku förekommer i flera av sitens feeds, 36 av dem med
// olika pris. sku 914193 är en Cybex ePriam hos Jollyroom för 20 297 kr och en
// leksak hos Leksaksaffären för 279 kr. Utan butiken i nyckeln avgör
// läsordningen vilket pris vagnen får.
const hostOf = (u: string): string =>
  (u || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0].toLowerCase();
const skuKey = (host: string, sku: string): string => `${host}||${sku}`;

export const formatSek = (n: number): string => `${n.toLocaleString('sv-SE')} kr`;

/**
 * Butikens pris för produkten bakom en affiliate-URL, eller null om produkten
 * inte finns i feeden alls.
 *
 * Uppslaget går i fallande säkerhet: exakt sku hos rätt butik, exakt
 * produkt-URL, bas-URL (bara när länken saknar variantparameter), och sist ett
 * från-pris byggt på billigaste varianten av samma produkt. Ett exakt pris
 * vinner alltid.
 */
export function getPrice(affiliateUrl?: string): Pris | null {
  if (!affiliateUrl) return null;

  const sm = affiliateUrl.match(/[?&]cupa_sku=([^&]+)/i);
  const sku = sm ? unpct(sm[1].replace(/\+/g, ' ')).trim() : '';

  const um = affiliateUrl.match(/[?&](?:url|u)=([^&]+)/i);
  const u = um ? unpct(um[1]) : '';
  const host = hostOf(u);

  // Sku utan butik är inget uppslag: samma nummer betyder olika produkt hos
  // olika butiker, och en träff på fel butik ger ett helt felaktigt pris.
  if (sku && host) {
    const exakt = table.bySku[skuKey(host, sku)];
    if (exakt) return { sek: exakt, fran: false };
  }

  if (u) {
    const exakt = table.byUrl[urlKeyExact(u)];
    if (exakt) return { sek: exakt, fran: false };
    // Pekar länken på en specifik variant (?att=...) duger ingen bas-träff som
    // exakt pris: storlekar av samma produkt skiljer ofta hundratals kronor.
    if (!u.includes('?')) {
      const bas = table.byUrl[urlKeyLoose(u)];
      if (bas) return { sek: bas, fran: false };
    }
  }

  if (sku && host) {
    const franSku = table.bySkuFrom[skuKey(host, sku)] ?? table.bySkuFrom[skuKey(host, sku.split('_')[0])];
    if (franSku) return { sek: franSku, fran: true };
  }
  if (u) {
    const franUrl = table.byUrlFrom[urlKeyExact(u)] ?? table.byUrlFrom[urlKeyLoose(u)];
    if (franUrl) return { sek: franUrl, fran: true };
  }

  return null;
}

/** Formaterat pris redo att skrivas ut, t.ex. "36 999 kr" eller "Från 26 999 kr". */
export function prisText(p: Pris): string {
  return p.fran ? `Från ${formatSek(p.sek)}` : formatSek(p.sek);
}

/**
 * Visar den här sidan minst ett pris?
 *
 * Avgör CTA-knappens verb, och beslutet hör hemma på sidan i stället för på
 * produkten. Härleds det per produkt får en sida där tre av fyra har pris tre
 * knappar med "Handla hos" och en med "Bra pris hos", vilket läses som ett fel.
 *
 * "Handla hos" är alltid sant: det är en uppmaning, inte ett omdöme. "Bra pris
 * hos" är ett värdeomdöme och får inte stå på en sida där beloppet syns
 * (CLAUDE.md, CTA-standarder). Därför vinner "Handla" så fort sidan visar
 * något pris alls.
 *
 * Kartan byggs av scripts/fetch-prices.mjs ur samma uppslag som priserna, så
 * den kan inte glida isär från det sidan faktiskt renderar.
 */
export function sidanVisarPris(pathname?: string): boolean {
  if (!pathname) return false;
  const rutt = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return table.sidorMedPris?.[rutt] === true;
}

/** Verbet i CTA-knappen för en sida: "Handla" när sidan visar pris, annars "Bra pris". */
export function ctaVerb(pathname?: string): string {
  return sidanVisarPris(pathname) ? 'Handla' : 'Bra pris';
}

/**
 * Har varje produkt i listan ett pris?
 *
 * Används av jämförelsetabellen, som är den enda ytan där en lucka faktiskt
 * syns: raderna står under varandra i ett rutnät och en tom prisruta läses som
 * att produkten är dyr eller trasig. Saknas priset på en enda rad visar tabellen
 * inga priser alls.
 *
 * Fristående produktkort omfattas inte. De står långt ifrån varandra med
 * brödtext emellan, och ett kort utan prisrad ser ut precis som ett kort gjorde
 * innan prisvisningen fanns. Att släcka en hel sidas priser för ett saknat kort
 * skulle kosta 56 av 463 priser utan att lösa något läsaren märker.
 *
 * Produkter utan köplänk räknas inte: de har medvetet ingen CTA och därmed
 * ingen prisruta att lämna tom.
 */
export function allaHarPris(affiliateUrls: (string | undefined)[]): boolean {
  const medLank = affiliateUrls.filter((u): u is string => typeof u === 'string' && u.length > 0);
  return medLank.length > 0 && medLank.every((u) => getPrice(u) !== null);
}

/** Prisspann för en lista produkter. null om färre än två har pris. */
export function priceRange(affiliateUrls: (string | undefined)[]): { min: number; max: number; label: string } | null {
  const vals = affiliateUrls.map((u) => getPrice(u)?.sek).filter((v): v is number => typeof v === 'number');
  if (vals.length < 2) return null;
  const min = Math.min(...vals), max = Math.max(...vals);
  return { min, max, label: `${min.toLocaleString('sv-SE')} till ${max.toLocaleString('sv-SE')} kr` };
}

/**
 * Kort reservation som ska stå intill priser på sidan.
 *
 * Datumet är hela poängen. Ett odaterat belopp är ett påstående om nuet och
 * blir fel så fort butiken ändrar sig. Ett daterat belopp är en verifierbar
 * uppgift som förblir sann. Stämpeln kommer ur feed-matches/_meta.json och
 * sätts när feeden hämtas, aldrig av byggtidpunkten.
 */
export const PRICE_NOTE = table.hamtad
  ? `Priserna hämtades från butikernas produktfeeds ${table.hamtad.slice(0, 10)}. Butikens pris vid köptillfället gäller.`
  : 'Priserna hämtas från butikernas produktfeeds. Butikens pris vid köptillfället gäller.';
