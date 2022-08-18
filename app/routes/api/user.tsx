import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { WikiAuthState } from 'src/packlets/wiki-auth'
import { actorFromRequest } from '~/wiki.server'

export interface LoaderData {
  authState: WikiAuthState
}

export const loader: LoaderFunction = async ({ request }) => {
  const actor = await actorFromRequest(request)
  const data: LoaderData = {
    authState: await actor.getAuthState(),
  }
  return json(data)
}
