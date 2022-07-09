import type { LoaderFunction } from '@remix-run/node'

export const loader: LoaderFunction = async ({ request, params }) => {
  return new Response('', {
    status: 302,
    headers: {
      Location: '/wiki/MainPage',
    },
  })
}
