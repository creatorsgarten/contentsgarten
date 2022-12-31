export class Contentsgarten {
  constructor(private config: ContentsgartenConfig) {}
  async handleRequest(request: ContentsgartenRequest): Promise<Response> {
    return new Response('Hello, world!', {
      headers: { 'content-type': 'text/plain' },
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
  authorization?: string | null
}
