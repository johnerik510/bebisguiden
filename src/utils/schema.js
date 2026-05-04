// Shared schema helpers for Bebisguiden
const SITE_URL = 'https://bebisguiden.se';

export const DEFAULT_PUBLISHED = '2026-01-01';
export const DEFAULT_MODIFIED = '2026-04-19';

export const AUTHOR = {
  '@type': 'Person',
  name: 'John Erik Johansson',
  url: `${SITE_URL}/om-redaktionen/`,
  image: `${SITE_URL}/images/john-erik-johansson.webp`,
  jobTitle: 'Grundare & barnproduktexpert',
  email: 'elscatalyst@proton.me'
};

export const PUBLISHER = {
  '@type': 'Organization',
  name: 'Bebisguiden',
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` }
};

export function buildArticleSchema({ title, description, image, datePublished, dateModified, pathname }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? `${SITE_URL}${image}` : undefined,
    datePublished: datePublished || DEFAULT_PUBLISHED,
    dateModified: dateModified || DEFAULT_MODIFIED,
    author: AUTHOR,
    publisher: PUBLISHER,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${pathname}` }
  };
}
