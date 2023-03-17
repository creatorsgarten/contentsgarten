import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import type { ContentsgartenRouter } from 'contentsgarten'
import type { FC, ReactNode } from 'react'
import { queryClient } from './react-query'
import { auth } from './auth'

export const trpc = createTRPCReact<ContentsgartenRouter>()
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/contentsgarten',
      headers: async () => {
        await auth.loadedPromise.catch(() => {})
        const idToken = await auth.getCurrentUser()?.getIdToken()
        return idToken
          ? {
              Authorization: `Bearer ${idToken}`,
            }
          : {}
      },
    }),
  ],
})

export interface TrpcProvider {
  children: ReactNode
}
export const TrpcProvider: FC<TrpcProvider> = (props) => {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
