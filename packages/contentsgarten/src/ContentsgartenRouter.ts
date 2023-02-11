import { z } from 'zod'
import { t } from './trpc'
import type { ContentsgartenRequestContext } from './ContentsgartenContext'
import { createLiquidEngine } from './createLiquidEngine'
import { TRPCError } from '@trpc/server'
import { getFile } from './getFile'

export const ContentsgartenRouter = t.router({
  about: t.procedure.query(() => {
    return {
      name: 'Contentsgarten',
    }
  }),
  userInfo: t.procedure.query(async ({ ctx }) => {
    const authState = await resolveAuthState(ctx)
    return authState
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
  save: t.procedure
    .input(
      z.object({
        pageRef: z.string(),
        newContent: z.string(),
        oldRevision: z.string().optional(),
      }),
    )
    .mutation(async ({ input: { pageRef, newContent, oldRevision }, ctx }) => {
      const filePath = pageRefToFilePath(ctx, pageRef)
      const authState = await resolveAuthState(ctx)
      if (!authState.authenticated) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        })
      }
      if (authState.user.id !== 193136) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not allowed to edit the page',
        })
      }
      const result = await ctx.app.storage.putFile(ctx, filePath, {
        content: Buffer.from(newContent),
        revision: oldRevision,
        message: `Update page ${pageRef}`,
        // userId: authState.user.id,
        userId: 193136,
      })
      return { revision: result.revision }
    }),
})

function pageRefToFilePath(
  _ctx: ContentsgartenRequestContext,
  pageRef: string,
) {
  return 'wiki/' + pageRef + '.md.liquid'
}

async function getPage(ctx: ContentsgartenRequestContext, pageRef: string) {
  const filePath = pageRefToFilePath(ctx, pageRef)
  const engine = createLiquidEngine(ctx)
  const file = await getFile(ctx, filePath)
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
        : '(This page currently does not exist.)',
    ),
    status: file ? 200 : 404,
  }
  return result
}

async function resolveAuthState(ctx: ContentsgartenRequestContext) {
  return ctx.queryClient.fetchQuery({
    queryKey: ['authState'],
    queryFn: async () => {
      return ctx.app.auth.getAuthState(ctx.authToken)
    },
  })
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
