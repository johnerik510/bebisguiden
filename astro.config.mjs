import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bebisguiden.se',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
  integrations: [sitemap({
    serialize(item) {
      return { ...item, lastmod: new Date().toISOString() };
    },
  })],
});
