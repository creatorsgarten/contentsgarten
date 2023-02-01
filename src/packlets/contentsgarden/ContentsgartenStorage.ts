import type { GitHubApp } from './GitHubApp'
import type { RequestContext } from './RequestContext'

export interface ContentsgartenStorage {
  getFile(ctx: RequestContext, path: string): Promise<GetFileResult | undefined>
}
export interface GetFileResult {
  content: Buffer
  revision: string
}

export class GitHubStorage implements ContentsgartenStorage {
  constructor(private config: GitHubStorageConfig) {}
  async getFile(ctx: RequestContext, path: string) {
    const octokit = await this.config.app.getOctokit(this.config.repo)
    const [owner, repo] = this.config.repo.split('/')
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      })
      if (!('content' in data)) {
        throw new Error('No content found')
      }
      return {
        content: Buffer.from(data.content, 'base64'),
        revision: data.sha,
      }
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        return undefined
      }
      throw error
    }
  }
}

export interface GitHubStorageConfig {
  repo: string
  app: GitHubApp
}

function isApiError(e: unknown): e is ApiError {
  return 'status' in (e as object) && 'response' in (e as object)
}

interface ApiError {
  status: number
  response: {
    data: any
  }
}
