import { once } from 'lodash-es'
import { App, Octokit } from 'octokit'
import pMemoize from 'p-memoize'
import type { WikiContext } from './types'

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

export type GetFileResult = GetFileResultFound | GetFileResultNotFound

export interface GetFileResultFound {
  found: true
  content: string
  sha: string
}

export interface GetFileResultNotFound {
  found: false
}

interface PutFileOptions {
  content: string
  message: string
  userId?: number
  sha?: string
}

export interface PutFileResult {
  sha: string
}

export interface WikiFileSystem {
  getFile: (context: WikiContext, path: string) => Promise<GetFileResult>
  putFile: (
    context: WikiContext,
    path: string,
    options: PutFileOptions,
  ) => Promise<PutFileResult>
}

export const defaultFileSystem: WikiFileSystem = { getFile, putFile }

function isApiError(e: unknown): e is ApiError {
  return 'status' in (e as object) && 'response' in (e as object)
}

interface ApiError {
  status: number
  response: {
    data: any
  }
}
