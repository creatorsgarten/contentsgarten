import { ContentsgartenCache, GitHubTeamResolver } from 'contentsgarten'
import {
  ContentsgartenDefaultCache,
  Contentsgarten,
  GitHubApp,
  GitHubFirebaseAuth,
  GitHubStorage,
  handleContentsgartenRequest,
} from 'contentsgarten'
import { Env } from 'lazy-strict-env'
import { z } from 'zod'
import cookie from 'cookie'
import type { APIRoute } from 'astro'

export const config = {
  testing: Env(
    z.object({
      BACKEND: z.enum(['production', 'real']).default('real'),
    }),
  ),
  credentials: Env(
    z.object({
      GH_APP_PRIVATE_KEY: z.string(),
    }),
  ),
}

let instance: Contentsgarten | undefined

export function getInstance() {
  if (instance) {
    return instance
  }
  const gitHubApp = new GitHubApp({
    appId: 218517,
    privateKey: Buffer.from(
      config.credentials.GH_APP_PRIVATE_KEY,
      'base64',
    ).toString(),
  })
  const contentsgarten = new Contentsgarten({
    storage: new GitHubStorage({
      repo: 'creatorsgarten/wiki',
      branch: 'main',
      app: gitHubApp,
    }),
    auth: new GitHubFirebaseAuth({
      gitHub: {
        app: gitHubApp,
      },
      firebase: {
        apiKey: 'AIzaSyCKZng55l411pps2HgMcuenMQou-NTQ0QE',
        authDomain: 'creatorsgarten-wiki.firebaseapp.com',
        projectId: 'creatorsgarten-wiki',
      },
    }),
    teamResolver: new GitHubTeamResolver(gitHubApp),
    cache: getCache(),
    pageFileExtension: '.md',
  })
  instance = contentsgarten
  return contentsgarten
}

function getCache(): ContentsgartenCache {
  return ((globalThis as any).contentsgartenCache ??=
    new ContentsgartenDefaultCache())
}

export const all: APIRoute = async ({ params, request }) => {
  if (config.testing.BACKEND === 'production') {
    const requestUrl = new URL(request.url)
    const backendUrl = new URL(
      requestUrl.pathname + requestUrl.search,
      'https://wiki.creatorsgarten.org',
    )
    const headers: Record<string, string> = {}
    if (request.headers.get('authorization')) {
      headers.authorization = request.headers.get('authorization')!
    }
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: request.body,
    })
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type')!,
      },
    })
  }

  return handleContentsgartenRequest(
    getInstance(),
    request,
    '/api/contentsgarten',
  )
}
