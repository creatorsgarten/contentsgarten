import { defineConfig } from 'astro/config'

// https://astro.build/config
import node from '@astrojs/node'

// https://astro.build/config
import tailwind from '@astrojs/tailwind'

// https://astro.build/config
import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [tailwind(), react()],

  vite: {
    ssr: {
      external: ['contentsgarten', '@contentsgarten/markdown'],
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
