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

const env = Env(
  z.object({
    GH_APP_ID: z.coerce.number(),
    GH_APP_PRIVATE_KEY: z.string(),
    GH_REPO: z
      .string()
      .regex(/^[^/\s]+\/[^/\s]+$/, 'Must be <owner>/<repo> format'),
  }),
)
const gitHubApp = new GitHubApp({
  appId: env.GH_APP_ID,
  privateKey: Buffer.from(env.GH_APP_PRIVATE_KEY, 'base64').toString(),
})
export const contentsgarten = new Contentsgarten({
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

export const loader = async (args: LoaderArgs) => {
  return handleRequest(args)
}
export const action = async (args: ActionArgs) => {
  return handleRequest(args)
}
function handleRequest(args: LoaderArgs | ActionArgs) {
  return handleContentsgartenRequest(
    contentsgarten,
    args.request,
    '/api/contentsgarten',
  )
}
