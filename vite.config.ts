import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @ts-ignore
// If tailwind-scrollbar is needed, it would be added in your css or config depending on the tailwind v4 setup. 
// For v4, you often just use custom CSS in your index.css instead of a plugin.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
