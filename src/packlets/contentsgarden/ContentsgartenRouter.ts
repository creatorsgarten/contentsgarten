import { z } from 'zod'
import { t } from './trpc'
import type { ContentsgartenContext } from './ContentsgartenContext'
import { createLiquidEngine } from './createLiquidEngine'

export const ContentsgartenRouter = t.router({
  about: t.procedure.query(() => {
    return {
      name: 'Contentsgarten',
    }
  }),
  view: t.procedure
    .input(
      z.object({
        pageRef: z.string(),
      }),
    )
    .query(async ({ input: { pageRef }, ctx }) => {
      return getPage(ctx, pageRef)
    }),
})

function pageRefToFilePath(_ctx: ContentsgartenContext, pageRef: string) {
  return 'wiki/' + pageRef + '.md.liquid'
}

async function getPage(ctx: ContentsgartenContext, pageRef: string) {
  const filePath = pageRefToFilePath(ctx, pageRef)
  const engine = createLiquidEngine(ctx)
  const file = await ctx.config.storage.getFile(ctx, filePath)
  const result: GetPageResult = {
    pageRef,
    title: pageRef,
    file: {
      path: filePath,
      revision: file ? file.revision : undefined,
      content: file ? file.content.toString('utf8') : '',
    },
    content: String(
      file
        ? await engine.renderFile(pageRef)
        : '(This page currently does not exist)',
    ),
    status: file ? 200 : 404,
  }
  return result
}

export interface GetPageResult {
  status: 200 | 404
  pageRef: string
  title: string
  file?: {
    path: string
    content: string
    revision?: string
  }
  content: string
}
