import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { getFile } from '~/wiki-engine/files'

export const loader: LoaderFunction = async ({ request, params }) => {
  return json(await getFile(params['*'] as string))
}
