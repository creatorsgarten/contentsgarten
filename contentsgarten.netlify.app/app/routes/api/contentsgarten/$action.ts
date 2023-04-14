import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import type { Contentsgarten } from 'contentsgarten-cjs'
import {
  createContentsgarten,
  handleContentsgartenRequest,
  testing,
} from 'contentsgarten-cjs'
import cookie from 'cookie'
import { Env } from 'lazy-strict-env'
import { z } from 'zod'

export const config = {
  testing: Env(
    z.object({
      BACKEND: z
        .union([z.enum(['real', 'fake']), z.string().url()])
        .default('real'),
    }),
  ),
  credentials: Env(
    z.object({
      GH_APP_ID: z.coerce.number(),
      GH_APP_PRIVATE_KEY: z.string(),
      GH_REPO: z
        .string()
        .regex(/^[^/\s]+\/[^/\s]+$/, 'Must be <owner>/<repo> format'),

      REDIS_URL: z.string(),
      CACHE_SIGNING_KEY: z.string(),
      MONGODB_URI: z.string(),
    }),
  ),
}

let instance: Contentsgarten | undefined

export function getInstance() {
  if (instance) {
    return instance
  }
  const contentsgarten =
    config.testing.BACKEND === 'fake'
      ? testing.createFakeInstance()
      : createStandloneInstance()
  instance = contentsgarten
  return contentsgarten
}

function createStandloneInstance() {
  const contentsgarten = createContentsgarten({
    firebase: {
      apiKey: 'AIzaSyCKZng55l411pps2HgMcuenMQou-NTQ0QE',
      authDomain: 'creatorsgarten-wiki.firebaseapp.com',
      projectId: 'creatorsgarten-wiki',
    },
    github: {
      auth: {
        appId: config.credentials.GH_APP_ID,
        privateKey: Buffer.from(
          config.credentials.GH_APP_PRIVATE_KEY,
          'base64',
        ).toString(),
      },
      repo: config.credentials.GH_REPO,
      branch: 'main',
    },
    mongodb: {
      uri: config.credentials.MONGODB_URI,
      database: 'contentsgarten_wiki',
    },
    legacyCache: {
      url: config.credentials.REDIS_URL,
      signingKey: config.credentials.CACHE_SIGNING_KEY,
    },
  })
  return contentsgarten
}

export const loader = async (args: LoaderArgs) => {
  return handleRequest(args)
}
export const action = async (args: ActionArgs) => {
  return handleRequest(args)
}
async function handleRequest(args: LoaderArgs | ActionArgs) {
  // If backend is a URL, the API will proxy the request to the remote backend
  // instead of handling it locally.
  if (config.testing.BACKEND.includes('://')) {
    const requestUrl = new URL(args.request.url)
    const backendUrl = new URL(
      requestUrl.pathname + requestUrl.search,
      config.testing.BACKEND,
    )
    const headers: Record<string, string> = {}
    if (args.request.headers.get('authorization')) {
      headers.authorization = args.request.headers.get('authorization')!
    }
    if (args.request.headers.get('cookie')) {
      headers.cookie = args.request.headers.get('cookie')!
    }
    const response = await fetch(backendUrl, {
      method: args.request.method,
      headers,
      body: args.request.body,
    })
    return response
  }

  const { request } = args
  const parsed = cookie.parse(request.headers.get('Cookie') || '')
  const tokenFromCookie = parsed['contentsgarten_id_token']
  if (tokenFromCookie && !request.headers.get('Authorization')) {
    request.headers.set('Authorization', `Bearer ${tokenFromCookie}`)
  }

  return handleContentsgartenRequest(
    getInstance(),
    request,
    '/api/contentsgarten',
  )
}
