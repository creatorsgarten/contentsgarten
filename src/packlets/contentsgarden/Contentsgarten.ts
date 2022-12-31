import { callProcedure, initTRPC } from '@trpc/server'

export class Contentsgarten {
  t = initTRPC.create()
  router = this.t.router({
    greeting: this.t.procedure.query(() => 'hello tRPC v10!'),
  })

  constructor(private config: ContentsgartenConfig) {}

  async handleRequest(request: ContentsgartenRequest): Promise<Response> {
    const result = await callProcedure({
      procedures: this.router._def.procedures,
      path: request.action,
      rawInput: request.params,
      ctx: {},
      type: request.method === 'GET' ? 'query' : 'mutation',
    })
    console.log(result)
    return new Response(JSON.stringify(result), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    })
  }
}

export interface ContentsgartenConfig {
  storage: ContentsgartenStorage
}

export interface ContentsgartenStorage {}

export class GitHubStorage implements ContentsgartenStorage {
  constructor(private config: GitHubStorageConfig) {}
}

export interface GitHubStorageConfig {
  repo: string
  appId?: number
  privateKey?: string
  token?: string
}

export interface ContentsgartenRequest {
  action: string
  params: unknown
  method: string
  authorization?: string | null
}
