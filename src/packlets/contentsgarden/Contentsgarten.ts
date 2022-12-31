import { callProcedure, initTRPC } from '@trpc/server'
import { z } from 'zod'
import type { ContentsgartenStorage } from './ContentsgartenStorage'
import type { ContentsgartenRequest } from './ContentsgartenRequest'
import type { ContentsgartenContext } from './ContentsgartenContext'
import { QueryClient } from '@tanstack/query-core'

const t = initTRPC.context<ContentsgartenContext>().create()

const router = t.router({
  greeting: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => 'hello tRPC v10! ' + input.name),
})

export class Contentsgarten {
  constructor(private config: ContentsgartenConfig) {}

  async handleRequest(request: ContentsgartenRequest): Promise<Response> {
    const result = await callProcedure({
      procedures: router._def.procedures,
      path: request.action,
      rawInput: request.params,
      ctx: {
        queryClient: new QueryClient(),
      },
      type: request.method === 'GET' ? 'query' : 'mutation',
    })
    return new Response(JSON.stringify(result), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    })
  }
}

export interface ContentsgartenConfig {
  storage: ContentsgartenStorage
}
