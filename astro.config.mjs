// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [mdx(), react(), sitemap()],

  vite: {
    ssr: {
      external: ['better-sqlite3', 'uuid']
    },
    build: {
      rollupOptions: {
        external: ['better-sqlite3', 'uuid']
      }
    }
  },
});