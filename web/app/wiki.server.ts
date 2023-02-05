import type { TypedResponse } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { WikiActor } from 'src/packlets/wiki-engine'
import { RedirectToPageRef, WikiError } from 'src/packlets/wiki-engine'
import { getCredentialFromRequest } from './auth'

export async function actorFromRequest(request: Request) {
  const credential = await getCredentialFromRequest(request)
  return new WikiActor(credential)
}

export async function respond<T>(
  actor: WikiActor,
  f: () => T,
): Promise<TypedResponse<Awaited<T>>> {
  try {
    const result = await f()
    if (result && typeof result === 'object') {
      Object.assign(result, { _diagnosticLog: actor.diagnosticLog })
    }
    return json(result)
  } catch (e) {
    if (e instanceof RedirectToPageRef) {
      return redirect(`/wiki/${e.pageRef}`)
    }
    if (e instanceof WikiError) {
      console.error(e)
      return json(
        {
          error: {
            status: e.status,
            code: e.code,
            message: e.message,
          },
          _diagnosticLog: actor.diagnosticLog,
        },
        { status: e.status },
      )
    }
    throw e
  }
}
