/**
 * Plockar ut priserna ur produktfeedsen och skriver dem till
 * src/data/prices.generated.json. Körs automatiskt av npm run build.
 *
 * Källa: src/data/feed-matches/*.json, samma filer som CTA-länkarna använder.
 * De hålls färska av veckojobbet (scripts/refresh-all-feeds.mjs i Documents).
 *
 * Priset kopplas till produkten via cupa_sku ur vår egen affiliate-URL mot
 * feedens g:id, med produkt-URL som andrahandsnyckel. Titelmatchning är
 * förbjuden: en feedtitel som liknar produktens är inte samma produkt, och i
 * babynischen skiljer storlek och förpackning priset tiofalt.
 *
 * Produkter utan träff i feeden får inget pris. Sidan visar då ingen siffra.
 *
 * Fyra skydd mot fel pris, alla fail-closed (hellre ingen siffra än fel siffra):
 *   1. Sku-nyckeln är butiksscopad (host||sku). Butikernas löpnummer krockar:
 *      52 sku förekommer i flera av bebisguidens feeds, 36 av dem med olika
 *      pris, värst 20 297 kr mot 279 kr. En platt nyckel lät sist lästa feed
 *      vinna, vilket gav fel pris i produktion på ladcykelguiden.
 *   2. En nyckel som flera feedrader gör anspråk på med olika pris blir ett
 *      från-pris, aldrig ett exakt pris.
 *   3. Priser som rört sig mer än VOLATIL_GRANS sedan förra feedhämtningen
 *      undertrycks helt. Uppmätt drift på bebisguiden är 11 procent av
 *      produkterna per sex dygn, och de största hoppen är feedfel snarare än rea.
 *   4. Faller antalet upplösta priser mer än RAS_GRANS mot förra bygget bryts
 *      bygget. En feed som byter format ska larma, inte tystna.
 *
 * Att slå på priser på ytterligare en site kräver den här filen, src/lib/price.ts,
 * PriceTag.astro, PriceNote.astro, regeln i global.css och prebuild-raden i
 * package.json. Sedan renderas PriceTag där produkten visas.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/data/prices.generated.json');
const FEED_DIR = join(ROOT, 'src/data/feed-matches');
const META = join(FEED_DIR, '_meta.json');

const VOLATIL_GRANS = 0.15;
const RAS_GRANS = 0.10;

const unpct = (s) => {
  let p = s;
  for (let i = 0; i < 3; i++) { try { const d = decodeURIComponent(p); if (d === p) break; p = d; } catch { break; } }
  return p;
};
// Två nycklar per produkt-URL. Den exakta behåller query-strängen, eftersom
// butiker lägger varianten där. Den luddiga strippar query och används bara när
// den är entydig: pekar två varianter på samma bas-URL vore ett uppslag där en
// gissning, och gissningar ger fel pris.
const urlKeyExact = (u) => (u || '').replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
const urlKeyLoose = (u) => (u || '').split('?')[0].replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
// Butiken som produkten ligger hos, härledd ur produkt-URL:en. Protokoll och
// www varierar mellan feedens productUrl och vår trackedUrl, så båda normaliseras bort.
const hostOf = (u) =>
  (u || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0].toLowerCase();
const skuKey = (host, sku) => `${host}||${sku}`;

const toSek = (raw) => {
  const m = String(raw || '').replace(/\s/g, '').match(/([\d.,]+)/);
  if (!m) return null;
  const n = Math.round(parseFloat(m[1].replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/* När hämtades feedsen? Skrivs av refresh-all-feeds.mjs vid hämtningen.
 * Filens mtime duger inte: på Cloudflare är den checkout-tiden, och
 * `git log -- <fil>` är tomt vid grund klon. Saknas stämpeln utelämnas datumet
 * ur prisnoten hellre än att ett påhittat datum skrivs ut. */
let hamtad = null;
if (existsSync(META)) {
  try { hamtad = JSON.parse(readFileSync(META, 'utf8')).hamtad || null; } catch { hamtad = null; }
}

/* Vilka produkter refererar siten? Skördas ur alla affiliate-URL:er i src/.
 * Sku och butik måste hållas ihop, så varje affiliate-URL parsas som en enhet
 * i stället för att sku och url= skördas var för sig i skilda regex. */
const skuHost = new Set();
const skuBasHost = new Set();
const urls = new Set(), urlBaser = new Set();

