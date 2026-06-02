import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/rongyu/',
  build: { outDir: 'docs' },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: '蓉育向阳',
        short_name: '蓉育向阳',
        description: '成都市青白江区大弯中学支教队记事簿',
        theme_color: '#FFB6C1',
        background_color: '#FFF0F5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/rongyu/',
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌸</text></svg>',
            sizes: '100x100',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
})
