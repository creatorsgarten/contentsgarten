import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import { omit } from 'lodash-es'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { Contentsgarten } from './Contentsgarten'
import { PageDatabaseSearch } from './ContentsgartenPageDatabase'
import { authorize, resolveAuthState } from './ContentsgartenRequestHelpers'
import { LaxPageRefRegex, PageRefRegex } from './PageRefRegex'
import {
  GetPageResult,
  getPage,
  invalidateCachedPageFile,
  pageRefToFilePath,
  savePageToDatabase,
} from './getPage'
import { cache } from './cache'

const LaxPageRef = z.string().regex(LaxPageRefRegex)
const PageRef = z.string().regex(PageRefRegex)

/**
 * Builds the Elysia app for the REST API. Exported (in addition to the
 * WinterCG handler below) so a build script can call `.handle()` directly
 * to export a static OpenAPI spec without starting a server.
 */
export function createContentsgartenRestApp(core: Contentsgarten) {
  return new Elysia()
    .use(
      openapi({
        mapJsonSchema: { zod: zodToJsonSchema },
        documentation: {
          info: { title: 'Contentsgarten', version: '1' },
          components: {
            securitySchemes: {
              bearerAuth: { type: 'http', scheme: 'bearer' },
            },
          },
        },
      }),
    )
    .derive(({ headers }) => ({
      ctx: core.createContext({
        authToken: headers.authorization?.split(' ').pop(),
      }),
    }))
    .get('/about', () => ({ name: 'Contentsgarten' }), {
      detail: { summary: 'Returns information about the instance' },
    })
    .get(
      '/user',
      async ({ ctx }) => {
        return resolveAuthState(ctx)
      },
      {
        detail: { summary: 'Returns the info of the authenticated user' },
      },
    )
    .get(
      '/pages/*',
      async ({ ctx, params, query }) => {
        const pageRef = params['*']
        const withFile = query.withFile !== 'false'
        const revalidate = query.revalidate === 'true'
        const render = query.render === 'true'
        const page = await getPage(ctx, pageRef, revalidate, render)
        const result: GetPageResult = withFile ? page : omit(page, 'file')
        return { ...result, perf: ctx.perf.toMessageArray() }
      },
      {
        params: z.object({ '*': LaxPageRef }),
        query: z.object({
          withFile: z.string().optional(),
          revalidate: z.string().optional(),
          render: z.string().optional(),
        }),
        detail: { summary: 'Returns the page information' },
      },
    )
    .get(
      '/page-contributors/*',
      async ({ ctx, params }) => {
        const pageRef = params['*']
        const filePath = pageRefToFilePath(ctx, pageRef)
        const result = await cache(
          ctx,
          `contributors:${filePath}`,
          async () => {
            return ctx.app.storage.listContributors(ctx, filePath)
          },
          300e3,
        )
        return { ...result, perf: ctx.perf.toMessageArray() }
      },
      {
        params: z.object({ '*': LaxPageRef }),
        detail: { summary: 'Returns the contributors of a page' },
      },
    )
    .get(
      '/page-permission/*',
      async ({ ctx, params }) => {
        const pageRef = params['*']
        const authState = await resolveAuthState(ctx)
        return authorize(ctx, authState, pageRef)
      },
      {
        params: z.object({ '*': PageRef }),
        detail: {
          summary:
            'Checks whether the authenticated user is allowed to edit a page',
        },
      },
    )
    .put(
      '/pages/*',
      async ({ ctx, params, body, status }) => {
        const pageRef = params['*']
        const filePath = pageRefToFilePath(ctx, pageRef)
        const authState = await resolveAuthState(ctx)
        const userId = authState.authenticated ? authState.user.id : undefined
        const authz = await authorize(ctx, authState, pageRef)
        if (!authz.granted) {
          return status(403, {
            error: `You are not allowed to edit this page: ${authz.reason}`,
          })
        }
        const result = await ctx.app.storage.putFile(ctx, filePath, {
          content: Buffer.from(body.newContent),
          revision: body.oldRevision,
          message: `Update page ${pageRef}`,
          userId,
        })
        await savePageToDatabase(ctx, pageRef, {
          content: Buffer.from(body.newContent),
          revision: result.revision,
          lastModified: result.lastModified,
          lastModifiedBy: result.lastModifiedBy,
        })
        await invalidateCachedPageFile(ctx, pageRef)
        return { revision: result.revision }
      },
      {
        params: z.object({ '*': PageRef }),
        body: z.object({
          newContent: z.string(),
          oldRevision: z.string().optional(),
        }),
        response: {
          200: z.object({ revision: z.string().optional() }),
          403: z.object({ error: z.string() }),
        },
        detail: { summary: 'Attempts to save changes to a page' },
      },
    )
    .get(
      '/pages',
      async ({ ctx, query }) => {
        const input = PageDatabaseSearch.parse(
          query.q ? JSON.parse(query.q) : {},
        )
        return ctx.app.pageDatabase.queryPages(input)
      },
      {
        query: z.object({
          q: z
            .string()
            .optional()
            .describe(
              'JSON-encoded search query, matching the shape of PageDatabaseSearch',
            ),
        }),
        detail: {
          summary:
            'Runs a query against the pages in database. Most recently updated pages are returned first.',
        },
      },
    )
}

/**
 * Creates a WinterCG-compliant request handler (`(request: Request) =>
 * Promise<Response>`) for the REST API, ready to be mounted on any
 * fetch-compatible server/runtime (Bun, Node, Astro, Next.js, Deno,
 * Cloudflare Workers, etc).
 */
export function handleContentsgartenRestRequest(core: Contentsgarten) {
  const app = createContentsgartenRestApp(core)
  return (request: Request) => app.handle(request)
}
