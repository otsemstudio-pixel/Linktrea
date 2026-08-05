import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // Chemins relatifs dans le build : le même dist/ fonctionne servi à la
  // racine (Vercel) ou dans un sous-dossier (GitHub Pages /Linktrea/),
  // sans configuration conditionnelle par plateforme.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
