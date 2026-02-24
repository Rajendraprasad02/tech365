import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: { 
    host: "0.0.0.0",
    proxy: {
      // NestJS backend for Auth/RBAC
      '/api': {
        target: 'http://localhost:3300',
        changeOrigin: true,
      },
      '/forms': {
        target: 'http://localhost:8004',
        changeOrigin: true,
      },
    },
  },
})
