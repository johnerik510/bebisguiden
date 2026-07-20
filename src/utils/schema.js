// Shared schema helpers for Bebisguiden
const SITE_URL = 'https://bebisguiden.se';

export const AUTHOR = {
  '@type': 'Person',
  name: 'Axel Jönemyr',
  url: `${SITE_URL}/om-redaktionen/`,
  image: `${SITE_URL}/images/axel-jonemyr.webp`,
  jobTitle: 'Redaktör, Bebisguiden',
  description: 'Axel granskar barnvagnar, bilbarnstolar och babyutrustning utifrån verifierbar data, säkerhet och pris, så svenska föräldrar enklare hittar rätt.',
  worksFor: { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'Bebisguiden', url: SITE_URL },
  sameAs: [
    'https://www.instagram.com/axlpxl/',
    'https://www.strava.com/athletes/2699302',
    'https://www.linkedin.com/in/axel-j%C3%B6nemyr-ba1443170/',
    'https://www.facebook.com/axel.jonemyr/',
  ],
  knowsAbout: ['barnprodukter', 'bilbarnstolar', 'barnvagnar', 'babyvakter', 'barnsäkerhet', 'amning', 'spädbarnsvård', 'i-Size', 'ISOFIX'],
};

export const PUBLISHER = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Bebisguiden',
  url: SITE_URL,
  // Raster-logo: Google accepterar inte SVG som publisher-logo i Article-schema.
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png`, width: 600, height: 106 }
};

/**
 * Bygg Article-schema. Använder ENDAST riktiga datum, ingen placeholder-fallback.
 * Om datePublished saknas faller den tillbaka på dateModified (sidan har uppdaterats men vi vet inte när den skapades).
 * Om båda saknas, utelämnas date-fälten helt (bättre än fejk i schema).
 */
export function buildArticleSchema({ title, description, image, datePublished, dateModified, pathname }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: AUTHOR,
    publisher: PUBLISHER,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${pathname}` }
  };
  if (image) schema.image = `${SITE_URL}${image}`;
  const pub = datePublished || dateModified;
  const mod = dateModified || datePublished;
  if (pub) schema.datePublished = pub;
  if (mod) schema.dateModified = mod;
  return schema;
}
