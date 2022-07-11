import { Liquid } from 'liquidjs'
import type { FS } from 'liquidjs/dist/fs/fs'
import { extname, resolve } from 'path'
import type { WikiFileSystem } from './files'

function createLiquidFs(wikiFileSystem: WikiFileSystem): FS {
  const normalizePath = (p: string) => p.replace(/^\/+/, '')
  return {
    readFile: async (path) => {
      const file = await wikiFileSystem.getFile(normalizePath(path))
      if (file.found) {
        return Buffer.from(file.content, 'base64').toString()
      } else {
        throw new Error(`File not found: ${path}`)
      }
    },
    readFileSync: () => {
      throw new Error('No sync version')
    },
    exists: async (path) => {
      const file = await wikiFileSystem.getFile(normalizePath(path))
      return file.found
    },
    existsSync: (path) => {
      throw new Error('No sync version')
    },
    resolve: (dir, file, ext) => {
      if (!extname(file)) file += ext
      return resolve(dir, file)
    },
  }
}

export function createLiquidEngine(wikiFileSystem: WikiFileSystem) {
  const engine = new Liquid({
    fs: createLiquidFs(wikiFileSystem),
    root: '/wiki',
    partials: '/wiki/Template',
    jekyllInclude: true,
    extname: '.md.liquid',
    relativeReference: false,
  })
  return engine
}
