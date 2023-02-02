import { LoaderArgs, json } from '@remix-run/node'

export const loader = async (args: LoaderArgs) => {
  return json({ url: args.request.url })
}
