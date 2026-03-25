import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    dts: true,
    entry: ['src/index.ts'],
    format: ['esm'],
  },
})
