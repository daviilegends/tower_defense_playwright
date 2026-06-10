import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  // Dev local: assets desde raíz. Build para GitHub Pages: prefijo del repo.
  base: command === 'build' ? '/tower_defense_playwright/' : './',
  server: { port: 5173 },
  build: { outDir: 'dist' }
}))
