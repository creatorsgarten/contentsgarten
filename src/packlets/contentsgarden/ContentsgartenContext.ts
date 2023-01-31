import type { QueryClient } from '@tanstack/query-core'
import type { ContentsgartenConfig } from './ContentsgartenConfig'

export interface ContentsgartenContext {
  queryClient: QueryClient
  config: ContentsgartenConfig
}
