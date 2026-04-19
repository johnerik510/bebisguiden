import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bebisguiden.se',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
  integrations: [
    sitemap({
      serialize(item) {
        item.lastmod = new Date().toISOString();
        const depth = new URL(item.url).pathname.split('/').filter(Boolean).length;
        item.changefreq = depth <= 1 ? 'weekly' : 'monthly';
        item.priority = depth === 0 ? 1.0 : depth === 1 ? 0.8 : 0.6;
        return item;
      },
    }),
  ],
});
