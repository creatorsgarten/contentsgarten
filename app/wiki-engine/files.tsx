import { once } from 'lodash-es'
import { App, Octokit } from 'octokit'
import pMemoize from 'p-memoize'
import type {
  GetFileResult,
  PutFileOptions,
  PutFileResult,
  WikiContext,
  WikiFileSystem,
} from './types'

const getRepoConfig = once(() => {
  const [owner, repo] = (process.env.GH_REPO as string).split('/')
  return { owner, repo }
})

const getOctokit = pMemoize(async () => {
  const userAgent = 'contentsgarten'

  if (process.env.GH_TOKEN) {
    return new Octokit({
      auth: process.env.GH_TOKEN,
      userAgent: userAgent,
    })
  }

  if (process.env.GH_APP_ID) {
    const privateKey = Buffer.from(
      process.env.GH_APP_PRIVATE_KEY as string,
      'base64',
    ).toString()
    const app = new App({
      appId: +process.env.GH_APP_ID,
      privateKey: privateKey,
    })
    const { owner, repo } = getRepoConfig()
    const installationResponse =
      await app.octokit.rest.apps.getRepoInstallation({ owner, repo })
    return app.getInstallationOctokit(installationResponse.data.id)
  }

  throw new Error(
    'No GitHub credentials found. Please set GH_TOKEN or GH_APP_ID+GH_APP_PRIVATE_KEY',
  )
})

const createGitHubFileSystem = (): WikiFileSystem => {
  return { getFile, putFile }

  async function getFile(
    context: WikiContext,
    path: string,
  ): Promise<GetFileResult> {
    context.writeDiagnosticLog(`Fetching file ${path}`)
    const octokit = await getOctokit()
    const { owner, repo } = getRepoConfig()
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      })
      if (!('content' in data)) {
        throw new Error('No content found')
      }
      context.writeDiagnosticLog(`Fetched ${path}`)
      return {
        found: true,
        content: data.content,
        sha: data.sha,
      }
    } catch (error) {
      context.writeDiagnosticLog(`Fetch failed for ${path}: ${error}`)
      if (isApiError(error) && error.status === 404) {
        return { found: false }
      }
      throw error
    }
  }

  async function putFile(
    context: WikiContext,
    path: string,
    options: PutFileOptions,
  ): Promise<PutFileResult> {
    const octokit = await getOctokit()
    const { owner, repo } = getRepoConfig()
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      sha: options.sha,
      content: options.content,
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
      sha: data.content!.sha!,
    }
  }
}

const createCachedFileSystem = (base: WikiFileSystem): WikiFileSystem => {
  const cache = new Map()
  const memoizedGet = pMemoize(
    (context: WikiContext, path: string, miss: () => void) => {
      miss()
      return base.getFile(context, path)
    },
    {
      cache,
      cacheKey: (args) => args[1],
    },
  )
  return {
    getFile: (context, path) => {
      let missed = false
      const promise = memoizedGet(context, path, () => (missed = true))
      if (!missed) {
        context.writeDiagnosticLog(`Cache hit for ${path}`)
      }
      return promise
    },
    putFile: async (context, path, options) => {
      try {
        return await base.putFile(context, path, options)
      } finally {
        cache.clear()
      }
    },
  }
}

export const defaultFileSystem: WikiFileSystem = createCachedFileSystem(
  createGitHubFileSystem(),
)

function isApiError(e: unknown): e is ApiError {
  return 'status' in (e as object) && 'response' in (e as object)
}

interface ApiError {
  status: number
  response: {
    data: any
  }
}
