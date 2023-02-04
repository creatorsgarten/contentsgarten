import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import {
  Contentsgarten,
  GitHubApp,
  GitHubFirebaseAuth,
  GitHubStorage,
  handleContentsgartenRequest,
} from 'src/packlets/contentsgarden'
import { Env } from 'lazy-strict-env'
import { z } from 'zod'
import cookie from 'cookie'

const env = Env(
  z.object({
    GH_APP_ID: z.coerce.number(),
    GH_APP_PRIVATE_KEY: z.string(),
    GH_REPO: z
      .string()
      .regex(/^[^/\s]+\/[^/\s]+$/, 'Must be <owner>/<repo> format'),
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
      repo: env.GH_REPO,
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
  })
  instance = contentsgarten
  return contentsgarten
}

export const loader = async (args: LoaderArgs) => {
  return handleRequest(args)
}
export const action = async (args: ActionArgs) => {
  return handleRequest(args)
}
function handleRequest(args: LoaderArgs | ActionArgs) {
  const { request } = args
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
