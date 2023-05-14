import { httpLink } from '@trpc/client'
import type { AnyRouter, inferRouterContext } from '@trpc/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

/**
 * Creates a tRPC link that uses the local tRPC router.
 * @param router - The tRPC router to use.
 * @param context - The context to pass to the router.
 * @returns a tRPC link that can be used with `createClient` or `createTRPCProxyClient`.
 */
export function localLink<TRouter extends AnyRouter>(
  router: TRouter,
  context: inferRouterContext<TRouter>,
) {
  return httpLink({
    url: 'http://local',
    fetch: async (...args) => {
      const request = new Request(...args)
      return fetchRequestHandler({
        endpoint: '',
        req: request,
        router,
        createContext: () => context,
      })
    },
  })
}
