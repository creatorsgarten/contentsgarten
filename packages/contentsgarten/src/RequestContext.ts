import type { QueryClient } from '@tanstack/query-core'

export interface RequestContext {
  queryClient: QueryClient
  global: GlobalContext
}

export interface GlobalContext {
  queryClient: QueryClient
}
