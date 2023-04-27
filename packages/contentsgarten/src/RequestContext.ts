import type { QueryClient } from '@tanstack/query-core'

export interface RequestContext {
  queryClient: QueryClient
  app: AppContext
  perf: PerfContext
}

export interface AppContext {
  queryClient: QueryClient
}

export interface PerfContext {
  measure<T>(name: string, fn: (entry: PerfEntry) => PromiseLike<T>): Promise<T>
  log(name: string): void
  toMessageArray(): string[]
}

export interface PerfEntry {
  addInfo(info: string): void
}
