import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/main.ts'],
  minify: true,
  format: 'esm',
  outDir: 'dist',
  clean: true,
  deps: {
    neverBundle: true,
  },
})
