import type { ContentsgartenContext } from './ContentsgartenContext'
import { QueryClient } from '@tanstack/query-core'
import type { ContentsgartenConfig } from './ContentsgartenConfig'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { ContentsgartenRouter } from './ContentsgartenRouter'

export class Contentsgarten {
  constructor(private config: ContentsgartenConfig) {}

  createContext(input: CreateContextInput): ContentsgartenContext {
    return {
      queryClient: new QueryClient(),
      config: this.config,
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
): ContentsgartenContext {
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
