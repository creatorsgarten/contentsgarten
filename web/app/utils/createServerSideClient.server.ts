import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { ContentsgartenRouter } from 'contentsgarten'
import { handleContentsgartenRequest } from 'contentsgarten'
import { getInstance } from '../routes/api/contentsgarten/$action'

export function createServerSideClient(_request: Request) {
  return createTRPCProxyClient<typeof ContentsgartenRouter>({
    links: [
      httpBatchLink({
        url: new URL('/api/contentsgarten', 'http://fake').toString(),
        headers: {},
        fetch: (input, init) => {
          if (typeof input === 'string' && input.startsWith('http://fake')) {
            const request = new Request(input, init as RequestInit)
            return handleContentsgartenRequest(
              getInstance(),
              request,
              '/api/contentsgarten',
            )
          }
          return fetch(input, init as RequestInit)
        },
      }),
    ],
  })
}
