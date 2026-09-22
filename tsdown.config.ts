import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    main: 'src/main.ts',
    'schema/main': 'src/main.schema.ts',
  },
  minify: true,
  format: 'esm',
  outDir: 'dist',
  clean: true,
  deps: {
    neverBundle: true,
  },
})
