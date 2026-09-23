import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5142,
    proxy: {
      '/api': {
        target: 'http://localhost:3042',
        changeOrigin: true,
      },
      '/pvp-socket': {
        target: 'http://localhost:3042',
        ws: true,
        changeOrigin: true,
      },
      '/blitz-socket': {
        target: 'http://localhost:3042',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
