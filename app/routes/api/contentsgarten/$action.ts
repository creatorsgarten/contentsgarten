import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Contentsgarten, GitHubStorage } from 'src/packlets/contentsgarden'

const contentsgarten = new Contentsgarten({
  storage: new GitHubStorage({
    repo: process.env.GH_REPO!,
    appId: +process.env.GH_APP_ID!,
    privateKey: process.env.GH_PRIVATE_KEY!,
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
