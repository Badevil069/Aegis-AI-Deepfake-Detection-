import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/analyze-frame': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/analyze-stream': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/stop-stream': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
