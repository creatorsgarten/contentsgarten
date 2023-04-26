import { ContentsgartenRequestContext } from './ContentsgartenContext'
import { createLiquidEngine } from './createLiquidEngine'
import { z } from 'zod'
import { staleOrRevalidate } from './cache'
import { PageData } from './ContentsgartenPageDatabase'
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
      postProcess(result, render),
    )
  }

  const filePath = pageRefToFilePath(ctx, pageRef)

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
  engine.registerFilter('getpage', (pageRef: string) => {
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

  const { content, frontMatter, status, targetPageRef } = await (async () => {
    if (!pageFile.data) {
      return {
        content: '(This page currently does not exist.)',
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
    file: {
      path: filePath,
      revision: pageFile.data?.revision || undefined,
      content: pageFile.data?.contents || '',
    },
    content,
    frontMatter,
    status,
    lastModified: pageFile.lastModified?.toISOString() || undefined,
    lastModifiedBy: pageFile.lastModifiedBy,
  }
  return postProcess(result, render)
}

function postProcess(result: GetPageResult, render: boolean): GetPageResult {
  const rendered = render ? processMarkdown(result.content) : undefined
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
  if (!revalidate) {
    const cachedPage = await ctx.app.pageDatabase.getCached(pageRef)
    if (cachedPage) {
      return cachedPage
    }
  }
  const page = await refreshPageFile(ctx, pageRef)
  return page
}

export async function refreshPageFile(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
) {
  const filePath = pageRefToFilePath(ctx, pageRef)
  const getFileResult = (await ctx.app.storage.getFile(ctx, filePath)) || null
  return savePageToDatabase(ctx, pageRef, getFileResult)
}

export async function savePageToDatabase(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
  getFileResult: GetFileResult | null,
) {
  return ctx.app.pageDatabase.save(
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
          aux: {
            frontmatter: matter(getFileResult.content.toString('utf8')).data,
          },
        }
      : {
          data: null,
          lastModified: null,
          lastModifiedBy: [],
          aux: {
            frontmatter: {},
          },
        },
  )
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
