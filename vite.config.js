import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/TriQ/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],
      manifest: {
        name: 'TriQ',
        short_name: 'TriQ',
        description: '3体のAIが討論し、判定を下すアプリ',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/TriQ/',
        icons: [
          {
            src: '/TriQ/logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/TriQ/logo512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }

      }
    },
    chunkSizeWarningLimit: 1000 // 1MBに警告閾値を増やす（必要に応じて調整）
  }
});
