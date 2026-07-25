import createClient from 'openapi-fetch'
import { handleContentsgartenRestRequest } from 'contentsgarten'
import type { paths } from './contentsgarten-openapi-schema'
import { config, getInstance } from '../routes/api/contentsgarten/$action'

const REST_PREFIX = '/api/rest'

/**
 * REST API client for use in server-side (loader/action) code. Mirrors
 * `createServerSideClient.server.ts`'s tRPC equivalent: when the app is
 * configured to proxy to a remote backend (`BACKEND` is a URL), requests are
 * forwarded over HTTP; otherwise the REST handler is invoked in-process,
 * without going over the network.
 */
export function createServerSideRestClient() {
  return createClient<paths>({
    // Dummy origin: requests never actually leave the process unless
    // `BACKEND` is configured as a URL (handled below), in which case the
    // path + query is re-resolved against that URL.
    baseUrl: `http://localhost${REST_PREFIX}`,
    fetch: async (request: Request) => {
      if (config.testing.BACKEND.includes('://')) {
        const requestUrl = new URL(request.url)
        const backendUrl = new URL(
          requestUrl.pathname + requestUrl.search,
          config.testing.BACKEND,
        )
        return fetch(backendUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          // @ts-expect-error -- required by undici when forwarding a stream body
          duplex: request.body ? 'half' : undefined,
        })
      }

      const instance = await getInstance()
      return handleContentsgartenRestRequest(instance, REST_PREFIX)(request)
    },
  })
}
