import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { handleContentsgartenRestRequest } from 'contentsgarten'
import cookie from 'cookie'
import { config, getInstance } from '../contentsgarten/$action'

/**
 * Self-hosts the `contentsgarten` REST API at `/api/rest/*`, mirroring how
 * `wiki.creatorsgarten.org`'s `src/pages/api/wiki/[...path].ts` mounts it via
 * `handleContentsgartenRestRequest`. This runs alongside the existing tRPC
 * route (`../contentsgarten/$action.ts`), which it also reuses `config` and
 * `getInstance` from so there's a single instance of the engine.
 */
export const loader = async (args: LoaderArgs) => handleRequest(args)
export const action = async (args: ActionArgs) => handleRequest(args)

async function handleRequest(args: LoaderArgs | ActionArgs) {
  const { request } = args

  // If backend is a URL, the API will proxy the request to the remote backend
  // instead of handling it locally.
  if (config.testing.BACKEND.includes('://')) {
    const requestUrl = new URL(request.url)
    const backendUrl = new URL(
      requestUrl.pathname + requestUrl.search,
      config.testing.BACKEND,
    )
    const headers: Record<string, string> = {}
    if (request.headers.get('authorization')) {
      headers.authorization = request.headers.get('authorization')!
    }
    if (request.headers.get('cookie')) {
      headers.cookie = request.headers.get('cookie')!
    }
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: request.body,
    })
    return response
  }

  const parsed = cookie.parse(request.headers.get('Cookie') || '')
  const tokenFromCookie = parsed['contentsgarten_id_token']
  if (tokenFromCookie && !request.headers.get('Authorization')) {
    request.headers.set('Authorization', `Bearer ${tokenFromCookie}`)
  }

  const instance = await getInstance()
  return handleContentsgartenRestRequest(instance, '/api/rest')(request)
}
