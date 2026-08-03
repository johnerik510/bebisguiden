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
 *   2b. En exakt sku-träff nedgraderas till från-pris när länkens landningssida
 *      säljer flera varianter till olika pris. Vår sku kan peka på XL för
 *      399 kr medan produktsidan öppnar på M för 349 kr, och det är sidans
 *      pris läsaren möter. Uppmätt på Carriwell Vadderad Gravid- och
 *      Amnings-BH, som visade 399 kr mot butikens 349 kr.
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
// Under sa har stor andel prissatta produkter visar sidan inga priser alls. En
// ensam prislapp bland fem produkter ser godtycklig ut, och de sidorna saknar
// pris strukturellt: butiken har ingen feed (kopbarnvagn, najell) eller
// produkten har lamnat den. Gransen ar satt lagt med flit. En trubbig
// 80-procentsgrans hade slackt 23 sidor och 56 av 463 priser; 50 procent
// slacker 4 sidor och 3 priser och tar bort just de godtyckliga fallen.
const SID_TROSKEL = 0.5;
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
const skuVariantLank = new Set(); // host||sku där vår länk pekar på en variant
const urls = new Set(), urlBaser = new Set();
// Vilka affiliate-URL:er ligger pa vilken sida? Anvands for att avgora om en
// sida visar nagot pris alls, se sidorMedPris nedan.
const urlPerSida = new Map();

