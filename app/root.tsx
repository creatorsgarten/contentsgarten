import type { LoaderFunction, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import type { WikiAuthState } from './auth'
import { AuthBar, AuthProvider } from './auth/client'

import styles from './styles/app.css'
import { WikiActor } from './wiki-engine/actor'

export function links() {
  return [{ rel: 'stylesheet', href: styles }]
}

interface LoaderData {
  authState: WikiAuthState
}

export const loader: LoaderFunction = async ({ request }) => {
  const actor = WikiActor.fromRequest(request)
  const data: LoaderData = {
    authState: await actor.getAuthState(),
  }
  return json(data)
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'New Remix App',
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
