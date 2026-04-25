import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/analyze-frame': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/start-detection': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/stop-detection': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/ws/live': {
        target: 'ws://127.0.0.1:8001',
        ws: true,
        changeOrigin: true,
      },
      '/ws/live-call': {
        target: 'ws://127.0.0.1:8001',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
