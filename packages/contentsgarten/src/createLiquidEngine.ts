import type { ContentsgartenRequestContext } from './ContentsgartenContext'
import type { FS } from 'liquidjs/dist/src/fs/fs'
import { Liquid } from 'liquidjs'
import { extname, resolve } from 'path'

export interface PageContentLoader {
  getPageContent: (pageRef: string) => Promise<string | null>
}

export function createLiquidEngine(
  ctx: ContentsgartenRequestContext,
  loader: PageContentLoader,
) {
  const root = '/' + ctx.app.pageFilePrefix.replace(/\/$/, '')
  const engine = new Liquid({
    fs: createLiquidFs(ctx, loader),
    root,
    partials: root + '/Template',
    jekyllInclude: true,
    extname: ctx.app.pageFileExtension,
    relativeReference: false,
  })
  return engine
}

function createLiquidFs(
  ctx: ContentsgartenRequestContext,
  loader: PageContentLoader,
): FS {
  const toPageRef = (p: string) => {
    if (p.endsWith(ctx.app.pageFileExtension)) {
      p = p.slice(0, -ctx.app.pageFileExtension.length)
    }
    if (p.startsWith('/')) {
      p = p.slice(1)
    }
    if (p.startsWith(ctx.app.pageFilePrefix)) {
      p = p.slice(ctx.app.pageFilePrefix.length)
    }
    if (p.startsWith('/')) {
      p = p.slice(1)
    }
    return p
  }
  return {
    readFile: async (path) => {
      const pageRef = toPageRef(path)
      const content = await loader.getPageContent(pageRef)
      if (content == null) {
        throw new Error(`File not found: ${path}`)
      }
      return content
    },
    readFileSync: () => {
      throw new Error('No sync version')
    },
    exists: async (path) => {
      const pageRef = toPageRef(path)
      const content = await loader.getPageContent(pageRef)
      return content != null
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
