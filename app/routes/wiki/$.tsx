import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { getCredentialFromRequest } from '~/auth'
import { Markdown } from '~/markdown'
import type { WikiPage } from '~/wiki-engine'
import { WikiActor } from '~/wiki-engine/actor'

export const loader: LoaderFunction = async ({ request, params }) => {
  const actor = new WikiActor(getCredentialFromRequest(request))
  const page = await actor.getPage(params['*'] as string)
  return json(page)
}

export default function WikiPage() {
  const data: WikiPage = useLoaderData()
  return (
    <div className="p-8">
      <article className="prose">
        <h1>{data.path}</h1>

        <Markdown text={data.content} />
      </article>
    </div>
  )
}
