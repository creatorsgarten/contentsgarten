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
import type { LoaderData } from './routes/api/user'

import { loader } from '~/routes/api/user'
import styles from './styles/app.css'

export function links() {
  return [{ rel: 'stylesheet', href: styles }]
}

export { loader }

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Contentsgarten',
  viewport: 'width=device-width,initial-scale=1',
})

export default function App() {
  const data: LoaderData = useLoaderData()
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <AuthProvider initialState={data.authState}>
          <Outlet />
          <AuthBar />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </AuthProvider>
      </body>
    </html>
  )
}
