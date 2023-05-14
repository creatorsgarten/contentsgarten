import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { ContentsgartenRouter } from 'contentsgarten'
import { config, getInstance } from '../routes/api/contentsgarten/$action'
import { localLink } from '@contentsgarten/server-utils'

export function createServerSideClient() {
  return createTRPCProxyClient<ContentsgartenRouter>({
    links: [
      config.testing.BACKEND.includes('://')
        ? httpBatchLink({ url: config.testing.BACKEND })
        : localLink(
            () => import('contentsgarten').then((m) => m.ContentsgartenRouter),
            () => getInstance().then((instance) => instance.createContext({})),
          ),
    ],
  })
}
