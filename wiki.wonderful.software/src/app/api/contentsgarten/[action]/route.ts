import {
  Contentsgarten,
  createContentsgarten,
  handleContentsgartenRequest,
} from 'contentsgarten'
import { Env } from 'lazy-strict-env'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const config = {
  testing: Env(
    z.object({
      BACKEND: z.enum(['production', 'real']).default('real'),
    }),
  ),
  credentials: Env(
    z.object({
      GH_APP_PRIVATE_KEY_309602: z.string(),
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
      apiKey: 'AIzaSyARMFoJ_pvFwev2738Dn19BJogq1NqPcRQ',
      authDomain: 'wonderful-software.firebaseapp.com',
      projectId: 'wonderful-software',
    },
    github: {
      auth: {
        appId: 309602,
        privateKey: Buffer.from(
          config.credentials.GH_APP_PRIVATE_KEY_309602,
          'base64',
        ).toString(),
      },
      repo: 'wonderfulsoftware/wiki',
      branch: 'main',
    },
    mongodb: {
      uri: config.credentials.MONGO_URI,
      database: 'wonderfulsoftware_wiki',
    },
    pageFileExtension: '.md',
    authorizer: (ctx) => {
      if (ctx.user.id === 193136) {
        return { granted: true }
      }
      return {
        granted: false,
        reason: 'Right now only @dtinth can edit this wiki.',
      }
    },
  })
  instance = contentsgarten
  return contentsgarten
}

const handleRequest = async (request: Request) => {
  if (config.testing.BACKEND === 'production') {
    const requestUrl = new URL(request.url)
    const backendUrl = new URL(
      requestUrl.pathname + requestUrl.search,
      'https://wiki.wonderful.software',
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

export async function GET(request: Request) {
  return handleRequest(request)
}

export async function POST(request: Request) {
  return handleRequest(request)
}
