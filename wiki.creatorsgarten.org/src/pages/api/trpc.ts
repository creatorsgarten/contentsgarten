import { getInstance } from './contentsgarten/[action]'
import { handleContentsgartenRequest } from 'contentsgarten'

import type { APIRoute } from 'astro'

export const all: APIRoute = ({ request }) => {
  return handleContentsgartenRequest(
    getInstance(),
    request,
    '/api/trpc',
  )
}
