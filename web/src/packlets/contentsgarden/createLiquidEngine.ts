import type { ContentsgartenContext } from './ContentsgartenContext'
import type { FS } from 'liquidjs/dist/fs/fs'
import { Liquid } from 'liquidjs'
import { extname, resolve } from 'path'

export function createLiquidEngine(ctx: ContentsgartenContext) {
  const engine = new Liquid({
    fs: createLiquidFs(ctx),
    root: '/wiki',
    partials: '/wiki/Template',
    jekyllInclude: true,
    extname: '.md.liquid',
    relativeReference: false,
  })
  return engine
}

function createLiquidFs(ctx: ContentsgartenContext): FS {
  const normalizePath = (p: string) => p.replace(/^\/+/, '')
  const storage = ctx.config.storage
  return {
    readFile: async (path) => {
      const file = await storage.getFile(ctx, normalizePath(path))
      if (file) {
        return file.content.toString()
      } else {
        throw new Error(`File not found: ${path}`)
      }
    },
    readFileSync: () => {
      throw new Error('No sync version')
    },
    exists: async (path) => {
      const file = await storage.getFile(ctx, normalizePath(path))
      return !!file
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
