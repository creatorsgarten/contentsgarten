import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { actorFromRequest } from '~/wiki.server'

export const loader: LoaderFunction = async ({ request, params }) => {
  const actor = await actorFromRequest(request)
  return json(await actor.getFile(params['*'] as string))
}
