import type { QueryClient } from '@tanstack/query-core'

export interface RequestContext {
  queryClient: QueryClient
  app: AppContext
}

export interface AppContext {
  queryClient: QueryClient
}
