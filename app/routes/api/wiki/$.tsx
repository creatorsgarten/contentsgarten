import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import { WikiPage } from 'src/packlets/wiki-engine'
import { actorFromRequest } from '~/wiki.server'

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
  const result = await actor.updatePage(slug, {
    content: formData.get('content') as string,
    sha: formData.get('sha') as string | undefined,
  })
  if (result.ok && formData.get('redirect') === 'view') {
    return redirect(`/wiki/${slug}`)
  }
  Object.assign(result, { _diagnosticLog: actor.diagnosticLog })
  return json({ result })
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const actor = await actorFromRequest(request)
  const slug = params['*'] as string
  if (!slug) {
    return new Response('', {
      status: 302,
      headers: {
        Location: '/wiki/MainPage',
      },
    })
  }
  const searchParams = new URL(request.url).searchParams
  const page = await actor.getPage(slug)
  const error = (message: string): LoaderData => ({
    pageTitle: slug,
    view: {
      page: {
        content: '**An error has occurred.** ' + message,
        path: slug,
      },
    },
  })
  const result = await (async (): Promise<LoaderData> => {
    if (searchParams.get('action') === 'edit' && page.file) {
      const file = await actor.getFile(page.file.path)
      return {
        pageTitle: `${file.found ? 'Editing' : 'Creating'} ${slug}`,
        edit: {
          formTarget: `/wiki/${page.path}?action=edit`,
          apiTarget: `/api/wiki/${page.path}`,
          gitHubEditPath: `https://github.dev/creatorsgarten/contentsgarten-wiki/blob/main/${page.file.path}`,
          content: file.found
            ? Buffer.from(file.content, 'base64').toString()
            : '',
          sha: file.found ? file.sha : undefined,
        },
      }
    } else {
      return {
        pageTitle: slug,
        view: {
          page,
          editPath: `/wiki/${page.path}?action=edit`,
        },
      }
    }
  })()
  Object.assign(result, { _diagnosticLog: actor.diagnosticLog })
  return json(result)
}
