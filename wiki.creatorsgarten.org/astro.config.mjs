import { defineConfig } from 'astro/config'

import sentry from '@sentry/astro'
import node from '@astrojs/node'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    tailwind(),
    react(),
    sentry({
      dsn: 'https://2adf8e5d748fd0b91803700de355d8bf@o4506355720323072.ingest.sentry.io/4506405274058752',
      sourceMapsUploadOptions: {
        project: 'contentsgarten',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
  ],

  vite: {
    ssr: {
      external: ['contentsgarten', '@contentsgarten/html'],
    },
    server: {
      watch: {
        ignored: ['!**/node_modules/contentsgarten/**'],
      },
    },
  },
  server: {
    port: 18572,
  },
})
