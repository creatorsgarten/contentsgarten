import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import type { WikiAuthState } from '~/auth'
import { WikiActor } from '~/wiki-engine/actor'

export interface LoaderData {
  authState: WikiAuthState
}

export const loader: LoaderFunction = async ({ request }) => {
  const actor = await WikiActor.fromRequest(request)
  const data: LoaderData = {
    authState: await actor.getAuthState(),
  }
  return json(data)
}
