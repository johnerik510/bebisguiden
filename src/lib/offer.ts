/**
 * Offer-schema för produkter vars pris syns på sidan.
 *
 * Google kräver att strukturerad data speglar det synliga innehållet. Sedan
 * feed-prissystemet rullades ut står butikens pris intill CTA:n, och då ska
 * samma belopp också vara maskinläsbart: annars ser Google, AI Overviews och
 * shopping-ytorna en produktsida utan pris trots att läsaren ser ett.
 *
 * Beloppet kommer från getPrice() bakom samma sidgrind som PriceTag
 * (sidanVisarPris). En sida under täckningströskeln visar inga priser alls, och
 * då får schemat inte heller bära något.
 * Skulle de två någonsin gå isär vore schemat ett påstående sidan inte
 * bekräftar, vilket är precis det Google straffar.
 *
 * Fyra saker utelämnas medvetet:
 *
 * - `availability`. Feeden bär inget lagerstatusfält, och att gissa InStock är
 *   ett faktapåstående vi inte kan belägga.
 * - `shippingDetails` och `hasMerchantReturnPolicy`. De beskriver BUTIKENS
 *   villkor, inte våra. Vi är en jämförelsesida, inte säljaren, och får inte
 *   utfästa fri frakt eller 30 dagars öppet köp för någon annans räkning. Utan
 *   dem blir sidan inte en Merchant Listing utan ett Product snippet med pris,
 *   vilket är den korrekta formen för en aggregatorsida.
 * - Från-priser. Ett "Från 26 999 kr" betyder att vår länk inte pekar på en
 *   variant vi kan prissätta exakt. Ett spann hör hemma i AggregateOffer med
 *   lowPrice/highPrice/offerCount, och offerCount vet vi inte. Alltså inget
 *   schema alls för de produkterna.
 * - Tracker-URL:en. `url` pekar på butikens egen produktsida, hämtad ur
 *   länkens url=-parameter. En crawler som följer en tracker-URL registrerar
 *   ett falskt klick hos affiliatenätverket.
 */
import { getPrice, sidanVisarPris } from './price';
import prices from '../data/prices.generated.json';

const hamtad = (prices as { hamtad: string | null }).hamtad;

/**
 * Hur länge priset i schemat påstås gälla, räknat från feedhämtningen.
 *
 * Google slutar visa priset när datumet passerat. Det är avsikten: sidans pris
 * är lika färskt som senaste push, och en utgången stämpel gör att SERP:en tappar
 * beloppet i stället för att visa ett gammalt. Trettio dagar matchar en rimlig
 * feed- och push-cykel utan att sträcka påståendet längre än vi kan stå för.
 */
const GILTIGHET_DAGAR = 30;

const giltigTill = (): string | null => {
  if (!hamtad) return null;
  const d = new Date(hamtad);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + GILTIGHET_DAGAR);
  return d.toISOString().slice(0, 10);
};

const GILTIG_TILL = giltigTill();

const unpct = (s: string): string => {
  let p = s;
  for (let i = 0; i < 3; i++) {
    try { const d = decodeURIComponent(p); if (d === p) break; p = d; } catch { break; }
  }
  return p;
};

/** Butikens egen produkt-URL ur länkens url=/u=-parameter. Aldrig tracker-URL:en. */
const destination = (affiliateUrl: string): string | null => {
  const m = affiliateUrl.match(/[?&](?:url|u)=([^&]+)/i);
  if (!m) return null;
  const u = unpct(m[1]);
  return /^https?:\/\//i.test(u) ? u : null;
};

export interface OfferFragment {
  offers?: {
    '@type': 'Offer';
    price: number;
    priceCurrency: 'SEK';
    url?: string;
    seller?: { '@type': 'Organization'; name: string };
    priceValidUntil?: string;
  };
}

/**
 * Offer-fragment att sprida in i en Product-nod. Returnerar ett tomt objekt när
 * produkten saknar exakt pris, så att Product:en emitteras oförändrad utan
 * offers i stället för med ett halvt.
 */
export function offerSchema(affiliateUrl?: string, seller?: string, pathname?: string): OfferFragment {
  const pris = sidanVisarPris(pathname) ? getPrice(affiliateUrl) : null;
  if (!pris || pris.fran) return {};

  const url = affiliateUrl ? destination(affiliateUrl) : null;

  return {
    offers: {
      '@type': 'Offer',
      price: pris.sek,
      priceCurrency: 'SEK',
      ...(url ? { url } : {}),
      ...(seller ? { seller: { '@type': 'Organization', name: seller } } : {}),
      ...(GILTIG_TILL ? { priceValidUntil: GILTIG_TILL } : {}),
    },
  };
}
