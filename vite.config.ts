/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// BASE_PATH é definido no workflow do GitHub Pages (ex.: "/nome-do-repositorio/").
// O padrão "./" (caminhos relativos) também funciona em qualquer subcaminho,
// pois a navegação usa HashRouter.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 800 },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