const AFF_URL = /https?:\/\/[^\s'"`<>\\]*[?&]cupa_sku=[^\s'"`<>\\]*/gi;

(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'feed-matches') walk(p); continue; }
    if (!/\.(ts|astro|mjs|js|json|md|mdx)$/.test(e.name)) continue;
    const txt = readFileSync(p, 'utf8');

    for (const raw of txt.match(AFF_URL) || []) {
      const sm = raw.match(/[?&]cupa_sku=([^&'"\s\\]+)/i);
      const um = raw.match(/[?&](?:url|u)=([^&'"\s\\]+)/i);
      if (!sm || !um) continue;
      const sku = unpct(sm[1].replace(/\+/g, ' ')).trim();
      const host = hostOf(unpct(um[1]));
      if (!sku || !host) continue;
      skuHost.add(skuKey(host, sku));
      const bas = sku.split('_')[0];
      if (bas && bas !== sku) skuBasHost.add(skuKey(host, bas));
    }

    for (const m of txt.matchAll(/[?&](?:url|u)=([^&'"\s\\]+)/gi)) {
      const u = unpct(m[1]);
      const ex = urlKeyExact(u); if (ex) urls.add(ex);
      const lo = urlKeyLoose(u);
      if (!lo) continue;
      if (u.includes('?')) urlBaser.add(lo); else { urls.add(lo); urlBaser.add(lo); }
    }
  }
})(join(ROOT, 'src'));

/* Läs feedsen. Kandidaterna samlas i Set: en nyckel som flera feedrader gör
 * anspråk på med olika pris får aldrig bli ett exakt pris, bara ett från-pris. */
const skuKand = new Map();
const urlKand = new Map();
const looseKand = new Map();
const skuBasKand = new Map();

const lagg = (map, key, val) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(val);
};

if (existsSync(FEED_DIR)) {
  const feedFiler = readdirSync(FEED_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  for (const f of feedFiler) {
    for (const v of Object.values(JSON.parse(readFileSync(join(FEED_DIR, f), 'utf8')))) {
      // g:price är butikens ordinarie pris, g:sale_price det som faktiskt tas
      // ut. Läser man bara g:price visar sidan ett för högt pris på varje
      // kampanjvara, och det är precis de produkter en läsare reagerar på.
      const sek = toSek(v.salePrice) ?? toSek(v.price);
      if (!sek) continue;

      const sku = (v.sku || '').trim();
      const host = hostOf(v.productUrl);

      if (sku && host) {
        const nyckel = skuKey(host, sku);
        if (skuHost.has(nyckel)) lagg(skuKand, nyckel, sek);
        // Butiken byter ibland variantsuffix så att vår sparade sku inte längre
        // finns. Basdelen överlever och används för ett från-pris i stället för
        // ingen siffra alls.
        const bas = sku.split('_')[0];
        if (bas && skuBasHost.has(skuKey(host, bas))) lagg(skuBasKand, skuKey(host, bas), sek);
      }

      const ex = urlKeyExact(v.productUrl);
      if (ex && urls.has(ex)) lagg(urlKand, ex, sek);

      const lo = urlKeyLoose(v.productUrl);
      if (lo && urlBaser.has(lo)) lagg(looseKand, lo, sek);
    }
  }
}

/*
 * Från kandidater till priser. En nyckel med exakt en kandidat ger ett exakt
 * pris. Flera kandidater betyder att vi inte vet vilken som gäller vår länk,
 * och då blir billigaste ett från-pris. "Från 349 kr" är sant och användbart;
 * 399 kr när billigaste storleken kostar 349 vore det inte.
 */
const bySku = {}, byUrl = {}, bySkuFrom = {}, byUrlFrom = {};

const losUpp = (kand, exakt, fran) => {
  for (const [k, priser] of kand) {
    if (priser.size === 1) exakt[k] = [...priser][0];
    else fran[k] = Math.min(...priser);
  }
};

losUpp(skuKand, bySku, bySkuFrom);
losUpp(urlKand, byUrl, byUrlFrom);

for (const [k, priser] of looseKand) {
  if (byUrl[k] !== undefined || byUrlFrom[k] !== undefined) continue;
  if (priser.size === 1) byUrl[k] = [...priser][0];
  else byUrlFrom[k] = Math.min(...priser);
}
for (const [k, priser] of skuBasKand) {
  if (bySkuFrom[k] === undefined) bySkuFrom[k] = Math.min(...priser);
}

/*
 * Volatilitetsfilter. Föregående feedhämtnings priser ligger kvar i filen som
 * `foreg` och roteras bara när feedstämpeln byts, så att en ombyggnad utan ny
 * feeddata inte tappar jämförelsen och släpper igenom priset igen.
 */
let tidigare = null;
if (existsSync(OUT)) {
  try { tidigare = JSON.parse(readFileSync(OUT, 'utf8')); } catch { tidigare = null; }
}
const foreg = tidigare
  ? (tidigare.hamtad === hamtad && tidigare.foreg
      ? tidigare.foreg
      : { hamtad: tidigare.hamtad ?? null, bySku: tidigare.bySku ?? {}, byUrl: tidigare.byUrl ?? {} })
  : { hamtad: null, bySku: {}, byUrl: {} };

let undertryckta = 0;
const filtrera = (nya, gamla) => {
  for (const [k, v] of Object.entries(nya)) {
    const g = gamla[k];
    if (typeof g !== 'number' || g <= 0) continue;
    if (Math.abs(v - g) / g > VOLATIL_GRANS) { delete nya[k]; undertryckta++; }
  }
};
filtrera(bySku, foreg.bySku || {});
filtrera(byUrl, foreg.byUrl || {});

/* Byggtidsvakt: en feed som byter format tystnar annars helt ljudlöst. */
const antal = Object.keys(bySku).length + Object.keys(byUrl).length;
const tidigareAntal = tidigare
  ? Object.keys(tidigare.bySku || {}).length + Object.keys(tidigare.byUrl || {}).length
  : 0;
if (tidigareAntal > 0 && antal < tidigareAntal * (1 - RAS_GRANS)) {
  console.error(
    `[priser] AVBRYTER BYGGET: ${antal} priser mot ${tidigareAntal} vid förra bygget ` +
    `(${Math.round((1 - antal / tidigareAntal) * 100)} procent bortfall, gräns ${RAS_GRANS * 100}).\n` +
    `          En produktfeed har sannolikt bytt format eller inte hämtats.\n` +
    `          Kontrollera src/data/feed-matches/ och kör om refresh innan deploy.`
  );
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({
  hamtad,
  bySku, byUrl, bySkuFrom, byUrlFrom,
  foreg: { hamtad: foreg.hamtad ?? null, bySku: foreg.bySku ?? {}, byUrl: foreg.byUrl ?? {} },
}) + '\n');

console.log(
  `[priser] ${antal} exakta priser, ` +
  `${Object.keys(bySkuFrom).length + Object.keys(byUrlFrom).length} från-priser, ` +
  `${undertryckta} undertryckta som volatila` +
  (hamtad ? `, feed hämtad ${hamtad.slice(0, 10)}` : ', ingen feedstämpel')
);
