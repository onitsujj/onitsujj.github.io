import { defineConfig } from 'vite'

// The app source lives in src/ so the live (legacy) root index.html stays
// untouched until we flip GitHub Pages to deploy from the Action.
// onitsujj.github.io is served at the domain root, so base is '/'.
export default defineConfig({
  root: 'src',
  base: '/',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
  },
})
