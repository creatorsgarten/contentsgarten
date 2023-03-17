import {
  CreateTRPCProxyClient,
  createTRPCProxyClient,
  httpBatchLink,
} from '@trpc/client'
import type {} from '@trpc/server'
import type { Contentsgarten, ContentsgartenRouter } from 'contentsgarten'
import { handleContentsgartenRequest } from 'contentsgarten'

export function createServerSideClient(
  base: Contentsgarten | string,
  apiPath = '/api/contentsgarten',
): CreateTRPCProxyClient<ContentsgartenRouter> {
  const baseUrl = typeof base === 'string' ? base : 'http://fake'
  const url = new URL(apiPath, baseUrl).toString()
  return createTRPCProxyClient<ContentsgartenRouter>({
    links: [
      httpBatchLink({
        url,
        headers: {},
        fetch: (input, init) => {
          if (
            typeof input === 'string' &&
            typeof base !== 'string' &&
            input.startsWith('http://fake')
          ) {
            const request = new Request(input, init as RequestInit)
            return handleContentsgartenRequest(base, request, apiPath)
          }
          return fetch(input, init as RequestInit)
        },
      }),
    ],
  })
}
