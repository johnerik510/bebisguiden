/**
 * rel-attribut för utgående länkar.
 *
 * `sponsored` betyder enligt Googles definition att länken är betald: annons,
 * sponsring eller annan form av ersättning. Attributet får därför BARA sättas
 * på länkar som faktiskt går via ett affiliatenätverk och genererar provision.
 *
 * En länk rakt till en leverantörs egen sajt ger oss ingen ersättning. Den ska
 * ha `nofollow` (kommersiell utgående länk) men aldrig `sponsored`, eftersom
 * det vore en felaktig uppgift till Google om ett betalt förhållande som inte
 * finns. Redaktionella källhänvisningar ska varken ha nofollow eller sponsored.
 * Interna länkar ska aldrig ha någotdera.
 */

/** Affiliatenätverk med egen domän. */
const NETWORK_HOSTS = [
  'addrevenue.io',
  'tradedoubler.com',
  'tatrck.com',
  'trakmitra.com',
  'jdoqocy.com',
  'tkqlhce.com',
  'anrdoezrs.net',
  'dpbolvw.net',
  'kqzyfj.com',
  'qksrv.net',
  'emjcd.com',
  'awin1.com',
  'zenaps.com',
  'emitra.se',
  'partner-ads.com',
];

/**
 * Adtractions egna domäner (go.adt284.net, go.adt267.com ...) samt deras
 * white-label-subdomäner hos annonsören (to.elon.se, ion.kjell.com,
 * at.hudoteket.se ...). De senare känns igen på tracker-signaturen
 * `/t/t?a=<id>&as=<id>` som är identisk oavsett vilken domän den ligger på.
 */
function isAdtraction(u: URL): boolean {
  if (/(^|\.)adt\d+\.[a-z]+$/i.test(u.hostname)) return true;
  if (/(^|\.)adtraction\.com$/i.test(u.hostname)) return true;
  return u.pathname.startsWith('/t/t') && u.searchParams.has('a') && u.searchParams.has('as');
}

/** Amazon Associates: spårningen ligger i tag-parametern. */
function isAmazonAssociates(u: URL): boolean {
  return /(^|\.)amazon\.[a-z.]+$/i.test(u.hostname) && u.searchParams.has('tag');
}

/**
 * Returnerar true om URL:en är en verifierad affiliatelänk, det vill säga en
 * länk vi faktiskt får ersättning för. Interna /go/-redirects räknas med:
 * de pekar vidare till partnern på Cloudflare-nivå.
 */
export function isTrackedUrl(url?: string | null): boolean {
  if (!url) return false;
  const raw = String(url).trim();
  if (!raw) return false;

  // Interna affiliate-redirects (public/_redirects → partnerns landningssida).
  if (raw.startsWith('/go/')) return true;

  let u: URL;
  try {
    u = new URL(raw, 'https://placeholder.invalid');
  } catch {
    return false;
  }
  if (u.pathname.startsWith('/go/') && u.hostname === 'placeholder.invalid') return true;

  const host = u.hostname.toLowerCase();
  if (NETWORK_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return true;
  if (isAdtraction(u)) return true;
  if (isAmazonAssociates(u)) return true;
  return false;
}

/**
 * rel-attribut för en CTA-/utgående länk. Lägger till `sponsored` enbart när
 * länken är en verifierad affiliatelänk. Interna länkar får inget rel alls.
 */
export function ctaRel(url?: string | null): string | undefined {
  if (!url) return undefined;
  const raw = String(url).trim();
  if (!raw) return undefined;

  const isInternal = (raw.startsWith('/') || raw.startsWith('#')) && !raw.startsWith('/go/');
  if (isInternal) return undefined;

  return isTrackedUrl(raw)
    ? 'sponsored nofollow noopener noreferrer'
    : 'nofollow noopener noreferrer';
}
