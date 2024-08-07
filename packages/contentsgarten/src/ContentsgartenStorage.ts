import type { GitHubApp } from './GitHubApp'
import type { RequestContext } from './RequestContext'
import { resolveGitHubUsernameFromId } from './resolveGitHubUsernameFromId'
import { ContentsgartenOctokit, resolveOctokit } from './resolveOctokit'

export interface ContentsgartenStorage {
  getFile(ctx: RequestContext, path: string): Promise<GetFileResult | undefined>
  putFile(
    ctx: RequestContext,
    path: string,
    options: PutFileOptions,
  ): Promise<PutFileResult>
  listContributors(
    ctx: RequestContext,
    path: string,
  ): Promise<ListContributorsResult>
  listFiles(ctx: RequestContext): Promise<string[]>
}

export interface GetFileResult {
  content: Buffer
  lastModified?: string
  lastModifiedBy?: string[]
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
  lastModified: string
  lastModifiedBy: string[]
}

export interface ListContributorsResult {
  contributors: Contributor[]
}

export interface Contributor {
  login: string
  avatarUrl: string
  contributions: number
}

export class GitHubStorage implements ContentsgartenStorage {
  owner: string
  repo: string

  constructor(private config: GitHubStorageConfig) {
    const [owner, repo] = config.repo.split('/')
    this.owner = owner
    this.repo = repo
  }

  async getFile(
    ctx: RequestContext,
    path: string,
  ): Promise<GetFileResult | undefined> {
    const octokit = await resolveOctokit(ctx, this.config.app, this.config.repo)
    const { owner, repo } = this
    try {
      const [{ data }, { data: history }] = await Promise.all([
        octokit.rest.repos.getContent({
          owner,
          repo,
          path,
        }),
        octokit.rest.repos.listCommits({
          owner,
          repo,
          path,
          per_page: 1,
        }),
      ])
      if (!('content' in data)) {
        throw new Error('No content found')
      }
      return {
        content: Buffer.from(data.content, 'base64'),
        revision: data.sha,
        lastModified: history?.[0]?.commit.author?.date,
        lastModifiedBy: await getUsernamesFromCommit(
          ctx,
          octokit,
          history?.[0],
        ),
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
    return {
      revision: data.content!.sha!,
      lastModified: data.commit!.author!.date!,
      lastModifiedBy: options.userId
        ? [await resolveGitHubUsernameFromId(ctx, octokit, options.userId)]
        : [],
    }
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

  async listContributors(
    ctx: RequestContext,
    path: string,
  ): Promise<ListContributorsResult> {
    const octokit = await resolveOctokit(ctx, this.config.app, this.config.repo)
    const { owner, repo } = this
    const { data } = await octokit.request('POST /graphql', {
      query: `query($path: String!) {
        repository(owner: "${owner}", name: "${repo}") {
          object(expression: "${this.config.branch}") {
            ... on Commit {
              history(first: 100, path: $path) {
                nodes {
                  oid
                  committedDate
                  authors(first: 2) {
                    nodes {
                      user {
                        avatarUrl(size: 64)
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      variables: {
        path,
      },
    })
    const commits = data.data.repository.object.history.nodes
    const profileMap = new Map<string, Contributor>()
    for (const commit of commits) {
      for (const { user } of commit.authors.nodes) {
        if (user.login.endsWith('[bot]')) continue
        const profile = profileMap.get(user.login)
        if (profile) {
          profile.contributions++
        } else {
          profileMap.set(user.login, {
            login: user.login,
            avatarUrl: user.avatarUrl,
            contributions: 1,
          })
        }
      }
    }
    return {
      contributors: Array.from(profileMap.values()).sort(
        (a, b) => b.contributions - a.contributions,
      ),
    }
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

async function getUsernamesFromCommit(
  ctx: RequestContext,
  octokit: ContentsgartenOctokit,
  item?: {
    commit: { message: string }
    author: { login: string } | null
  },
) {
  if (!item) {
    return undefined
  }
  const logins = new Set<string>()
  if (item.author?.login) {
    logins.add(item.author.login)
  }

  // Parse co-authored-by
  const promises: Promise<void>[] = []
  for (const line of item.commit.message.split('\n')) {
    const match = line
      .trim()
      .match(
        /^Co-authored-by: (?:.*) <(\d+)+[^@]+@users\.noreply\.github\.com>$/,
      )
    if (match) {
      promises.push(
        (async () => {
          const username = await resolveGitHubUsernameFromId(
            ctx,
            octokit,
            +match[1],
          )
          if (username) {
            logins.add(username)
          }
        })(),
      )
    }
  }

  await Promise.all(promises)
  const list = Array.from(logins)
  const listWithoutBots = list.filter((login) => !login.endsWith('[bot]'))
  return listWithoutBots.length > 0 ? listWithoutBots : list
}
