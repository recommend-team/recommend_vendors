// `defineConfig` from `vitest/config`, not `vite` — it is the same function with the
// `test` key typed. Importing from `vite` compiles under `vite build` and then fails
// `tsc -b`, which is how a build script ends up broken from the day it is written.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt', not 'autoUpdate': applying an update reloads the page, and reloading a
      // vendor mid-service to swap a service worker is a bad trade. An update is offered
      // instead, and an ignored one still lands on the next cold start.
      registerType: 'prompt',
      // No service worker in dev. PWA behaviour is exercised against a build.
      devOptions: { enabled: true },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Recommend for Vendors',
        // Home screens truncate hard — this is what actually appears under the icon.
        short_name: 'Recommend',
        description:
          'Run your business on Recommend — orders, products and payouts.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#006837',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            // Android crops non-maskable icons into a circle and clips the artwork.
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Orders change by the minute and money must never be read from a cache — only
        // the shell is precached.
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  server: {
    // 5174 so it can run alongside the customer app on 5173.
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 4174,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
