import { WikiActor } from 'src/packlets/wiki-engine'
import { getCredentialFromRequest } from './auth'

export async function actorFromRequest(request: Request) {
  const credential = await getCredentialFromRequest(request)
  return new WikiActor(credential)
}
