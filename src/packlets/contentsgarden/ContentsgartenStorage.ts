import type { GitHubApp } from './GitHubApp'
import type { RequestContext } from './RequestContext'

export interface ContentsgartenStorage {
  getFile(ctx: RequestContext, path: string): Promise<GetFileResult | undefined>
  putFile(
    ctx: RequestContext,
    path: string,
    options: PutFileOptions,
  ): Promise<PutFileResult>
}
export interface GetFileResult {
  content: Buffer
  revision: string
}

export interface PutFileOptions {
  content: Buffer
  message: string
  userId?: number
  revision?: string
}

export interface PutFileResult {
  revision: string
}

export class GitHubStorage implements ContentsgartenStorage {
  owner: string
  repo: string

  constructor(private config: GitHubStorageConfig) {
    const [owner, repo] = config.repo.split('/')
    this.owner = owner
    this.repo = repo
  }

  async getFile(ctx: RequestContext, path: string) {
    const octokit = await this.config.app.getOctokit(this.config.repo)
    const { owner, repo } = this
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
  async putFile(
    ctx: RequestContext,
    path: string,
    options: PutFileOptions,
  ): Promise<PutFileResult> {
    const octokit = await this.config.app.getOctokit(this.config.repo)
    const { owner, repo } = this
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      sha: options.revision,
      content: options.content.toString('base64'),
      message:
        options.message +
        (options.userId
          ? `\n\n\nCo-authored-by: User <${options.userId}+username@users.noreply.github.com>`
          : ''),
    })
    if (!('content' in data)) {
      throw new Error('No content found')
    }
    return { revision: data.content!.sha! }
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
