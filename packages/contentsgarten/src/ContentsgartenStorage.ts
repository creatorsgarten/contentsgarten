import type { GitHubApp } from './GitHubApp'
import type { RequestContext } from './RequestContext'
import { resolveOctokit } from './resolveOctokit'

export interface ContentsgartenStorage {
  getFile(ctx: RequestContext, path: string): Promise<GetFileResult | undefined>
  putFile(
    ctx: RequestContext,
    path: string,
    options: PutFileOptions,
  ): Promise<PutFileResult>
  listFiles(ctx: RequestContext): Promise<string[]>
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
    const octokit = await resolveOctokit(ctx, this.config.app, this.config.repo)
    const { owner, repo } = this
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      })
      console.log(data)
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
    const octokit = await resolveOctokit(ctx, this.config.app, this.config.repo)
    const { owner, repo } = this
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      branch: this.config.branch,
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

  async listFiles(ctx: RequestContext): Promise<string[]> {
    const octokit = await resolveOctokit(ctx, this.config.app, this.config.repo)
    const { owner, repo } = this
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: this.config.branch,
      recursive: 'true',
    })
    return data.tree
      .filter((item) => item.type === 'blob')
      .map((item) => item.path!)
  }
}

export interface GitHubStorageConfig {
  repo: string
  branch: string
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
