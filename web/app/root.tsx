import type { MetaFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import { AuthBar, AuthProvider } from './auth/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import { trpc } from './utils/trpc'
import styles from './styles/app.css'

export function links() {
  return [{ rel: 'stylesheet', href: styles }]
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Contentsgarten',
  viewport: 'width=device-width,initial-scale=1',
})

export default function App() {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/api/contentsgarten' })],
    }),
  )
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        <script
          async
          src="https://cdn.jsdelivr.net/npm/iconify-icon@1.0.2/dist/iconify-icon.min.js"
          integrity="sha256-kwd+IKkvIXP95TLOfLvp/rHfnja1G+Ve+u1UR22A02k="
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <Outlet />
              <AuthBar />
              <ScrollRestoration />
              <Scripts />
              <LiveReload />
            </AuthProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </body>
    </html>
  )
}
