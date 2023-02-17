import { z } from 'zod'
import { t } from './trpc'
import type { ContentsgartenRequestContext } from './ContentsgartenContext'
import { TRPCError } from '@trpc/server'
import { invalidateFile } from './CachedFileAccess'
import { DeniedEntry, checkPermission } from './checkPermission'
import { Policy } from './Policy'
import { User } from './ContentsgartenAuth'
import { omit } from 'lodash-es'
import { GetPageResult, getPage, pageRefToFilePath } from './getPage'
import { load } from 'js-yaml'
import { cache } from './cache'

export { GetPageResult } from './getPage'

export const ContentsgartenRouter = t.router({
  about: t.procedure
    .meta({
      summary:
        'Returns information about the instance, as well as configured settings',
    })
    .query(async ({ ctx }) => {
      return {
        name: 'Contentsgarten',
        config: await getConfig(ctx),
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
        pageRef: z.string(),
        withFile: z.boolean().default(true),
        revalidate: z.boolean().optional(),
      }),
    )
    .output(GetPageResult)
    .query(async ({ input: { pageRef, revalidate, withFile }, ctx }) => {
      const page = await getPage(ctx, pageRef, revalidate)
      const result: GetPageResult = withFile ? page : omit(page, 'file')
      return result
    }),
  getEditPermission: t.procedure
    .meta({
      summary:
        'Checks whether the authenticated user is allowed to edit a page',
    })
    .input(
      z.object({
        pageRef: z.string(),
      }),
    )
    .query(async ({ input: { pageRef }, ctx }) => {
      const authState = await resolveAuthState(ctx)
      const userId = authState.authenticated ? authState.user.id : undefined
      const policies = await getPagePolicies(ctx, pageRef)
      return checkPermission(
        ctx,
        [
          {
            userId,
            permission: 'edit',
            page: pageRef,
            frontmatterKey: '__content',
          },
          { userId, permission: 'editContent', page: pageRef },
        ],
        policies,
      )
    }),
  save: t.procedure
    .meta({ summary: 'Attempts to save changes to a page' })
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
      const userId = authState.authenticated ? authState.user.id : undefined
      const policies = await getPagePolicies(ctx, pageRef)
      const permission = await checkPermission(
        ctx,
        [
          {
            userId,
            permission: 'edit',
            page: pageRef,
            frontmatterKey: '__content',
          },
          { userId, permission: 'editContent', page: pageRef },
        ],
        policies,
      )
      if (!permission.granted) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'You are not allowed to edit this page. None of these policies granted you access to edit this page:\n' +
            explainDenied(permission.denied),
        })
      }
      const result = await ctx.app.storage.putFile(ctx, filePath, {
        content: Buffer.from(newContent),
        revision: oldRevision,
        message: `Update page ${pageRef}`,
        userId: userId,
      })
      await invalidateFile(ctx, filePath)
      return { revision: result.revision }
    }),
})

async function resolveAuthState(ctx: ContentsgartenRequestContext) {
  return ctx.queryClient.fetchQuery({
    queryKey: ['authState'],
    queryFn: async () => {
      return ctx.app.auth.getAuthState(ctx.authToken)
    },
  })
}

const Config = z.object({
  policies: z.array(Policy).optional().default([]),
  auth: z
    .object({
      firebase: z
        .object({
          apiKey: z.string(),
          authDomain: z.string(),
          projectId: z.string(),
        })
        .optional(),
    })
    .optional()
    .default({}),
})

async function getPagePolicies(
  ctx: ContentsgartenRequestContext,
  pageRef: string,
): Promise<Policy[]> {
  const config = await getConfig(ctx)
  return config.policies
}

async function getConfig(ctx: ContentsgartenRequestContext) {
  const configFile = await cache(
    ctx,
    'config',
    async () => {
      const configFile = await ctx.app.storage.getFile(
        ctx,
        'contentsgarten.config.yml',
      )
      if (!configFile) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '"contentsgarten.config.yml" not found in storage',
        })
      }
      return configFile
    },
    300e3,
  )
  const config = Config.parse(load(configFile.content.toString('utf8')))
  return config
}

function explainDenied(denied: DeniedEntry[]) {
  const out: string[] = []
  for (const entry of denied) {
    out.push(
      '* ' +
        policyName(entry.policy) +
        ' on ' +
        JSON.stringify(entry.permissionContext),
    )
    for (const item of entry.resolutions) {
      if (!item.included) {
        out.push(`  - ${item.reason}`)
      }
    }
  }
  return out.join('\n')
}

function policyName(policy: Policy) {
  return policy.name || JSON.stringify(policy)
}
