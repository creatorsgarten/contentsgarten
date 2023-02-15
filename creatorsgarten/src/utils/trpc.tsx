import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import type { ContentsgartenRouter } from 'contentsgarten'
import type { FC, ReactNode } from 'react'

export const trpc = createTRPCReact<typeof ContentsgartenRouter>()
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})
const trpcClient = trpc.createClient({
  links: [httpBatchLink({ url: '/api/contentsgarten' })],
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
