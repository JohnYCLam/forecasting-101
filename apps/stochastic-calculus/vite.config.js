import { defineConfig } from 'vite';
import { sharedTheme } from '../../scripts/vite-theme.mjs';
export default defineConfig({ base: './', plugins: [sharedTheme()] });
