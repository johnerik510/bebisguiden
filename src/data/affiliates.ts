// Centraliserade Adtraction-tracking-länkar för bebisguiden.
// Alla utgående klick till dessa butiker ska gå via tracking för att räknas som affiliate-intäkt.
// Deeplink-format: base + "&url=" + encodeURIComponent(target)

export type Retailer = 'jollyroom' | 'babyland' | 'storochliten' | 'babyv' | 'kopbarnvagn';

export const retailerMeta: Record<Retailer, { name: string; domain: string; trackBase: string; color: string; }> = {
  jollyroom: {
    name: 'Jollyroom',
    domain: 'jollyroom.se',
    trackBase: 'https://dot.jollyroom.se/t/t?a=1222362818&as=2065068845&t=2&tk=1',
    color: 'bg-pink-600 hover:bg-pink-700',
  },
  babyland: {
    name: 'Babyland',
    domain: 'babyland.se',
    trackBase: 'https://pin.babyland.se/t/t?a=1066444612&as=2065068845&t=2&tk=1',
    color: 'bg-sky-600 hover:bg-sky-700',
  },
  storochliten: {
    name: 'Stor och Liten',
    domain: 'storochliten.se',
    trackBase: 'https://at.storochliten.se/t/t?a=1060728464&as=2065068845&t=2&tk=1',
    color: 'bg-amber-600 hover:bg-amber-700',
  },
  babyv: {
    name: 'Baby V',
    domain: 'babyv.se',
    trackBase: 'https://go.adt231.net/t/t?a=1327902115&as=2065068845&t=2&tk=1',
    color: 'bg-emerald-600 hover:bg-emerald-700',
  },
  kopbarnvagn: {
    name: 'Köpbarnvagn',
    domain: 'kopbarnvagn.se',
    trackBase: 'https://to.kopbarnvagn.se/t/t?a=2056646903&as=2065068845&t=2&tk=1',
    color: 'bg-violet-600 hover:bg-violet-700',
  },
};

/**
 * Bygg en tracking-URL till en butik. Om en target-URL skickas med används deeplink.
 */
export function track(retailer: Retailer, targetUrl?: string): string {
  const base = retailerMeta[retailer].trackBase;
  if (!targetUrl) return base;
  return `${base}&url=${encodeURIComponent(targetUrl)}`;
}

/** Kortfattad helper för Jollyroom — vanligaste butiken. */
export const jolly = (path: string = '') => {
  if (!path) return track('jollyroom');
  const url = path.startsWith('http') ? path : `https://www.jollyroom.se${path.startsWith('/') ? '' : '/'}${path}`;
  return track('jollyroom', url);
};

/** Default-lista över butiker att visa som multi-retailer CTA, i visningsordning. */
export const defaultRetailers: Retailer[] = ['jollyroom', 'babyland', 'storochliten', 'babyv'];

/** Barnvagnssidor: inkluderar Köpbarnvagn (nischbutik specialiserad på barnvagnar). */
export const barnvagnRetailers: Retailer[] = ['jollyroom', 'kopbarnvagn', 'babyland', 'storochliten', 'babyv'];

/**
 * Förbyggda deeplink-paths per sidtyp → retailer. Används av RetailerCTAs
 * för att skicka besökaren till rätt kategori i varje butik, inte startsidan.
 * Köpbarnvagn har egen URL-struktur (/sv/artiklar/barnvagnar/modell/...).
 */
