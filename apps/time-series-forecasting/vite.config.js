import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/time-series-forecasting/',
  server: { fs: { allow: ['../..'] } },
})
