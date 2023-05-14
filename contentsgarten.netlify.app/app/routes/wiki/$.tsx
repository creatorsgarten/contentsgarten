import type { LoaderArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Html } from '@contentsgarten/html'
import { Editable } from '~/ui/Editable'
import type { FC } from 'react'
import { useState } from 'react'
import { trpc } from '~/utils/trpc'
import { createServerSideClient } from '~/utils/createServerSideClient.server'
import type { GetPageResult } from 'contentsgarten'

export async function loader(args: LoaderArgs) {
  const client = createServerSideClient()
  const slug = args.params['*'] as string
  return json(await client.view.query({ pageRef: slug, render: true }))
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  const { title } = data
  return {
    title: `${title} | Contentsgarten`,
  }
}

export default function WikiPage() {
  const serverData = useLoaderData<typeof loader>()
  const freshDataQuery = trpc.view.useQuery(
    { pageRef: serverData.pageRef, revalidate: true, render: true },
    { refetchOnWindowFocus: false },
  )
  const data = freshDataQuery.data ?? serverData
  const rendered = data.rendered
  if (!rendered) {
    throw new Error('Page has no rendered content')
  }
  return (
    <div className="p-8">
      <article
        className="prose md:prose-lg max-w-[48rem]"
        style={{ opacity: freshDataQuery.isRefetching ? 0.5 : 1 }}
      >
        <h1>
          {data.title}
          {data.file ? (
            <span className="text-xl pl-2">
              <FileEditor file={data.file} pageRef={data.pageRef} />
            </span>
          ) : null}
        </h1>
        <Html html={rendered.html} />
      </article>
    </div>
  )
}

interface FileEditor {
  file: Exclude<GetPageResult['file'], undefined>
  pageRef: string
}

const FileEditor: FC<FileEditor> = (props) => {
  const { file } = props
  const [cachedContent, setCachedContent] = useState(file.content)
  const [content, setContent] = useState(file.content)
  const save = trpc.save.useMutation()
  const trpcContext = trpc.useContext()

  if (cachedContent !== file.content && content === cachedContent) {
    setCachedContent(file.content)
    setContent(file.content)
  }

  return (
    <Editable
      saving={save.isLoading}
      onSave={async () => {
        try {
          await save.mutateAsync({
            pageRef: props.pageRef,
            newContent: content,
            oldRevision: file.revision,
          })
          trpcContext.view.invalidate({ pageRef: props.pageRef })
          return true
        } catch (error) {
          console.error(error)
          alert(`Unable to save: ${error}`)
          return false
        }
      }}
    >
      <textarea
        className="font-mono p-2 flex-1"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </Editable>
  )
}
