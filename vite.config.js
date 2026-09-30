import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// PWA icon design copied from System 1 (public/icons/) — same install/update
// behavior across all five systems. See PWA.md for the full rationale.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // GenerateSW (the default strategy) builds the service worker from
      // this config — no hand-written service worker file to maintain.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'لوحة تحكم المحلات',
        short_name: 'لوحة التحكم',
        description: 'لوحة تحكم مركزية للقراءة فقط لمتابعة مبيعات ومخزون وتقارير جميع المحلات',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        // Matches the login page's full-screen ink background (bg-primary,
        // see LoginPage.jsx) so standalone launch has no flash of a
        // different color before the app shell mounts.
        // Splash screen = the app's page background (slate-50); status bar =
        // the dark header colour (slate-900). The old warm beige/brown values
        // came from a template and matched nothing in this palette.
        background_color: '#f8fafc',
        // Matches the authenticated app shell's warm paper background —
        // where most real usage time is spent (see index.css).
        theme_color: '#0f172a',
        icons: [
          { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the built app shell for instant repeat loads — pure
        // performance, not offline-first: the app still needs the network
        // for every real screen of shop data.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Demo-mode data is never needed in production — don't make every
        // installed dashboard download it in the background.
        globIgnores: ['**/mockData-*.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Every request to the System 5 backend is NEVER cached —
            // always hit the network fresh. Non-negotiable: this is a
            // reporting dashboard over live shop data, nothing from the
            // backend is ever served stale or from cache.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // No service worker during local development — avoids caching/HMR
        // surprises while actively developing.
        enabled: false,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Long-lived, rarely-changing libraries get their own chunks: they
        // stay cached in the browser (and the service worker) across app
        // deploys, so an update only re-downloads the app's own code.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|internmap|decimal\.js-light|recharts-scale|react-smooth|eventemitter3|lodash|fast-equals)[\\/]/.test(id)) {
            return 'charts';
          }
          // The .xlsx zip writer is only needed when the owner clicks
          // "تصدير": leave it with the lazily-loaded exporters chunk.
          if (/[\\/]node_modules[\\/]fflate[\\/]/.test(id)) return undefined;
          // Every other library (React, router, helmet, icons, and small
          // shared helpers like prop-types / react-is) goes into ONE vendor
          // chunk. Assigning them explicitly matters: otherwise Rollup folds
          // helpers that recharts also uses into the charts chunk, and the
          // login page would end up downloading the whole chart library.
          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // هنا @ بتمثل src
    },
  },
})
