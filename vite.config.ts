import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/event_organizer/ on GitHub Pages.
  base: '/event_organizer/',
  plugins: [react()],
})
