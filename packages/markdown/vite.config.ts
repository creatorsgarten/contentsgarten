import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    dts: true,
    entry: ['src/index.tsx'],
    format: ['esm'],
  },
  test: {
    include: ['src/**/*.test.tsx'],
  },
})
