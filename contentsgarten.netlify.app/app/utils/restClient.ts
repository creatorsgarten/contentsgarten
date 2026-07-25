import createClient from 'openapi-fetch'
import type { paths } from './contentsgarten-openapi-schema'

/**
 * REST API client for use in browser code. Talks to the REST API mounted by
 * this app at `/api/rest` (see `app/routes/api/rest/$.ts`).
 */
export const restClient = createClient<paths>({ baseUrl: '/api/rest' })
