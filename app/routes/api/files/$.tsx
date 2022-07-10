import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { WikiActor } from '~/wiki-engine'

export const loader: LoaderFunction = async ({ request, params }) => {
  const actor = await WikiActor.fromRequest(request)
  return json(await actor.getFile(params['*'] as string))
}
