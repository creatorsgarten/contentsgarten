import type { LoaderArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Html } from '@contentsgarten/html'
import { Editable } from '~/ui/Editable'
import type { FC } from 'react'
import { useState } from 'react'
import { restClient } from '~/utils/restClient'
import { createServerSideRestClient } from '~/utils/createServerSideRestClient.server'
import type { GetPageResult } from 'contentsgarten'

export async function loader(args: LoaderArgs) {
  const client = createServerSideRestClient()
  const slug = args.params['*'] as string
  const { data, error } = await client.GET('/page', {
    params: { query: { pageRef: slug, render: 'true' } },
  })
  if (error) {
    throw new Response(JSON.stringify(error), { status: 500 })
  }
  return json(data)
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  const { title } = data
  return {
    title: `${title} | Contentsgarten`,
  }
}

function pageQueryKey(pageRef: string) {
  return ['contentsgarten', 'page', pageRef] as const
}

export default function WikiPage() {
  const serverData = useLoaderData<typeof loader>()
  const freshDataQuery = useQuery({
    queryKey: pageQueryKey(serverData.pageRef),
    queryFn: async () => {
      const { data, error } = await restClient.GET('/page', {
        params: {
          query: {
            pageRef: serverData.pageRef,
            revalidate: 'true',
            render: 'true',
          },
        },
      })
      if (error) throw error
      return data
    },
    refetchOnWindowFocus: false,
  })
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
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: async (vars: {
      pageRef: string
      newContent: string
      oldRevision?: string
    }) => {
      const { data, error } = await restClient.PUT('/page', {
        params: { query: { pageRef: vars.pageRef } },
        body: {
          newContent: vars.newContent,
          oldRevision: vars.oldRevision,
        },
      })
      if (error) throw error
      return data
    },
  })

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
          queryClient.invalidateQueries({
            queryKey: pageQueryKey(props.pageRef),
          })
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
