// Shared schema helpers for Bebisguiden
const SITE_URL = 'https://bebisguiden.se';

export const AUTHOR = {
  '@type': 'Person',
  name: 'Sofia Lindgren',
  url: `${SITE_URL}/om-redaktionen/`,
  image: `${SITE_URL}/images/redaktion-sofia.webp`,
  jobTitle: 'Leg. barnmorska & chefredaktör',
  description: 'Legitimerad barnmorska med 10+ års klinisk erfarenhet. Testar och granskar barnprodukter med fokus på säkerhet, ergonomi och evidensbaserade råd.',
  knowsAbout: ['barnprodukter', 'bilbarnstolar', 'barnvagnar', 'babyvakter', 'barnsäkerhet', 'amning', 'spädbarnsvård', 'i-Size', 'ISOFIX'],
  worksFor: { '@type': 'Organization', name: 'Bebisguiden', url: SITE_URL },
  email: 'elscatalyst@proton.me'
};

export const PUBLISHER = {
  '@type': 'Organization',
  name: 'Bebisguiden',
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` }
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
