import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the site from /lostfound/, so built asset paths need that prefix
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/lostfound/' : '/',
}))
