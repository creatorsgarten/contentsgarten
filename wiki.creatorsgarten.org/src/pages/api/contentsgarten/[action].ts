import type { APIRoute } from 'astro'
import {
  Contentsgarten,
  createContentsgarten,
  handleContentsgartenRequest,
} from 'contentsgarten'
import { Env } from 'lazy-strict-env'
import { z } from 'zod'

export const config = {
  testing: Env(
    z.object({
      BACKEND: z.enum(['production', 'real']).default('real'),
    }),
  ),
  credentials: Env(
    z.object({
      GH_APP_PRIVATE_KEY: z.string(),
      MONGO_URI: z.string(),
    }),
  ),
}

let instance: Contentsgarten | undefined

export function getInstance() {
  if (instance) {
    return instance
  }
  const contentsgarten = createContentsgarten({
    firebase: {
      apiKey: 'AIzaSyCKZng55l411pps2HgMcuenMQou-NTQ0QE',
      authDomain: 'creatorsgarten-wiki.firebaseapp.com',
      projectId: 'creatorsgarten-wiki',
    },
    github: {
      auth: {
        appId: 218517,
        privateKey: Buffer.from(
          config.credentials.GH_APP_PRIVATE_KEY,
          'base64',
        ).toString(),
      },
      repo: 'creatorsgarten/wiki',
      branch: 'main',
    },
    mongodb: {
      uri: config.credentials.MONGO_URI,
      database: 'creatorsgarten_wiki',
    },
    pageFileExtension: '.md',
  })
  instance = contentsgarten
  return contentsgarten
}

export const all: APIRoute = async ({ params, request }) => {
  if (config.testing.BACKEND === 'production') {
    const requestUrl = new URL(request.url)
    const backendUrl = new URL(
      requestUrl.pathname + requestUrl.search,
      'https://wiki.creatorsgarten.org',
    )
    const headers: Record<string, string> = {}
    if (request.headers.get('authorization')) {
      headers.authorization = request.headers.get('authorization')!
    }
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: request.body,
    })
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type')!,
      },
    })
  }

  return handleContentsgartenRequest(
    getInstance(),
    request,
    '/api/contentsgarten',
  )
}
