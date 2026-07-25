import type { APIRoute } from 'astro'
import { handleContentsgartenRestRequest } from 'contentsgarten'
import {
  config,
  getInstance,
  proxyToProduction,
} from '../../../utils/contentsgarten'

export const ALL: APIRoute = async ({ request }) => {
  if (config.testing.BACKEND === 'production') {
    return proxyToProduction(request)
  }

  return handleContentsgartenRestRequest(getInstance(), '/api/rest')(request)
}
