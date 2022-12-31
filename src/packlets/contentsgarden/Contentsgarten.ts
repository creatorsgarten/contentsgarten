import { callProcedure, initTRPC } from '@trpc/server'
import { z } from 'zod'
import type { ContentsgartenStorage } from './ContentsgartenStorage'
import type { ContentsgartenRequest } from './ContentsgartenRequest'
import type { ContentsgartenRequestContext } from './ContentsgartenRequestContext'

export class Contentsgarten {
  storage: ContentsgartenStorage

  t = initTRPC.context<ContentsgartenRequestContext>().create()
  router = this.t.router({
    greeting: this.t.procedure
      .input(z.object({ name: z.string() }))
      .query(({ input }) => 'hello tRPC v10! ' + input.name),
  })

  constructor(config: ContentsgartenConfig) {
    this.storage = config.storage
  }

  async handleRequest(request: ContentsgartenRequest): Promise<Response> {
    const result = await callProcedure({
      procedures: this.router._def.procedures,
      path: request.action,
      rawInput: request.params,
      ctx: {},
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
