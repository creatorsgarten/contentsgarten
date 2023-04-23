import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { ContentsgartenRouter } from 'contentsgarten'
import { config, getInstance } from '../routes/api/contentsgarten/$action'

export function createServerSideClient(_request: Request) {
  const baseUrl = config.testing.BACKEND.includes('://')
    ? config.testing.BACKEND
    : 'http://fake'
  return createTRPCProxyClient<ContentsgartenRouter>({
    links: [
      httpBatchLink({
        url: new URL('/api/contentsgarten', baseUrl).toString(),
        headers: {},
        fetch: (input, init) => {
          if (typeof input === 'string' && input.startsWith('http://fake')) {
            const request = new Request(input, init as RequestInit)
            return import('contentsgarten').then(async (m) =>
              m.handleContentsgartenRequest(
                await getInstance(),
                request,
                '/api/contentsgarten',
              ),
            )
          }
          return fetch(input, init as RequestInit)
        },
      }),
    ],
  })
}
