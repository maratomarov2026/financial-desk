import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Проект публикуется на GitHub Pages как project site:
  // https://maratomarov2026.github.io/financial-desk/
  base: '/financial-desk/',
})
