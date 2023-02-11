import { z } from 'zod'
import { t } from './trpc'
import type { ContentsgartenRequestContext } from './ContentsgartenContext'
import { createLiquidEngine } from './createLiquidEngine'
import { TRPCError } from '@trpc/server'
import { getFile, invalidateFile } from './CachedFileAccess'

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
        revalidate: z.boolean().optional(),
      }),
    )
    .query(async ({ input: { pageRef, revalidate }, ctx }) => {
      return getPage(ctx, pageRef, revalidate)
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
      await invalidateFile(ctx, filePath)
      return { revision: result.revision }
    }),
})

function pageRefToFilePath(ctx: ContentsgartenRequestContext, pageRef: string) {
  const { pageFileExtension, pageFilePrefix } = ctx.app
  return pageFilePrefix + pageRef + pageFileExtension
}

async function getPage(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
  revalidate = false,
) {
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

async function resolveAuthState(ctx: ContentsgartenRequestContext) {
  return ctx.queryClient.fetchQuery({
    queryKey: ['authState'],
    queryFn: async () => {
      return ctx.app.auth.getAuthState(ctx.authToken)
    },
  })
}

export interface GetPageResult {
  status: 200 | 404 | 500
  pageRef: string
  title: string
  file?: {
    path: string
    content: string
    revision?: string
  }
  content: string
}