const AFF_URL = /https?:\/\/[^\s'"`<>\\]*[?&]cupa_sku=[^\s'"`<>\\]*/gi;
// Addrevenue-lankar har ingen cupa_sku utan bara u=, och maste med i sidkartan.
const AFF_URL_U = /https?:\/\/[^\s'"`<>\\]*[?&]u=[^\s'"`<>\\]*/gi;
const SIDOR = join(ROOT, 'src/pages');

(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'feed-matches') walk(p); continue; }
    if (!/\.(ts|astro|mjs|js|json|md|mdx)$/.test(e.name)) continue;
    const txt = readFileSync(p, 'utf8');

    // Sidans rutt, harledd ur filnamnet. Siten har inga dynamiska rutter, sa
    // mappningen ar exakt. trailingSlash: 'always' i astro.config.
    if (p.startsWith(SIDOR)) {
      const rutt = ('/' + p.slice(SIDOR.length + 1)
        .replace(/\.astro$/, '')
        .replace(/(^|\/)index$/, '$1')).replace(/\/{2,}/g, '/').replace(/([^/])$/, '$1/');
      const alla = [...(txt.match(AFF_URL) || []), ...(txt.match(AFF_URL_U) || [])];
      if (alla.length) urlPerSida.set(rutt, [...new Set(alla)]);
    }

    for (const raw of txt.match(AFF_URL) || []) {
      const sm = raw.match(/[?&]cupa_sku=([^&'"\s\\]+)/i);
      const um = raw.match(/[?&](?:url|u)=([^&'"\s\\]+)/i);
      if (!sm || !um) continue;
      const sku = unpct(sm[1].replace(/\+/g, ' ')).trim();
      const host = hostOf(unpct(um[1]));
      if (!sku || !host) continue;
      skuHost.add(skuKey(host, sku));
      // Bar länken en query (?code=, ?variant=, ?att=) landar besökaren på just
      // den varianten och sku-priset är det pris sidan visar. Saknas query
      // öppnar butiken på sitt standardval, oftast den billigaste.
      if (unpct(um[1]).includes('?')) skuVariantLank.add(skuKey(host, sku));
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
// Landningssidan for varje sku siten refererar, och hur manga olika priser
// den sidan har i feeden. Fylls i tva pass eftersom sidan upptacks forst nar
// sku-raden hittas.
const skuLandning = new Map();   // host||sku    -> bas-URL-nyckel
const landningPriser = new Map();// bas-URL-nyckel -> Set av priser

const lagg = (map, key, val) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(val);
};

if (existsSync(FEED_DIR)) {
  const feedFiler = readdirSync(FEED_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  const feedData = feedFiler.map((f) => Object.values(JSON.parse(readFileSync(join(FEED_DIR, f), 'utf8'))));

  // Pass 1: vilken produktsida landar varje sku siten refererar pa?
  for (const rader of feedData) {
    for (const v of rader) {
      const sku = (v.sku || '').trim();
      const host = hostOf(v.productUrl);
      if (!sku || !host) continue;
      const nyckel = skuKey(host, sku);
      if (skuHost.has(nyckel)) skuLandning.set(nyckel, urlKeyLoose(v.productUrl));
    }
  }
  const landningar = new Set(skuLandning.values());

  // Pass 2: priser, plus hur manga olika priser varje landningssida har.
  for (const rader of feedData) {
    for (const v of rader) {
      // g:price är butikens ordinarie pris, g:sale_price det som faktiskt tas
      // ut. Läser man bara g:price visar sidan ett för högt pris på varje
      // kampanjvara, och det är precis de produkter en läsare reagerar på.
      const sek = toSek(v.salePrice) ?? toSek(v.price);
      if (!sek) continue;

      const sku = (v.sku || '').trim();
      const host = hostOf(v.productUrl);

      const landning = urlKeyLoose(v.productUrl);
      if (landningar.has(landning)) lagg(landningPriser, landning, sek);

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

/* Sku-traffen ar exakt, men lasaren moter landningssidans pris. Saljer sidan
 * flera varianter till olika pris blir det ett fran-pris pa billigaste
 * varianten i stallet for vart sku-pris. */
for (const [k, priser] of skuKand) {
  const landning = skuLandning.get(k);
  const sidPriser = landning ? landningPriser.get(landning) : null;
  if (sidPriser && sidPriser.size > 1 && !skuVariantLank.has(k)) {
    bySkuFrom[k] = Math.min(...sidPriser);
    continue;
  }
  if (priser.size === 1) bySku[k] = [...priser][0];
  else bySkuFrom[k] = Math.min(...priser);
}
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

/*
 * Vilka sidor visar minst ett pris?
 *
 * CTA-knappens verb ska vara samma pa hela sidan. Harleds det per produkt far
 * en sida dar tre av fyra produkter har pris tre knappar med "Handla hos" och
 * en med "Bra pris hos", vilket ser ut som ett fel. Beslutet hor darfor hemma
 * pa sidan, inte pa produkten.
 *
 * "Handla hos" ar alltid sant: det ar en uppmaning, inte ett omdome. "Bra pris
 * hos" ar ett vardeomdome och far inte sta pa en sida dar beloppet syns. Alltsa
 * vinner "Handla" sa snart sidan visar pris.
 *
 * Kartan styr bade om PriceTag renderar och vilket verb knappen far, sa de tva
 * kan inte glida isar. En sida under SID_TROSKEL hamnar inte i kartan och blir
 * darmed helt prisfri, med "Bra pris hos" som text.
 */
const harPris = (raw) => {
  const sm = raw.match(/[?&]cupa_sku=([^&'"\s\\]+)/i);
  const um = raw.match(/[?&](?:url|u)=([^&'"\s\\]+)/i);
  const sku = sm ? unpct(sm[1].replace(/\+/g, ' ')).trim() : '';
  const u = um ? unpct(um[1]) : '';
  const h = hostOf(u);
  if (sku && h && (bySku[skuKey(h, sku)] || bySkuFrom[skuKey(h, sku)] || bySkuFrom[skuKey(h, sku.split('_')[0])])) return true;
  if (!u) return false;
  return !!(byUrl[urlKeyExact(u)] || byUrl[urlKeyLoose(u)] || byUrlFrom[urlKeyExact(u)] || byUrlFrom[urlKeyLoose(u)]);
};

const sidorMedPris = {};
let slackta = 0;
for (const [rutt, lankar] of urlPerSida) {
  const med = lankar.filter(harPris).length;
  if (med === 0) continue;
  if (med / lankar.length < SID_TROSKEL) { slackta++; continue; }
  sidorMedPris[rutt] = true;
}

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
  bySku, byUrl, bySkuFrom, byUrlFrom, sidorMedPris,
  foreg: { hamtad: foreg.hamtad ?? null, bySku: foreg.bySku ?? {}, byUrl: foreg.byUrl ?? {} },
}) + '\n');

console.log(
  `[priser] ${antal} exakta priser, ` +
  `${Object.keys(bySkuFrom).length + Object.keys(byUrlFrom).length} från-priser, ` +
  `${undertryckta} undertryckta som volatila, ` +
  `${Object.keys(sidorMedPris).length} sidor visar pris (${slackta} under tröskeln)` +
  (hamtad ? `, feed hämtad ${hamtad.slice(0, 10)}` : ', ingen feedstämpel')
);
