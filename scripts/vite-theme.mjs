import fs from 'node:fs';

// Inline the same early theme bootstrap in both Vite apps, including dev mode.
export function sharedTheme() {
  return {
    name: 'learning-hub-theme',
    transformIndexHtml: {
      order: 'pre',
      handler: html => {
        const script=fs.readFileSync(new URL('../site/theme.js', import.meta.url), 'utf8');
        // Keep the encoding declaration first, before the inline bootstrap.
        return html.replace(/<meta\s+charset=[^>]+>/i, meta=>`${meta}\n<script>${script}</script>`);
      },
    },
  };
}
