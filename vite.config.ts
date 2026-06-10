import { defineConfig } from 'vite'

export default defineConfig({
  base: '/tower_defense_playwright/',
  server: { port: 5173 },
  build: { outDir: 'dist' }
})
