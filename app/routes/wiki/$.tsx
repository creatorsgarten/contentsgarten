import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { getCredentialFromRequest } from '~/auth'
import { WikiActor } from '~/wiki-engine/actor'

export const loader: LoaderFunction = async ({ request, params }) => {
  const actor = new WikiActor(getCredentialFromRequest(request))
  const page = await actor.getPage(params['*'] as string)
  return json(page)
}

export default function WikiPage() {
  const data = useLoaderData()
  return <div className="p-8">I am a wiki page {JSON.stringify(data)}</div>
}
