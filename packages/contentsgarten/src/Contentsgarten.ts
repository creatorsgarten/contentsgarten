import type {
  ContentsgartenRequestContext,
  ContentsgartenAppContext,
} from './ContentsgartenContext'
import { QueryClient } from '@tanstack/query-core'
import type { ContentsgartenConfig } from './ContentsgartenConfig'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { ContentsgartenRouter } from './ContentsgartenRouter'

export class Contentsgarten {
  private globalContext: ContentsgartenAppContext
  constructor(config: ContentsgartenConfig) {
    this.globalContext = {
      queryClient: new QueryClient({
        defaultOptions: { queries: { staleTime: Infinity } },
      }),
      ...config,
    }
  }

  createContext(input: CreateContextInput): ContentsgartenRequestContext {
    return {
      app: this.globalContext,
      queryClient: new QueryClient({
        defaultOptions: { queries: { staleTime: Infinity } },
      }),
      authToken: input.authToken,
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
