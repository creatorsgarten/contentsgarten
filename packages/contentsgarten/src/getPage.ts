import { ContentsgartenRequestContext } from './ContentsgartenContext'
import { createLiquidEngine } from './createLiquidEngine'
import { z } from 'zod'
import { cache, staleOrRevalidate } from './cache'
import {
  PageData,
  PageAuxiliaryData,
  PageDatabaseSearch,
  PageDatabaseQuery,
} from './ContentsgartenPageDatabase'
import matter from 'gray-matter'
import { GetFileResult } from './ContentsgartenStorage'
import { processMarkdown } from '@contentsgarten/markdown'
import { PageRefRegex } from './PageRefRegex'

export const GetPageResult = z.object({
  status: z.union([
    z.literal(200),
    z.literal(301),
    z.literal(404),
    z.literal(500),
  ]),
  pageRef: z.string(),
  targetPageRef: z.string().optional(),
  title: z.string(),
  file: z
    .object({
      path: z.string(),
      content: z.string(),
      revision: z.string().optional(),
    })
    .optional(),
  content: z.string(),
  rendered: z
    .object({
      html: z.string(),
      headings: z.array(
        z.object({ id: z.string(), label: z.string(), rank: z.number() }),
      ),
    })
    .optional(),
  frontMatter: z.record(z.any()),
  lastModified: z.string().optional(),
  lastModifiedBy: z.array(z.string()).optional(),
})
export type GetPageResult = z.infer<typeof GetPageResult>

export async function getPage(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
  revalidate = false,
  render = false,
) {
  if (pageRef.toLowerCase().startsWith('special/')) {
    return getSpecialPage(ctx, pageRef, revalidate).then((result) =>
      postProcess(ctx, result, render),
    )
  }

  const filePath = PageRefRegex.test(pageRef)
    ? pageRefToFilePath(ctx, pageRef)
    : null

  const pagePromises = new Map<string, Promise<PageData>>()
  const getPage = (pageRef: string, revalidate: boolean) => {
    const existing = pagePromises.get(pageRef)
    if (existing) return existing
    const promise = getPageFile(ctx, pageRef, revalidate)
    pagePromises.set(pageRef, promise)
    return promise
  }
  const pageFile = await getPage(pageRef, revalidate)
  const engine = createLiquidEngine(ctx, {
    getPageContent: async (pageRef) => {
      const page = await getPage(pageRef, false)
      const content = page.data?.contents
      if (!content) return null
      return matter(content).content
    },
  })
  engine.registerFilter('get_page', (pageRef: string) => {
    pageRef = String(pageRef)
    if (!PageRefRegex.test(pageRef)) return
    const promise = getPage(pageRef, false)
    return {
      ref: pageRef,
      exists: promise.then((page) => !!page.data),
      data: promise.then((page) => {
        if (!page.data) return
        return matter(page.data.contents).data
      }),
      toString() {
        return `[Page ${pageRef}]`
      },
    }
  })

  const queryPages = async (query: PageDatabaseQuery) => {
    const results = await cache(
      ctx,
      'query:' + JSON.stringify(query),
      () => ctx.app.pageDatabase.queryPages(query),
      60e3,
    )
    return results.results.map((p) => {
      return {
        ref: p.pageRef,
        exists: true,
        data: p.frontMatter,
        toString() {
          return `[Page ${p.pageRef}]`
        },
      }
    })
  }
  engine.registerFilter('get_subpages', (pageRef: string) => {
    pageRef = String(pageRef)
    if (!PageRefRegex.test(pageRef)) return
    return queryPages({ prefix: pageRef + '/' })
  })
  engine.registerFilter('query_pages', async (q: string) => {
    const query = PageDatabaseSearch.parse(JSON.parse(q))
    return queryPages(query)
  })

  const { content, frontMatter, status, targetPageRef } = await (async () => {
    if (!pageFile.data) {
      const similarlyNamedPages = await ctx.perf.measure('checkTypo', () =>
        ctx.app.pageDatabase.checkTypo(normalizePageRef(pageRef)),
      )
      return {
        content:
          '(This page currently does not exist.)' +
          (similarlyNamedPages.length > 0
            ? '\n\nDid you mean one of these pages?\n\n' +
              similarlyNamedPages.map((page) => `- [[${page}]]`).join('\n')
            : ''),
        frontMatter: {},
        status: 404,
      } as const
    }
    try {
      const pageData = matter(pageFile.data.contents).data
      if (pageData.redirect && PageRefRegex.test(pageData.redirect)) {
        const target = await getPage(pageData.redirect, false)
        if (target.data) {
          const targetPageData = matter(target.data.contents).data
          if (targetPageData.redirect !== pageRef) {
            return {
              content: `Redirecting to [[${pageData.redirect}]]...`,
              frontMatter: {},
              status: 301,
              targetPageRef: pageData.redirect,
            } as const
          }
        }
      }
      const liquidCtx: Record<string, any> = createLiquidContext(
        ctx,
        pageRef,
        pageData,
      )
      return {
        content: String(await engine.renderFile(pageRef, liquidCtx)),
        frontMatter: pageData,
        status: 200,
      } as const
    } catch (e: any) {
      return {
        content: [
          'Unable to render the page:',
          '',
          '```',
          String(e?.stack || e),
          '```',
        ].join('\n'),
        frontMatter: {},
        status: 500,
      } as const
    }
  })()
  const result: GetPageResult = {
    pageRef,
    targetPageRef,
    title: pageRef,
    file: filePath
      ? {
          path: filePath,
          revision: pageFile.data?.revision || undefined,
          content: pageFile.data?.contents || '',
        }
      : undefined,
    content,
    frontMatter,
    status,
    lastModified: pageFile.lastModified?.toISOString() || undefined,
    lastModifiedBy: pageFile.lastModifiedBy,
  }
  return postProcess(ctx, result, render)
}

