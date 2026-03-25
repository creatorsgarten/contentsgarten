import { defineConfig } from 'vite-plus'

export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
  },
  lint: {
    ignorePatterns: [
      '**/.netlify/**',
      '**/.next/**',
      '**/build/**',
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      'contentsgarten.netlify.app/**',
      'wiki.creatorsgarten.org/**',
      'wiki.wonderful.software/**',
    ],
  },
  run: {
    cache: {
      scripts: true,
      tasks: true,
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts?(x)'],
  },
})
