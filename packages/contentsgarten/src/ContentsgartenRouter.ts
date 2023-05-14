import { TRPCError } from '@trpc/server'
import { omit } from 'lodash-es'
import { z } from 'zod'
import { AuthorizerResult, GitHubHelpers } from './Authorizer'
import { AuthState, User } from './ContentsgartenAuth'
import type { ContentsgartenRequestContext } from './ContentsgartenContext'
import { PageDatabaseSearch } from './ContentsgartenPageDatabase'
import { LaxPageRefRegex, PageRefRegex } from './PageRefRegex'
import {
  GetPageResult,
  getPage,
  invalidateCachedPageFile,
  pageRefToFilePath,
  savePageToDatabase,
} from './getPage'
import { t } from './trpc'
import { cache } from './cache'

export { GetPageResult } from './getPage'
export { PageRefRegex }
export const PageRef = z.string().regex(PageRefRegex)
export const LaxPageRef = z.string().regex(LaxPageRefRegex)

export const ContentsgartenRouter = t.router({
  about: t.procedure
    .meta({
      summary:
        'Returns information about the instance, as well as configured settings',
    })
    .query(async ({ ctx }) => {
      return {
        name: 'Contentsgarten',
      }
    }),
  userInfo: t.procedure
    .meta({ summary: 'Returns the info of the authenticated user' })
    .output(
      z.union([
        z.object({
          authenticated: z.literal(true),
          user: User,
        }),
        z.object({
          authenticated: z.literal(false),
          reason: z
            .string()
            .describe('If authenticated is false, this is the reason why'),
        }),
      ]),
    )
    .query(async ({ ctx }) => {
      const authState = await resolveAuthState(ctx)
      return authState
    }),
  view: t.procedure
    .meta({ summary: 'Returns the page information' })
    .input(
      z.object({
        pageRef: LaxPageRef,
        withFile: z.boolean().default(true),
        revalidate: z.boolean().optional(),
        render: z.boolean().optional(),
      }),
    )
    .output(GetPageResult.merge(z.object({ perf: z.array(z.string()) })))
    .query(
      async ({ input: { pageRef, revalidate, withFile, render }, ctx }) => {
        const page = await getPage(ctx, pageRef, revalidate, render)
        const result: GetPageResult = withFile ? page : omit(page, 'file')
        return { ...result, perf: ctx.perf.toMessageArray() }
      },
    ),
  getEditPermission: t.procedure
    .meta({
      summary:
        'Checks whether the authenticated user is allowed to edit a page',
    })
    .input(
      z.object({
        pageRef: PageRef,
      }),
    )
    .output(
      z.object({
        granted: z.boolean(),
        reason: z.string().optional(),
      }),
    )
    .query(async ({ input: { pageRef }, ctx }) => {
      const authState = await resolveAuthState(ctx)
      return authorize(ctx, authState, pageRef)
    }),
  save: t.procedure
    .meta({ summary: 'Attempts to save changes to a page' })
    .input(
      z.object({
        pageRef: PageRef,
        newContent: z.string(),
        oldRevision: z.string().optional(),
      }),
    )
    .mutation(async ({ input: { pageRef, newContent, oldRevision }, ctx }) => {
      const filePath = pageRefToFilePath(ctx, pageRef)
      const authState = await resolveAuthState(ctx)
      const userId = authState.authenticated ? authState.user.id : undefined
      const authz = await authorize(ctx, authState, pageRef)
      if (!authz.granted) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You are not allowed to edit this page: ${authz.reason}`,
        })
      }
      const result = await ctx.app.storage.putFile(ctx, filePath, {
        content: Buffer.from(newContent),
        revision: oldRevision,
        message: `Update page ${pageRef}`,
        userId: userId,
      })
      await savePageToDatabase(ctx, pageRef, {
        content: Buffer.from(newContent),
        revision: result.revision,
        lastModified: result.lastModified,
        lastModifiedBy: result.lastModifiedBy,
      })
      await invalidateCachedPageFile(ctx, pageRef)
      return { revision: result.revision }
    }),
  search: t.procedure
    .meta({
      summary:
        'Runs a query against the pages in database. Most recently updated pages are returned first.',
    })
    .input(PageDatabaseSearch)
    .query(async ({ input, ctx }) => {
      return await ctx.app.pageDatabase.queryPages(input)
    }),
})

export type ContentsgartenRouter = typeof ContentsgartenRouter

async function resolveAuthState(ctx: ContentsgartenRequestContext) {
  return ctx.queryClient.fetchQuery({
    queryKey: ['authState'],
    queryFn: async () => {
      return ctx.app.auth.getAuthState(ctx.authToken)
    },
  })
}

async function authorize(
  ctx: ContentsgartenRequestContext,
  authState: AuthState,
  pageRef: string,
): Promise<AuthorizerResult> {
  if (!authState.authenticated) {
    return {
      granted: false,
      reason: 'Not authenticated',
    }
  }
  return ctx.app.authorizer({
    action: {
      type: 'edit',
      pageRef,
    },
    user: authState.user,
    gitHub: createGitHubHelpers(ctx),
  })
}

function createGitHubHelpers(ctx: ContentsgartenRequestContext): GitHubHelpers {
  return {
    isUserInTeam: (user, owner, teamSlug) => {
      return cache(
        ctx,
        `team:${owner}/${teamSlug}:member:${user.id}`,
        async () => {
          return ctx.app.teamResolver.checkMembership(
            ctx,
            user.id,
            `${owner}/${teamSlug}`,
          )
        },
        300e3,
      )
    },
  }
}
