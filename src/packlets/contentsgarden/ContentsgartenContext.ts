import type { QueryClient } from '@tanstack/query-core'
import type { ContentsgartenStorage } from './ContentsgartenStorage'
import type { ContentsgartenAuth } from './ContentsgartenAuth'

export interface ContentsgartenContext {
  queryClient: QueryClient
  storage: ContentsgartenStorage
  auth: ContentsgartenAuth
}
