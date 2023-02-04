import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { ContentsgartenRouter } from '../src/packlets/contentsgarden'
import test, { expect } from '@playwright/test'

const client = createTRPCProxyClient<typeof ContentsgartenRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/contentsgarten',
    }),
  ],
})

test.skip('About', async () => {
  const about = await client.about.query()
  expect(about).toEqual({ name: 'Contentsgarten' })
})
