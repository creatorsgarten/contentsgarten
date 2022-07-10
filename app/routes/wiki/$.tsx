import type { LoaderFunction, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { getCredentialFromRequest } from '~/auth'
import { Markdown } from '~/markdown'
import type { WikiPage } from '~/wiki-engine'
import { WikiActor } from '~/wiki-engine/actor'

interface LoaderData {
  edit?: WikiPageEdit
  view?: {
    page: WikiPage
    editPath?: string
  }
  pageTitle: string
}

interface WikiPageEdit {
  gitHubEditPath?: string
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const actor = new WikiActor(getCredentialFromRequest(request))
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
  const result = await (async (): Promise<LoaderData> => {
    if (searchParams.get('action') === 'edit' && page.file) {
      return {
        pageTitle: `Editing ${slug}`,
        edit: {
          gitHubEditPath: `https://github.dev/creatorsgarten/contentsgarten-wiki/blob/main/${page.file.path}`,
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
  return json(result)
}

export const meta: MetaFunction = ({ data, params }) => {
  const { pageTitle } = data as LoaderData
  return {
    title: `${pageTitle} | Contentsgarten`,
  }
}

export default function WikiPage() {
  const data: LoaderData = useLoaderData()
  return (
    <div className="p-8">
      <article className="prose">
        <h1>
          {data.pageTitle}
          {!!data.view?.editPath && (
            <Link
              to={data.view.editPath}
              className="inline-block ml-2"
              title="Edit this page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                width="16"
                height="16"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"
                ></path>
              </svg>
            </Link>
          )}
        </h1>

        {!!data.view && (
          <>
            <Markdown text={data.view.page.content} />
          </>
        )}

        {!!data.edit && (
          <>
            <ul>
              <li>
                <a href={data.edit.gitHubEditPath}>
                  Edit this file on github.dev
                </a>
              </li>
            </ul>
          </>
        )}
      </article>
    </div>
  )
}
