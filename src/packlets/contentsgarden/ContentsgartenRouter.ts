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
  return {
    pageRef,
    title: pageRef,
    file: {
      path: filePath,
      revision: file ? file.revision : undefined,
    },
    content: file
      ? await engine.renderFile(pageRef)
      : '(This page currently does not exist)',
  }
}
