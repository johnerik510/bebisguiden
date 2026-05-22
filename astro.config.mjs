import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bebisguiden.se',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always', concurrency: 1 },
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: { hoistTransitiveImports: false },
      },
    },
  },
  integrations: [sitemap()],
});
