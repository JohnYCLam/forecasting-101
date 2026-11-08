import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { sharedTheme } from '../../scripts/vite-theme.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sharedTheme()],
  base: '/time-series-forecasting/',
  server: { fs: { allow: ['../..'] } },
})
