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
    customJwtAuth: {
      jwks: {
        keys: [
          {
            kid: 'riffy1',
            kty: 'RSA',
            n: 'jwkfv-nTypGWr4bH1Ewddm4X_cIB8b6G3NmHCMW4Hlu2frBSR7-iDf2ilk6Y5sBoeeVMikuJrx2EyokfnsB6J-uok6XauwVa1UCQ9Blnv9yPuSaM-Lyvdo7PFLpLX7f68-sLSzuNxv51fL8VW8OpnTo0kMLRTGB9FwYGrDcsq_h0reCRdPKxiypiPiKOe106YO0eTKtm5m4Jw6hIE26x2-s09SB7Uh-d8700RomOCKXdKuXR5cFx5B37JZuvHxaGd16hZq6_ok5bnu0NQSkeEfNMRQ03xLjs7OZWKLs056HGrP_17HhaPzd2ceoGsWSmDIFMOEjFTUwUtkMPGyAmdw',
            e: 'AQAB',
          },
        ],
      },
    },
    authorizer: async ({ gitHub, user }) => {
      if (await gitHub.isUserInTeam(user, 'creatorsgarten', 'creators')) {
        return { granted: true }
      }
      return {
        granted: false,
        reason:
          'You should be in the "creators" team to edit the wiki. To join, submit a PR to https://github.com/creatorsgarten/configuration/blob/main/index.ts',
      }
    },
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

  console.log('request', request.url)
  return handleContentsgartenRequest(
    getInstance(),
    request,
    '/api/contentsgarten',
  )
}
