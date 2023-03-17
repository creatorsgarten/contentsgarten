import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { ContentsgartenRouter } from 'contentsgarten-cjs'
import test, { expect } from '@playwright/test'

const client = createTRPCProxyClient<typeof ContentsgartenRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/contentsgarten',
    }),
  ],
})

test('About has name', async () => {
  const about = await client.about.query()
  expect(about).toEqual(
    expect.objectContaining({
      name: 'Contentsgarten',
    }),
  )
})
