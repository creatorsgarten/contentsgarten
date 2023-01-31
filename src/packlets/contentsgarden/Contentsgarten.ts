import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import type { ContentsgartenRequest } from './ContentsgartenRequest'
import type { ContentsgartenContext } from './ContentsgartenContext'
import { QueryClient } from '@tanstack/query-core'
import type { ContentsgartenConfig } from './ContentsgartenConfig'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

const t = initTRPC.context<ContentsgartenContext>().create()

export const ContentsgartenRouter = t.router({
  greeting: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => 'hello tRPC v10! ' + input.name),
})

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
