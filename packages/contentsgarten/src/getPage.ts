import { ContentsgartenRequestContext } from './ContentsgartenContext'
import { createLiquidEngine } from './createLiquidEngine'
import { getFile } from './CachedFileAccess'
import { z } from 'zod'
import { staleOrRevalidate } from './cache'

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
  const engine = createLiquidEngine(ctx)
  const file = await getFile(ctx, filePath, { revalidating: revalidate })
  const { content, status } = await (async () => {
    if (!file) {
      return {
        content: '(This page currently does not exist.)',
        status: 404,
      } as const
    }
    try {
      return {
        content: String(await engine.renderFile(pageRef)),
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
        status: 500,
      } as const
    }
  })()
  const result: GetPageResult = {
    pageRef,
    title: pageRef,
    file: {
      path: filePath,
      revision: file ? file.revision : undefined,
      content: file ? file.content.toString('utf8') : '',
    },
    content,
    status,
  }
  return result
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
        180e3,
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
  }
  const pageKey = pageRef.slice('special/'.length)
  if (Object.hasOwn(specialPages, pageKey)) {
    return {
      pageRef,
      title: pageRef,
      status: 200,
      content: '',
      ...(await specialPages[pageKey as keyof typeof specialPages]()),
    }
  }
  const result: GetPageResult = {
    pageRef,
    title: pageRef,
    content: '(There is no special page with this name.)',
    status: 404,
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
