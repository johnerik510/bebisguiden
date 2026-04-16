// Centraliserade Adtraction-tracking-länkar för bebisguiden.
// Alla utgående klick till dessa butiker ska gå via tracking för att räknas som affiliate-intäkt.
// Deeplink-format: base + "&url=" + encodeURIComponent(target)

export type Retailer = 'jollyroom' | 'kopbarnvagn' | 'babyland' | 'storochliten' | 'babyv';

export const retailerMeta: Record<Retailer, { name: string; domain: string; trackBase: string; color: string; }> = {
  jollyroom: {
    name: 'Jollyroom',
    domain: 'jollyroom.se',
    trackBase: 'https://dot.jollyroom.se/t/t?a=1222362818&as=2065068845&t=2&tk=1',
    color: 'bg-pink-600 hover:bg-pink-700',
  },
  kopbarnvagn: {
    name: 'Köpbarnvagn',
    domain: 'kopbarnvagn.se',
    trackBase: 'https://to.kopbarnvagn.se/t/t?a=2056646903&as=2065068845&t=2&tk=1',
    color: 'bg-violet-600 hover:bg-violet-700',
  },
  babyland: {
    name: 'Babyland',
    domain: 'babyland.se',
    trackBase: 'https://pin.babyland.se/t/t?a=1066444612&as=2065068845&t=2&tk=1',
    color: 'bg-sky-700 hover:bg-sky-800',
  },
  storochliten: {
    name: 'Stor och Liten',
    domain: 'storochliten.se',
    trackBase: 'https://at.storochliten.se/t/t?a=1060728464&as=2065068845&t=2&tk=1',
    color: 'bg-amber-700 hover:bg-amber-800',
  },
  babyv: {
    name: 'Baby V',
    domain: 'babyv.se',
    trackBase: 'https://go.adt231.net/t/t?a=1327902115&as=2065068845&t=2&tk=1',
    color: 'bg-emerald-700 hover:bg-emerald-800',
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
