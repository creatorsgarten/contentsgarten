import { defineConfig } from 'astro/config';

// https://astro.build/config
import node from '@astrojs/node';

// https://astro.build/config
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [tailwind()]
});