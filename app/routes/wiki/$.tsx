import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import type { FC } from 'react'
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
  content: string
  sha?: string
}

export const action: ActionFunction = async ({ request, params }) => {
  const actor = WikiActor.fromRequest(request)
  const slug = params['*'] as string
  const formData = await request.formData()
  const result = await actor.updatePage(slug, {
    content: formData.get('content') as string,
    sha: formData.get('sha') as string | undefined,
  })
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const actor = WikiActor.fromRequest(request)
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
      <article className="prose max-w-[48rem]">
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
            <WikiPageEditor edit={data.edit} />
          </>
        )}
      </article>
    </div>
  )
}

const WikiPageEditor: FC<{ edit: WikiPageEdit }> = ({ edit }) => {
  return (
    <Form method="post">
      <p>
        <textarea
          name="content"
          className="w-full h-[24rem] rounded border border-gray-500 p-2 font-mono text-sm"
          defaultValue={edit.content}
        ></textarea>
      </p>
      <p>
        <button className="rounded border-2 border-gray-500 px-3 py-1">
          Save Changes
        </button>
      </p>
      <input type="hidden" name="sha" value={edit.sha} />
    </Form>
  )
}
