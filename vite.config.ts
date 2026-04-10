import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// For GitHub Pages: set `base` to your repo name, e.g. '/drawing-extractor/'
// Change 'YOUR_REPO_NAME' to match your GitHub repository name.
// If deploying to a custom domain (username.github.io), set base to '/'.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',   // relative paths — works for both root and subdirectory deployments
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
