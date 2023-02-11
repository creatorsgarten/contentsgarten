import type { ContentsgartenRequestContext } from './ContentsgartenContext'
import type { FS } from 'liquidjs/dist/fs/fs'
import { Liquid } from 'liquidjs'
import { extname, resolve } from 'path'
import { getFile } from './getFile'

export function createLiquidEngine(ctx: ContentsgartenRequestContext) {
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

function createLiquidFs(ctx: ContentsgartenRequestContext): FS {
  const normalizePath = (p: string) => p.replace(/^\/+/, '')
  return {
    readFile: async (path) => {
      const file = await getFile(ctx, normalizePath(path))
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
      const file = await getFile(ctx, normalizePath(path))
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
