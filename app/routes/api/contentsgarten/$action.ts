import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import {
  Contentsgarten,
  GitHubApp,
  GitHubFirebaseAuth,
  GitHubStorage,
} from 'src/packlets/contentsgarden'

const gitHubApp = new GitHubApp({
  appId: +process.env.GH_APP_ID!,
  privateKey: process.env.GH_PRIVATE_KEY!,
})
const contentsgarten = new Contentsgarten({
  storage: new GitHubStorage({
    repo: process.env.GH_REPO!,
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
export function handleRequest(args: LoaderArgs | ActionArgs) {
  const searchParams = new URL(args.request.url).searchParams
  const postBody = args.request.method === 'POST' ? args.request.json() : null
  return contentsgarten.handleRequest({
    action: args.params.action!,
    method: args.request.method,
    params: {
      ...(postBody || {}),
      ...Object.fromEntries(searchParams),
    },
    authorization: args.request.headers.get('authorization'),
  })
}
