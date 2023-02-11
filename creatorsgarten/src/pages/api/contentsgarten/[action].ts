import type { ContentsgartenCache } from 'contentsgarten'
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

const env = Env(
  z.object({
    GH_APP_ID: z.coerce.number(),
    GH_APP_PRIVATE_KEY: z.string(),

    REDIS_URL: z.string(),
    CACHE_SIGNING_KEY: z.string(),
  }),
)

let instance: Contentsgarten | undefined

export function getInstance() {
  if (instance) {
    return instance
  }
  const gitHubApp = new GitHubApp({
    appId: env.GH_APP_ID,
    privateKey: Buffer.from(env.GH_APP_PRIVATE_KEY, 'base64').toString(),
  })
  const contentsgarten = new Contentsgarten({
    storage: new GitHubStorage({
      repo: 'creatorsgarten/wiki',
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
    cache: getCache(),
  })
  instance = contentsgarten
  return contentsgarten
}

function getCache(): ContentsgartenCache {
  return ((globalThis as any).contentsgartenCache ??=
    new ContentsgartenDefaultCache())
}

export const all: APIRoute = ({ params, request }) => {
  const parsed = cookie.parse(request.headers.get('Cookie') || '')
  const tokenFromCookie = parsed['contentsgarten_id_token']
  if (tokenFromCookie && !request.headers.get('Authorization')) {
    request.headers.set('Authorization', `Bearer ${tokenFromCookie}`)
  }

  return handleContentsgartenRequest(
    getInstance(),
    request,
    '/api/contentsgarten',
  )
}
