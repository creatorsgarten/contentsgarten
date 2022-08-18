import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import { WikiPage } from 'src/packlets/wiki-engine'
import { RedirectToPageRef } from 'src/packlets/wiki-engine/throwables'
import { actorFromRequest, respond } from '~/wiki.server'

export interface LoaderData {
  edit?: WikiPageEdit
  view?: {
    page: WikiPage
    editPath?: string
  }
  pageTitle: string
}

export interface WikiPageEdit {
  formTarget: string
  apiTarget: string
  gitHubEditPath?: string
  content: string
  sha?: string
}

export const action: ActionFunction = async ({ request, params }) => {
  const actor = await actorFromRequest(request)
  const slug = params['*'] as string
  const formData = await request.formData()
  return respond(actor, () =>
    actor.update(slug, {
      content: formData.get('content') as string,
      sha: formData.get('sha') as string | undefined,
      redirect: formData.get('redirect') as any,
    }),
  )
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const actor = await actorFromRequest(request)
  const slug = params['*'] as string
  const searchParams = new URL(request.url).searchParams
  if (searchParams.get('action') === 'edit') {
    return respond(actor, () => actor.edit(slug))
  } else {
    return respond(actor, () => actor.view(slug))
  }
}
