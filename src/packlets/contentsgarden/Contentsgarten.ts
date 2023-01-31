import type { ContentsgartenContext } from './ContentsgartenContext'
import { QueryClient } from '@tanstack/query-core'
import type { ContentsgartenConfig } from './ContentsgartenConfig'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { ContentsgartenRouter } from './ContentsgartenRouter'

export class Contentsgarten {
  constructor(private config: ContentsgartenConfig) {}

  createContext(): ContentsgartenContext {
    return {
      queryClient: new QueryClient(),
      config: this.config,
    }
  }
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
      return core.createContext()
    },
  })
}