async function postProcess(
  ctx: ContentsgartenRequestContext,
  result: GetPageResult,
  render: boolean,
): Promise<GetPageResult> {
  const rendered = render
    ? await ctx.perf.measure('processMarkdown', async () =>
        processMarkdown(result.content),
      )
    : undefined
  return rendered ? { ...result, rendered } : result
}

function createLiquidContext(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
  pageData: { [key: string]: any },
) {
  const liquidCtx: Record<string, any> = {}
  if (pageData) {
    liquidCtx.page = pageData
    liquidCtx.ref = pageRef
  }
  return liquidCtx
}

export async function getPageFile(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
  revalidate = false,
) {
  return staleOrRevalidate(
    ctx,
    `page:${pageRef}`,
    () =>
      ctx.perf.measure(`getPageFile(${pageRef})`, async (entry) => {
        if (!revalidate) {
          const cachedPage = await ctx.app.pageDatabase.getCached(pageRef)
          if (cachedPage) {
            return cachedPage
          }
          entry.addInfo('MISS')
        }
        const page = await refreshPageFile(ctx, pageRef)
        return page
      }),
    revalidate ? 'revalidate' : 'stale',
  )
}

export async function refreshPageFile(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
) {
  return ctx.perf.measure(`refreshPageFile(${pageRef})`, async (entry) => {
    const filePath = pageRefToFilePath(ctx, pageRef)
    const getFileResult = (await ctx.app.storage.getFile(ctx, filePath)) || null
    return savePageToDatabase(ctx, pageRef, getFileResult)
  })
}

