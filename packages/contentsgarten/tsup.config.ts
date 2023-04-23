import { defineConfig } from 'tsup'

export default defineConfig({
  esbuildOptions(options, context) {
    // Some packages set a "module" field with an implementation
    // that is web-only (i.e. not compatible with Node.js).
    // However, since we're building a Node.js package, we want
    // to prefer the "main" field instead.
    options.mainFields = ['main', 'module']
  },
})
