import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { getCredentialFromRequest } from '~/auth'
import { WikiActor } from '~/wiki-engine/actor'

export const loader: LoaderFunction = async ({ request, params }) => {
  const actor = WikiActor.fromRequest(request)
  return json(await actor.getFile(params['*'] as string))
}