export async function savePageToDatabase(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
  getFileResult: GetFileResult | null,
) {
  return ctx.perf.measure(`savePageToDatabase(${pageRef})`, () =>
    ctx.app.pageDatabase.save(
      pageRef,
      getFileResult
        ? {
            data: {
              contents: getFileResult.content.toString('utf8'),
              revision: getFileResult.revision,
            },
            lastModified: getFileResult.lastModified
              ? new Date(getFileResult.lastModified)
              : null,
            lastModifiedBy: getFileResult.lastModifiedBy ?? [],
            aux: getAux(
              pageRef,
              matter(getFileResult.content.toString('utf8')).data,
            ),
          }
        : {
            data: null,
            lastModified: null,
            lastModifiedBy: [],
            aux: { frontmatter: {} },
          },
    ),
  )
}

function getAux(pageRef: string, frontMatter: any): PageAuxiliaryData {
  return {
    frontmatter: frontMatter,
    keyValues: getKeyValues(frontMatter),
    normalized: normalizePageRef(pageRef),
  }
}

function normalizePageRef(pageRef: string): string {
  return pageRef.replace(/[_-]/g, '').toLowerCase()
}

function getKeyValues(frontMatter: any): string[] {
  const keyValues = new Set<string>()
  const traverse = (object: any, path: string[] = []): any => {
    if (
      (typeof object === 'string' ||
        typeof object === 'number' ||
        typeof object === 'boolean' ||
        typeof object === 'bigint') &&
      path.length > 0
    ) {
      keyValues.add(path.join('.') + '=' + object)
    } else if (Array.isArray(object)) {
      for (const item of object) {
        traverse(item, path)
      }
    } else if (typeof object === 'object' && object) {
      for (const [key, value] of Object.entries(object)) {
        traverse(value, [...path, key])
      }
    }

    // Add an index to check for existence of a key
    if (path.length > 0) {
      keyValues.add(path.join('.') + ':*')
    }
  }
  traverse(frontMatter)
  return Array.from(keyValues).sort()
}

export async function getSpecialPage(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
  revalidate: boolean,
): Promise<GetPageResult> {
  const specialPages: Record<string, () => Promise<Partial<GetPageResult>>> = {
    AllPages: async () => {
      const fileList = await staleOrRevalidate(
        ctx,
        'AllPages:fileList',
        async () => ctx.app.storage.listFiles(ctx),
        revalidate ? 'revalidate' : 'stale',
      )
      const { pageFilePrefix, pageFileExtension } = ctx.app
      const pages = fileList
        .filter(
          (file) =>
            file.startsWith(pageFilePrefix) && file.endsWith(pageFileExtension),
        )
        .map((file) =>
          file.slice(pageFilePrefix.length, -pageFileExtension.length),
        )
      return {
        content: [
          'All pages:',
          '',
          ...pages.map((page) => `- [${page}](/wiki/${page})`),
        ].join('\n'),
      }
    },
    RecentChanges: async () => {
      const recentChanges = await ctx.app.pageDatabase.getRecentlyChangedPages()
      let lastDate = ''
      const header = (date: Date) => {
        const dateComponent = date.toISOString().slice(0, 10)
        if (lastDate && dateComponent >= lastDate) {
          return ''
        }
        lastDate = dateComponent
        return `\n${dateComponent}\n`
      }
      return {
        content: [
          'This page lists the recently changed pages:',
          '',
          ...recentChanges.map(
            (page) =>
              header(page.lastModified) +
              `- [${page.pageRef}](/wiki/${page.pageRef})`,
          ),
        ].join('\n'),
      }
    },
  }
  const pageKey = pageRef.slice('special/'.length)
  if (Object.hasOwn(specialPages, pageKey)) {
    return {
      pageRef,
      title: pageRef,
      status: 200,
      content: '',
      frontMatter: {},
      ...(await specialPages[pageKey as keyof typeof specialPages]()),
    }
  }
  const result: GetPageResult = {
    pageRef,
    title: pageRef,
    content: '(There is no special page with this name.)',
    status: 404,
    frontMatter: {},
  }
  return result
}

export function pageRefToFilePath(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
) {
  const { pageFileExtension, pageFilePrefix } = ctx.app
  return pageFilePrefix + pageRef + pageFileExtension
}
