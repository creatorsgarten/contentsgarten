import { ContentsgartenRequestContext } from './ContentsgartenContext'
import { createLiquidEngine } from './createLiquidEngine'
import { z } from 'zod'
import { staleOrRevalidate } from './cache'
import { PageData } from './ContentsgartenPageDatabase'
import matter from 'gray-matter'
import { GetFileResult } from './ContentsgartenStorage'

export const GetPageResult = z.object({
  status: z.union([z.literal(200), z.literal(404), z.literal(500)]),
  pageRef: z.string(),
  title: z.string(),
  file: z
    .object({
      path: z.string(),
      content: z.string(),
      revision: z.string().optional(),
    })
    .optional(),
  content: z.string(),
  frontMatter: z.record(z.any()),
  lastModified: z.string().optional(),
  lastModifiedBy: z.array(z.string()).optional(),
})
export type GetPageResult = z.infer<typeof GetPageResult>

export async function getPage(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
  revalidate = false,
) {
  if (pageRef.toLowerCase().startsWith('special/')) {
    return getSpecialPage(ctx, pageRef, revalidate)
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

  const { content, frontMatter, status } = await (async () => {
    if (!pageFile.data) {
      return {
        content: '(This page currently does not exist.)',
        frontMatter: {},
        status: 404,
      } as const
    }
    try {
      const liquidCtx: Record<string, any> = {}
      const pageData = matter(pageFile.data.contents).data
      if (pageData) {
        liquidCtx.page = pageData
      }
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
  return result
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