export const barnvagnPaths = {
  index: {
    jollyroom: '/barnvagnar',
    babyland: '/barnvagn',
    storochliten: '/barnvagnar',
    babyv: '/barnvagnar',
    kopbarnvagn: '/sv/artiklar/barnvagnar/',
  },
  nyfodda: {
    jollyroom: '/barnvagnar/duovagnar',
    babyland: '/barnvagn/duovagn',
    storochliten: '/barnvagnar/duovagnar',
    babyv: '/barnvagnar/duovagn',
    kopbarnvagn: '/sv/artiklar/barnvagnar/modell/barnvagnspaket/',
  },
  duovagn: {
    jollyroom: '/barnvagnar/duovagnar',
    babyland: '/barnvagn/duovagn',
    storochliten: '/barnvagnar/duovagnar',
    babyv: '/barnvagnar/duovagn',
    kopbarnvagn: '/sv/artiklar/barnvagnar/modell/duovagnar/',
  },
  sittvagn: {
    jollyroom: '/barnvagnar/sittvagnar',
    babyland: '/barnvagn/sittvagn',
    storochliten: '/barnvagnar/sittvagnar',
    babyv: '/barnvagnar/sittvagn',
    kopbarnvagn: '/sv/artiklar/barnvagnar/modell/sittvagnar/',
  },
  syskonvagn: {
    jollyroom: '/barnvagnar/syskonvagnar',
    babyland: '/barnvagn/syskonvagn',
    storochliten: '/barnvagnar/syskonvagnar',
    babyv: '/barnvagnar/syskonvagn',
    kopbarnvagn: '/sv/artiklar/barnvagnar/modell/syskonvagnar/',
  },
  joggingvagn: {
    jollyroom: '/barnvagnar/aktivitetsvagnar/joggingvagnar',
    babyland: '/barnvagn/joggingvagn',
    storochliten: '/barnvagnar/joggingvagnar',
    babyv: '/barnvagnar/joggingvagn',
    kopbarnvagn: '/sv/artiklar/barnvagnar/modell/joggingvagnar/',
  },
  terrangvagn: {
    jollyroom: '/barnvagnar/aktivitetsvagnar/joggingvagnar',
    babyland: '/barnvagn/joggingvagn',
    storochliten: '/barnvagnar/joggingvagnar',
    babyv: '/barnvagnar/joggingvagn',
    kopbarnvagn: '/sv/artiklar/barnvagnar/modell/terrangvagnar/',
  },
  hopfallbar: {
    jollyroom: '/barnvagnar/sulkys/sulkys',
    babyland: '/barnvagn/sulky',
    storochliten: '/barnvagnar/sulkys',
    babyv: '/barnvagnar/sulky',
    kopbarnvagn: '/sv/artiklar/barnvagnar/modell/sulkys/',
  },
  kompakt: {
    jollyroom: '/barnvagnar/sulkys/sulkys',
    babyland: '/barnvagn/sulky',
    storochliten: '/barnvagnar/sulkys',
    babyv: '/barnvagnar/sulky',
    kopbarnvagn: '/sv/artiklar/barnvagnar/modell/sulkys/',
  },
  latt: {
    jollyroom: '/barnvagnar/sulkys/sulkys',
    babyland: '/barnvagn/sulky',
    storochliten: '/barnvagnar/sulkys',
    babyv: '/barnvagnar/sulky',
    kopbarnvagn: '/sv/artiklar/barnvagnar/modell/sulkys/',
  },
  liggdel: {
    jollyroom: '/barnvagnar/duovagnar',
    babyland: '/barnvagn/duovagn',
    storochliten: '/barnvagnar/duovagnar',
    babyv: '/barnvagnar/duovagn',
    kopbarnvagn: '/sv/artiklar/barnvagnar/modell/duovagnar/',
  },
  budget: {
    jollyroom: '/barnvagnar',
    babyland: '/barnvagn',
    storochliten: '/barnvagnar',
    babyv: '/barnvagnar',
    kopbarnvagn: '/sv/artiklar/barnvagnar/',
  },
  bugaboo: {
    jollyroom: '/varumarken/bugaboo',
    babyland: '/varumarken/bugaboo',
    storochliten: '/varumarken/bugaboo',
    babyv: '/varumarken/bugaboo',
    kopbarnvagn: '/sv/artiklar/barnvagnar/marke-2/bugaboo/',
  },
  nuna: {
    jollyroom: '/varumarken/nuna',
    babyland: '/varumarken/nuna',
    storochliten: '/varumarken/nuna',
    babyv: '/varumarken/nuna',
    kopbarnvagn: '/sv/artiklar/barnvagnar/marke-2/nuna/',
  },
  stokke: {
    jollyroom: '/varumarken/stokke',
    babyland: '/varumarken/stokke',
    storochliten: '/varumarken/stokke',
    babyv: '/varumarken/stokke',
    kopbarnvagn: '/sv/artiklar/barnvagnar/marke-2/stokke/',
  },
  cybex: {
    jollyroom: '/varumarken/cybex',
    babyland: '/varumarken/cybex',
    storochliten: '/varumarken/cybex',
    babyv: '/varumarken/cybex',
    kopbarnvagn: '/sv/artiklar/barnvagnar/marke-2/cybex_barnvagnar/',
  },
} satisfies Record<string, Partial<Record<Retailer, string>>>;
