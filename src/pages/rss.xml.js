import rss from '@astrojs/rss';

export async function GET(context) {
  const modules = import.meta.glob('./guider/**/*.astro');
  const items = [];

  for (const path of Object.keys(modules)) {
    if (path.endsWith('/index.astro')) continue;

    const slug = path
      .replace('./guider/', '/guider/')
      .replace(/\.astro$/, '/');

    // Build readable title from slug
    const last = slug.replace(/\/$/, '').split('/').pop();
    const title = last
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    items.push({
      title,
      description: `Guide: ${title} — Bebisguiden`,
      link: slug,
      pubDate: new Date('2026-01-01'),
    });
  }

  items.sort((a, b) => a.link.localeCompare(b.link));

  return rss({
    title: 'Bebisguiden — Guider',
    description: 'Oberoende tester och jämförelser av barnprodukter samt guider för nyblivna föräldrar.',
    site: context.site || 'https://bebisguiden.se',
    items,
    customData: '<language>sv-SE</language>',
  });
}
