import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/,
// so the asset base path must match the repository name. The deploy workflow
// passes it in via BASE_PATH; local dev falls back to "/".
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4417,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4418,
  },
})
