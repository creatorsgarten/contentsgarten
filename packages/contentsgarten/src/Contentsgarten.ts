import type {
  ContentsgartenRequestContext,
  ContentsgartenAppContext,
} from './ContentsgartenContext'
import { QueryClient } from '@tanstack/query-core'
import type { ContentsgartenConfig } from './ContentsgartenConfig'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { ContentsgartenRouter } from './ContentsgartenRouter'
import { PerfContextImpl } from './PerfContextImpl'

export class Contentsgarten {
  private globalContext: ContentsgartenAppContext
  constructor(config: ContentsgartenConfig) {
    this.globalContext = {
      queryClient: new QueryClient({
        defaultOptions: { queries: { staleTime: Infinity } },
      }),
      ...config,
      pageFilePrefix: config.pageFilePrefix ?? 'wiki/',
      pageFileExtension: config.pageFileExtension ?? '.md.liquid',
    }
  }

  createContext(input: CreateContextInput): ContentsgartenRequestContext {
    return {
      app: this.globalContext,
      queryClient: new QueryClient({
        defaultOptions: { queries: { staleTime: Infinity } },
      }),
      authToken: input.authToken,
      perf: new PerfContextImpl(),
    }
  }
}

export interface CreateContextInput {
  /** Bearer token */
  authToken?: string
}

export async function handleContentsgartenRequest(
  core: Contentsgarten,
  request: Request,
  prefix: string,
) {
  return fetchRequestHandler({
    endpoint: prefix,
    req: request,
    router: ContentsgartenRouter,
    responseMeta() {
      return {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    },
    createContext: ({ req }) => {
      return createContextFromRequest(core, req)
    },
  })
}

export function createContextFromRequest(
  core: Contentsgarten,
  req: Request,
): ContentsgartenRequestContext {
  return core.createContext({
    authToken: getAuthTokenFromRequest(req),
  })
}

function getAuthTokenFromRequest(request: Request): string | undefined {
  const authHeader = request.headers.get('Authorization')
  if (authHeader) {
    return authHeader.split(' ').pop()
  }
}
