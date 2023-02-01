import type { QueryClient } from '@tanstack/query-core'
import type { ContentsgartenConfig } from './ContentsgartenConfig'
import type { RequestContext } from './RequestContext'

export interface ContentsgartenContext extends RequestContext {
  queryClient: QueryClient
  config: ContentsgartenConfig
}
