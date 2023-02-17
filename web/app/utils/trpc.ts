import { createTRPCReact } from '@trpc/react-query'
import type { CreateTRPCClientOptions } from '@trpc/client'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { ContentsgartenRouter } from 'contentsgarten'

/**
 * For use in React code.
 */
export const trpc = createTRPCReact<typeof ContentsgartenRouter>()

const options: CreateTRPCClientOptions<typeof ContentsgartenRouter> = {
  links: [httpBatchLink({ url: '/api/contentsgarten' })],
}

/**
 * For use in framework-agnostic code.
 */
export const trpcClient =
  createTRPCProxyClient<typeof ContentsgartenRouter>(options)

/**
 * For use in framework-agnostic code.
 */
export const trpcReactClient = trpc.createClient(options)
